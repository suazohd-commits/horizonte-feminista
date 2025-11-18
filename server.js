// server.js
const express = require('express');
const path = require('path');

require('dotenv').config(); // Para cargar la clave desde un archivo .env

const app = express();
const port = 3000;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Middleware para procesar JSON en las peticiones
app.use(express.json());

// Servir archivos estáticos del proyecto (HTML, CSS, JS, imágenes)
app.use(express.static(path.join(__dirname)));

// ************************************************
// Carga la clave de la API desde un archivo .env
// En producción, tu clave NO debe estar aquí.
// ************************************************

// Verificación básica de la clave de API
if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY no está configurada en el archivo .env');
}

// 1. Configura CORS para permitir solicitudes desde tu frontend
// Si tu frontend está en http://localhost:8080, cámbialo aquí.
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // **¡IMPORTANTE!** Cambia '*' por tu dominio real
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
    next();
});

// Fallback: si se navega sin extensión, servir index.html (opcional)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Responder preflight CORS
app.options('/api/gemini-chat', (req, res) => {
    res.sendStatus(200);
});

// Endpoint de depuración: devuelve configuración efectiva
app.get('/api/debug', (req, res) => {
    const modelEnv = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const versionEnv = process.env.GEMINI_API_VERSION; // si viene en .env, respetar
    const versions = versionEnv ? [versionEnv] : ['v1beta', 'v1'];
    const models = [
        modelEnv,
        `${modelEnv}-latest`,
        'gemini-2.5-flash',
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b'
    ];
    res.json({
        GEMINI_API_VERSION: process.env.GEMINI_API_VERSION || '(auto v1beta->v1)',
        GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash (default)',
        versionsToTry: versions,
        modelsToTry: models
    });
});

// 2. Define el Endpoint Proxy que el JavaScript del navegador llamará
app.post('/api/gemini-chat', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'Missing prompt in request body.' });
    }

    try {
        // Llama a la API REST de Gemini en el servidor
        const apiKey = process.env.GEMINI_API_KEY;
        const modelEnv = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
        // Siempre intentamos ambas versiones independientemente del .env para tener más resiliencia
        const versions = ['v1', 'v1beta'];
        // Preferimos modelos más ligeros primero para evitar sobrecarga
        const models = [
            'gemini-1.5-flash-8b',
            'gemini-1.5-flash',
            'gemini-2.0-flash',
            'gemini-2.5-flash',
            modelEnv
        ];

        const tried = [];
        const body = JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }]}] });

        let attempts = 0;
        for (const v of versions) {
            for (const m of models) {
                attempts++;
                const url = `https://generativelanguage.googleapis.com/${v}/models/${m}:generateContent?key=${apiKey}`;
                const upstream = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body
                });

                if (upstream.ok) {
                    const payload = await upstream.json();
                    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text || 'No se recibió texto.';
                    return res.json({ response: text, model: m, apiVersion: v });
                }

                const detail = await upstream.text();
                tried.push({ apiVersion: v, model: m, status: upstream.status, statusText: upstream.statusText, detail });
                console.error('Upstream non-OK', { apiVersion: v, model: m, status: upstream.status, statusText: upstream.statusText, detail });

                // Backoff para 429/500/503 y seguir probando siguientes combinaciones
                if ([429, 500, 503].includes(upstream.status)) {
                    await sleep(600);
                    continue;
                }
                // Para 404/400 simplemente continuar a la siguiente combinación sin bloquear
                if (attempts >= 10) {
                    break;
                }
            }
        }

        return res.status(503).json({ message: 'Gemini upstream error after fallbacks', tried });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ 
            message: "Error connecting to the Gemini API.",
            detail: error.message,
            tried: []
        });
    }
});

// Inicia el servidor
app.listen(port, () => {
    console.log(`Gemini Proxy Server running at http://localhost:${port}`);
    console.log('Config:', {
        GEMINI_API_VERSION: process.env.GEMINI_API_VERSION || '(auto v1beta->v1)',
        GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash (default)'
    });
});