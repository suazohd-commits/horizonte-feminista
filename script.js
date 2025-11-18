// ====================================================
// === LÓGICA PRINCIPAL DEL SITIO Y WIDGET DE CHAT DE IA ===
// ====================================================

document.addEventListener('DOMContentLoaded', () => {

    // --- Configuración Crítica de la API ---
    // El frontend solo llama al proxy seguro
    const PROXY_SERVER_URL = 'http://localhost:3000/api/gemini-chat';

    // --- Elementos del Chat y Tema ---
    const chatButton = document.getElementById('floating-ai-button');
    const chatWindow = document.getElementById('ai-chat-window');
    const closeButton = document.getElementById('close-chat-button');
    const sendButton = document.getElementById('send-button');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');

    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.querySelector('html');
    const themeLink = document.getElementById('theme-style');

    // --- Elementos del Plan de Capacitación (conceptos.html) ---
    const modulesList = document.getElementById('video-modules');
    const trainingPlayer = document.getElementById('training-player');
    const videoFallbackLink = document.getElementById('video-fallback-link');

    // --- CTAs para continuar capacitación (index.html) ---
    const heroCta = document.getElementById('hero-cta');
    const teaserCta = document.getElementById('teaser-cta');

    // --- Elementos de Alineación (conceptos.html) ---
    const align1Btn = document.getElementById('align-1');
    const align2Btn = document.getElementById('align-2');
    const align1View = document.getElementById('concepts-align-1');
    const align2View = document.getElementById('concepts-align-2');

    // --- Elementos del Editor de Carteles ---
    const posterCanvas = document.getElementById('poster-canvas');
    const bgColorInput = document.getElementById('bg-color');
    const swatches = document.querySelectorAll('.bg-swatch');
    const headlineInput = document.getElementById('headline');
    const headlineSize = document.getElementById('headline-size');
    const headlineColor = document.getElementById('headline-color');
    const subtextInput = document.getElementById('subtext');
    const subtextSize = document.getElementById('subtext-size');
    const subtextColor = document.getElementById('subtext-color');
    const ratioSelect = document.getElementById('ratio');
    const downloadBtn = document.getElementById('download-poster');

    // ----------------------------------------------------
    // --- 1. Lógica del Tema (Modo Claro/Oscuro PERSISTENTE) ---
    // ----------------------------------------------------

    function applyTheme(theme) {
        htmlElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        if (themeLink) {
            themeLink.setAttribute('href', theme === 'dark' ? 'theme-dark.css' : 'theme-light.css');
        }
    }

    // 1.1. Cargar Tema al iniciar
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        const initialTheme = htmlElement.getAttribute('data-theme') || 'dark';
        applyTheme(initialTheme);
    }

    // 1.2. Cambiar Tema al hacer clic
    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    // ----------------------------------------------------
    // --- 4. Toggle de vistas en olas.html (Definiciones <-> Timeline) ---
    // ----------------------------------------------------
    const defSection = document.getElementById('definitions-view');
    const timelineSection = document.getElementById('timeline');
    const btnDef = document.getElementById('view-def');
    const btnTimeline = document.getElementById('view-timeline');

    function activateDefinitions() {
        if (!defSection || !timelineSection) return;
        defSection.classList.remove('view-hidden');
        timelineSection.classList.add('view-hidden');
        if (btnDef && btnTimeline) {
            btnDef.classList.add('primary-btn');
            btnDef.classList.remove('secondary-btn');
            btnTimeline.classList.add('secondary-btn');
            btnTimeline.classList.remove('primary-btn');
        }
        document.querySelector('.wave-details-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        try { window._feministMap?.invalidateSize(); } catch {}
    }

    function activateTimeline() {
        if (!defSection || !timelineSection) return;
        defSection.classList.add('view-hidden');
        timelineSection.classList.remove('view-hidden');
        if (btnDef && btnTimeline) {
            btnDef.classList.add('secondary-btn');
            btnDef.classList.remove('primary-btn');
            btnTimeline.classList.add('primary-btn');
            btnTimeline.classList.remove('secondary-btn');
        }
        document.getElementById('timeline')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        try { window._feministMap?.invalidateSize(); } catch {}
    }

    btnDef?.addEventListener('click', activateDefinitions);
    btnTimeline?.addEventListener('click', activateTimeline);

    // ----------------------------------------------------
    // --- 4.b Toggle de vistas en conceptos.html (Alineación 1/2) ---
    // ----------------------------------------------------
    function activateAlign1() {
        if (!align1View || !align2View) return;
        // Ocultar todo primero
        align1View.classList.add('view-hidden');
        align2View.classList.add('view-hidden');
        // Mostrar solo Alineación 1
        align1View.classList.remove('view-hidden');
        if (align1Btn && align2Btn) {
            align1Btn.classList.add('primary-btn');
            align1Btn.classList.remove('secondary-btn');
            align2Btn.classList.add('secondary-btn');
            align2Btn.classList.remove('primary-btn');
            align1Btn.disabled = true;
            align2Btn.disabled = false;
            align1Btn.setAttribute('aria-pressed', 'true');
            align2Btn.setAttribute('aria-pressed', 'false');
        }
        try { localStorage.setItem('concepts_view', 'align1'); } catch {}
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function activateAlign2() {
        if (!align1View || !align2View) return;
        // Ocultar todo primero
        align1View.classList.add('view-hidden');
        align2View.classList.add('view-hidden');
        // Mostrar solo Alineación 2
        align2View.classList.remove('view-hidden');
        if (align1Btn && align2Btn) {
            align1Btn.classList.add('secondary-btn');
            align1Btn.classList.remove('primary-btn');
            align2Btn.classList.add('primary-btn');
            align2Btn.classList.remove('secondary-btn');
            align1Btn.disabled = false;
            align2Btn.disabled = true;
            align1Btn.setAttribute('aria-pressed', 'false');
            align2Btn.setAttribute('aria-pressed', 'true');
        }
        try { localStorage.setItem('concepts_view', 'align2'); } catch {}
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    align1Btn?.addEventListener('click', activateAlign1);
    align2Btn?.addEventListener('click', activateAlign2);

    // Estado inicial: leer preferencia; por defecto Alineación 1
    if (align1View && align2View) {
        let pref = null;
        try { pref = localStorage.getItem('concepts_view'); } catch {}
        if (pref === 'align2') {
            activateAlign2();
        } else {
            activateAlign1();
        }
    }

    // ----------------------------------------------------
    // --- 5. Manejo del menú lateral de videos (Conceptos) ---
    // ----------------------------------------------------
    if (modulesList && trainingPlayer) {
        modulesList.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-video]');
            if (!btn) return;

            const videoId = btn.getAttribute('data-video');
            const title = btn.getAttribute('data-title') || 'Reproductor';

            // Actualizar iframe y link de fallback
            const src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
            trainingPlayer.setAttribute('src', src);
            trainingPlayer.setAttribute('title', title);
            if (videoFallbackLink) {
                videoFallbackLink.setAttribute('href', `https://www.youtube.com/watch?v=${videoId}`);
            }

            // Actualizar estado activo visual
            modulesList.querySelectorAll('.video-module-item').forEach(li => li.classList.remove('active'));
            const li = btn.closest('.video-module-item');
            if (li) li.classList.add('active');

            // Persistir último módulo visto
            try {
                localStorage.setItem('training_last', JSON.stringify({ videoId, title }));
            } catch {}
        });
    }

    // ----------------------------------------------------
    // --- 6. Galería de Carteles (tipo Pinterest) ---
    // ----------------------------------------------------
    const gallery = document.getElementById('poster-gallery');
    const fileInput = document.getElementById('poster-file');
    const ctaUpload = document.getElementById('cta-upload');
    const dropZone = document.getElementById('drop-zone');

    function renderGallery(items) {
        if (!gallery) return;
        gallery.innerHTML = '';
        items.forEach((src, idx) => {
            const card = document.createElement('div');
            card.className = 'gallery-item';
            const img = document.createElement('img');
            img.src = src;
            img.alt = `Cartel ${idx+1}`;
            const del = document.createElement('button');
            del.className = 'del-btn';
            del.type = 'button';
            del.setAttribute('data-index', String(idx));
            del.textContent = 'Eliminar';
            const meta = document.createElement('div');
            meta.className = 'meta';
            meta.innerHTML = `<span>Cartel #${idx+1}</span><span>❤</span>`;
            card.appendChild(img);
            card.appendChild(del);
            card.appendChild(meta);
            gallery.appendChild(card);
        });
    }

    function loadStored() {
        const raw = localStorage.getItem('poster_gallery_items');
        try { return raw ? JSON.parse(raw) : []; } catch { return []; }
    }
    function storeItems(items) {
        localStorage.setItem('poster_gallery_items', JSON.stringify(items));
    }

    async function filesToDataUrls(files) {
        const promises = [...files].map(file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        }));
        return Promise.all(promises);
    }

    async function handleFiles(files) {
        if (!files || !files.length) return;
        const dataUrls = await filesToDataUrls(files);
        const items = loadStored();
        const next = dataUrls.concat(items); // más recientes primero
        storeItems(next);
        renderGallery(next);
    }

    if (ctaUpload && fileInput) {
        ctaUpload.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
    }

    if (dropZone) {
        ['dragenter','dragover'].forEach(ev => dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('dragover'); }));
        ;['dragleave','drop'].forEach(ev => dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('dragover'); }));
        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            if (dt && dt.files) handleFiles(dt.files);
        });
    }

    // Inicializar galería desde localStorage
    if (gallery) renderGallery(loadStored());

    // Borrado por delegación
    if (gallery) {
        gallery.addEventListener('click', (e) => {
            const btn = e.target.closest('.del-btn');
            if (!btn) return;
            const idx = parseInt(btn.getAttribute('data-index') || '-1', 10);
            if (idx < 0) return;
            const items = loadStored();
            items.splice(idx, 1);
            storeItems(items);
            renderGallery(items);
        });
    }

    // ----------------------------------------------------
    // --- 2. Control de Visibilidad del Chat ---
    // ----------------------------------------------------

    if (chatButton && chatWindow) {
        chatButton.addEventListener('click', () => {
            chatWindow.classList.toggle('visible'); 

            if (chatWindow.classList.contains('visible')) {
                userInput?.focus();
            }
        });
    }

    if (closeButton && chatWindow) {
        closeButton.addEventListener('click', () => {
            chatWindow.classList.remove('visible');
        });
    }

    // ----------------------------------------------------
    // --- 3. Funciones de Conversación y Mensajería (Usando FETCH al Proxy) ---
    // ----------------------------------------------------

    function appendMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(sender === 'user' ? 'user-message' : 'system-message');
        
        // Permite saltos de línea y formateo básico
        const formattedText = text.replace(/\n/g, '<br>');
        messageDiv.innerHTML = formattedText;
        
        chatMessages.appendChild(messageDiv);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Indicador de "escribiendo" (...)
    let typingNode = null;
    function showTyping() {
        if (typingNode) return; // evita duplicados
        typingNode = document.createElement('div');
        typingNode.className = 'message chat-typing';
        typingNode.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
        chatMessages.appendChild(typingNode);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    function hideTyping() {
        if (typingNode && typingNode.parentNode) {
            typingNode.parentNode.removeChild(typingNode);
        }
        typingNode = null;
    }

    /**
     * Función que realiza la llamada REAL a tu servidor Proxy (Backend)
     * para obtener la respuesta de Gemini.
     */
    async function getGeminiResponse(query) {
        // No mostrar mensaje de "conectando" para evitar ruido visual
        
        try {
            const response = await fetch(PROXY_SERVER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: query })
            });

            if (!response.ok) {
                // Si el proxy responde con un error, intenta leer detalle
                let detailMsg = `Error de red: ${response.status} ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    detailMsg = errorData.detail || errorData.message || detailMsg;
                } catch (_) {}
                throw new Error(detailMsg);
            }

            const data = await response.json();
            
            // Suponemos que tu servidor proxy devuelve un objeto con una propiedad 'response'
            // que contiene el texto generado por Gemini.
            return data.response || "No se recibió una respuesta válida del servidor de IA.";

        } catch (error) {
            // Manejo de errores de red o del proxy
            console.error('Error al llamar al proxy de Gemini:', error);
            return `🚨 ERROR: No se pudo conectar con el servidor proxy (${PROXY_SERVER_URL}). Asegúrate de que el backend esté ejecutándose y configurado correctamente. Detalle: ${error.message}`;
        }
    }

    // 3.1. Enviar Mensaje Principal
    function handleSend() {
        const query = userInput.value.trim();
        if (query === '') return;

        // 1. Mostrar mensaje del usuario
        appendMessage('user', query);
        userInput.value = '';
        userInput.disabled = true;
        sendButton.disabled = true;

        // 2. Mostrar punticos y llamar al proxy
        showTyping();
        getGeminiResponse(query).then(response => {
            hideTyping();
            appendMessage('system', response);
            userInput.disabled = false;
            sendButton.disabled = false;
            userInput.focus();
        }).catch(error => {
            // Este catch maneja fallos en la promesa de getGeminiResponse
            hideTyping();
            appendMessage('system', `Fallo crítico en la promesa de respuesta: ${error.message}`);
            userInput.disabled = false;
            sendButton.disabled = false;
            userInput.focus();
        });
    }

    // 3.2. Asignación de Eventos
    sendButton?.addEventListener('click', handleSend);

    userInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    });

    // ----------------------------------------------------
    // --- 7. Actualizar CTAs si hay progreso en capacitación ---
    // ----------------------------------------------------
    try {
        const last = localStorage.getItem('training_last');
        if (last && (heroCta || teaserCta)) {
            const label = 'Continuar Capacitación';
            if (heroCta) heroCta.textContent = label;
            if (teaserCta) teaserCta.textContent = label;
        }
    } catch {}
});