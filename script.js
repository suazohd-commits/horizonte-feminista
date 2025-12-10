
// === LÓGICA PRINCIPAL DEL SITIO Y WIDGET DE CHAT DE IA ===


document.addEventListener('DOMContentLoaded', () => {

    // --- Configuración Crítica de la API ---
    // El frontend solo llama al proxy seguro
    const PROXY_SERVER_URL = 'http://localhost:3000/api/gemini-chat';

    // --- Configuración de Supabase---
    const SUPABASE_URL = 'https://sxeijpbdazpvbmnjcecu.supabase.co'; // reemplaza por tu URL real
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZWlqcGJkYXpwdmJtbmpjZWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODU4NzAsImV4cCI6MjA4MDM2MTg3MH0.SLj1q1w5exrHOUrlCOHjooc6qYVON9UF162wW7aoyWM'; // reemplaza por tu anon public key

    let supabaseClient = null;
    if (window.supabase && SUPABASE_URL !== 'https://TU_PROJECT_ID.supabase.co') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

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
    const langToggle = document.getElementById('lang-toggle');
    let currentLang = 'es';

    const navHome = document.getElementById('nav-home');
    const navConcepts = document.getElementById('nav-concepts');
    const navWaves = document.getElementById('nav-waves');
    const navBalance = document.getElementById('nav-balance');
    const navContact = document.getElementById('nav-contact');
    const navPosters = document.getElementById('nav-posters');

    // Elementos de estado de sesión en el header (opcionales)
    const authUserName = document.getElementById('auth-user-name');
    const authLoginLink = document.getElementById('auth-login-link');
    const authLogoutBtn = document.getElementById('auth-logout-btn');
    const accountBtn = document.getElementById('account-btn');

    // Modal de cuenta
    const accountModal = document.getElementById('account-modal');
    const accountName = document.getElementById('account-name');
    const accountEmail = document.getElementById('account-email');
    const accountLogoutBtn = document.getElementById('account-logout-btn');
    const accountCloseBtn = document.getElementById('account-close-btn');
    const accountAvatarInitial = document.querySelector('.account-avatar-initial');

    const posterTag = document.getElementById('poster-tag');
    const posterTitle = document.getElementById('poster-title');
    const posterDesc = document.getElementById('poster-desc');

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

    // --- Elementos de autenticación (login / registro) ---
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const registerForm = document.getElementById('register-form');
    const registerError = document.getElementById('register-error');

    // ----------------------------------------------------
    // --- 1. Lógica del Tema (Modo Claro/Oscuro PERSISTENTE) ---
    // ----------------------------------------------------

    function applyTheme(theme) {
        htmlElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (themeToggle) {
            themeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }
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

    // 1.2. Cambiar Tema al hacer clic (solo si existe el botón)
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    }

    // 1.3. Listener de idioma
    if (langToggle) {
        langToggle.addEventListener('click', () => {
            const next = currentLang === 'es' ? 'en' : 'es';
            applyLanguage(next);
        });
    }

    // ----------------------------------------------------
    // --- 1.c Lógica de Autenticación (login / registro) ---
    // ----------------------------------------------------

    async function handleRegister(event) {
        event.preventDefault();
        if (!registerForm) return;

        if (!supabaseClient) {
            if (registerError) {
                registerError.textContent = 'Error de configuración: Supabase no está inicializado. Revisa la URL y la clave en script.js.';
            }
            return;
        }

        const name = document.getElementById('register-name')?.value.trim() || '';
        const email = document.getElementById('register-email')?.value.trim() || '';
        const password = document.getElementById('register-password')?.value || '';
        const password2 = document.getElementById('register-password2')?.value || '';

        if (registerError) registerError.textContent = '';

        if (!name || !email || !password || !password2) {
            if (registerError) registerError.textContent = 'Completa todos los campos.';
            return;
        }

        if (password.length < 6) {
            if (registerError) registerError.textContent = 'La contraseña debe tener al menos 6 caracteres.';
            return;
        }

        if (password !== password2) {
            if (registerError) registerError.textContent = 'Las contraseñas no coinciden.';
            return;
        }

        const bcryptLib = window.dcodeIO && window.dcodeIO.bcrypt;
        if (!bcryptLib) {
            if (registerError) registerError.textContent = 'Error interno: bcrypt no está disponible.';
            return;
        }

        try {
            registerForm.querySelector('button[type="submit"]').disabled = true;

            const salt = bcryptLib.genSaltSync(10);
            const hash = bcryptLib.hashSync(password, salt);

            const { data, error } = await supabaseClient
                .from('users')
                .insert({ email, password_hash: hash, name })
                .select('id, name, email')
                .single();

            if (error) {
                if (registerError) registerError.textContent = error.message || 'No se pudo crear la cuenta.';
                registerForm.querySelector('button[type="submit"]').disabled = false;
                return;
            }

            try {
                localStorage.setItem('user_id', data.id);
                localStorage.setItem('user_name', data.name || '');
                localStorage.setItem('user_email', data.email || email);
            } catch {}

            if (registerError) {
                registerError.textContent = 'Cuenta creada correctamente, redirigiendo…';
            }

            // pequeña pausa opcional para que el mensaje se vea
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 600);
        } catch (err) {
            console.error('Error en registro:', err);
            if (registerError) registerError.textContent = 'Ocurrió un error al registrarte.';
            const btn = registerForm.querySelector('button[type="submit"]');
            if (btn) btn.disabled = false;
        }
    }

    async function handleLogin(event) {
        event.preventDefault();
        if (!loginForm || !supabaseClient) return;

        const email = document.getElementById('login-email')?.value.trim() || '';
        const password = document.getElementById('login-password')?.value || '';

        if (loginError) loginError.textContent = '';

        if (!email || !password) {
            if (loginError) loginError.textContent = 'Introduce tu correo y contraseña.';
            return;
        }

        const bcryptLib = window.dcodeIO && window.dcodeIO.bcrypt;
        if (!bcryptLib) {
            if (loginError) loginError.textContent = 'Error interno: bcrypt no está disponible.';
            return;
        }

        try {
            loginForm.querySelector('button[type="submit"]').disabled = true;

            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (error || !data) {
                if (loginError) loginError.textContent = 'Correo o contraseña incorrectos.';
                loginForm.querySelector('button[type="submit"]').disabled = false;
                return;
            }

            const ok = bcryptLib.compareSync(password, data.password_hash);
            if (!ok) {
                if (loginError) loginError.textContent = 'Correo o contraseña incorrectos.';
                loginForm.querySelector('button[type="submit"]').disabled = false;
                return;
            }

            try {
                localStorage.setItem('user_id', data.id);
                localStorage.setItem('user_name', data.name || '');
            } catch {}

            window.location.href = 'index.html';
        } catch (err) {
            console.error('Error en login:', err);
            if (loginError) loginError.textContent = 'Ocurrió un error al iniciar sesión.';
            const btn = loginForm.querySelector('button[type="submit"]');
            if (btn) btn.disabled = false;
        }
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // 1.d Actualizar UI del header según sesión
    function updateAuthUI() {
        let userName = '';
        let userId = '';
        try {
            userName = localStorage.getItem('user_name') || '';
            userId = localStorage.getItem('user_id') || '';
        } catch {}

        const isLogged = !!userId || !!userName;

        if (authLoginLink) {
            authLoginLink.style.display = isLogged ? 'none' : 'inline-flex';
        }

        if (accountBtn) {
            accountBtn.style.display = isLogged ? 'inline-flex' : 'none';
        }
    }

    async function openAccountModal() {
        if (!accountModal) return;
        let name = '';
        let email = '';
        let userId = '';
        try {
            name = localStorage.getItem('user_name') || '';
            email = localStorage.getItem('user_email') || '';
            userId = localStorage.getItem('user_id') || '';
        } catch {}

        // Si no tenemos correo pero sí userId y cliente Supabase, intentamos recuperarlo
        if (!email && userId && supabaseClient) {
            try {
                const { data, error } = await supabaseClient
                    .from('users')
                    .select('email, name')
                    .eq('id', userId)
                    .single();

                if (!error && data) {
                    email = data.email || email;
                    name = data.name || name;
                    try {
                        localStorage.setItem('user_email', email || '');
                        if (data.name) localStorage.setItem('user_name', data.name);
                    } catch {}
                }
            } catch (e) {
                console.warn('No se pudo recuperar el email del usuario desde Supabase', e);
            }
        }

        if (accountName) accountName.textContent = name || '(sin nombre)';
        if (accountEmail) accountEmail.textContent = email || '(sin correo)';

        if (accountAvatarInitial) {
            const initial = (name || email || '?').trim().charAt(0).toUpperCase() || '?';
            accountAvatarInitial.textContent = initial;
        }
        accountModal.classList.remove('hidden');
        accountModal.style.display = 'flex';
    }

    function closeAccountModal() {
        if (!accountModal) return;
        accountModal.classList.add('hidden');
        accountModal.style.display = 'none';
    }

    function logoutAndRedirect() {
        try {
            localStorage.removeItem('user_id');
            localStorage.removeItem('user_name');
            localStorage.removeItem('user_email');
        } catch {}
        updateAuthUI();
        closeAccountModal();
        if (!window.location.pathname.endsWith('index.html')) {
            window.location.href = 'index.html';
        }
    }

    if (accountBtn) {
        accountBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openAccountModal();
        });
    }

    if (accountCloseBtn) {
        accountCloseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeAccountModal();
        });
    }

    if (accountLogoutBtn) {
        accountLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutAndRedirect();
        });
    }

    // Asegurar que el modal arranca oculto
    if (accountModal) {
        accountModal.classList.add('hidden');
        accountModal.style.display = 'none';
    }

    // Aplicar estado de sesión al cargar
    updateAuthUI();

    const i18nTexts = {
        es: {
            // index: hero
            'home.hero.tag': 'Fundamentos',
            'home.hero.title': 'Entiende, reflexiona y actúa',
            'home.hero.lead': 'El feminismo no es un movimiento monolítico, sino un conjunto de teorías y acciones que buscan la igualdad de género. Explora los pilares de este movimiento.',
            'home.hero.ctaConcepts': 'Explorar Conceptos',
            'home.hero.ctaTraining': 'Iniciar Capacitación',
            'home.hero.footnote': 'El feminismo cuestiona y transforma estructuras de poder para garantizar igualdad real de derechos y oportunidades.',
            'home.hero.bottomNote': 'Igualdad, dignidad y libertad: el feminismo impulsa cambios reales en la vida de las personas.',

            // index: resumen conceptos
            'home.concepts.tag': 'Fundamentos',
            'home.concepts.title': 'Conceptos que lo cambiaron todo (Extracto)',
            'home.concepts.lead': 'Conoce los términos esenciales para comprender las teorías feministas. Para profundizar, haz clic abajo.',
            'home.concepts.bannerTitle': '¿Qué es el feminismo?',
            'home.concepts.bannerDesc': 'El feminismo es un movimiento social y político que lucha por la igualdad de derechos y oportunidades entre los géneros, cuestionando estructuras de poder y proponiendo cambios culturales y legales para erradicar la discriminación.',
            'home.concepts.bannerCta': 'Leer más',
            'home.concepts.cardPatriarcadoTitle': 'Patriarcado',
            'home.concepts.cardPatriarcadoBody': 'Sistema de dominio social en el que los hombres ostentan la mayor parte del poder.',
            'home.concepts.cardTechoTitle': 'Techo de Cristal',
            'home.concepts.cardTechoBody': 'Barrera invisible que impide a las mujeres ascender a puestos de alta dirección.',
            'home.concepts.cardInterTitle': 'Interseccionalidad',
            'home.concepts.cardInterBody': 'Análisis de cómo diversas categorías de identidad interactúan creando opresión.',
            'home.concepts.ctaDetail': 'Ver Conceptos a Detalle',

            // index: video
            'home.video.tag': 'Video Recomendado',
            'home.video.title': '¿Qué es el feminismo? (Explicación breve)',
            'home.video.lead': 'Mira este video introductorio para contextualizar los conceptos clave antes de profundizar.',
            'home.video.fallbackPrefix': 'Si el video no se reproduce,',
            'home.video.fallbackLink': 'ábrelo en YouTube',

            // index: olas resumen
            'home.waves.tag': 'Análisis Profundo',
            'home.waves.title': 'Etapas Críticas: Las Cuatro Olas (Resumen)',
            'home.waves.lead': 'Un vistazo a las fases clave que han marcado la lucha feminista. Para un análisis completo, haz clic en el botón.',
            'home.waves.card1Title': '1ª Ola',
            'home.waves.card1Body': 'Foco en el sufragio y los derechos de propiedad (Siglos XVIII y XIX).',
            'home.waves.card2Title': '2ª Ola',
            'home.waves.card2Body': 'Foco en la sexualidad, derechos reproductivos y roles de género (Décadas de 1960 y 70).',
            'home.waves.card3Title': '3ª Ola',
            'home.waves.card3Body': "Cuestionamiento del 'universalismo' y enfoque en el género y la identidad (Década de 1990).",
            'home.waves.card4Title': '4ª Ola',
            'home.waves.card4Body': 'Lucha contra la violencia machista y activismo en línea (Desde 2010).',
            'home.waves.ctaDetail': 'Ver Todas las Olas (Detalle)',

            // index: balance resumen
            'home.balance.tag': 'Evaluación',
            'home.balance.title': 'Balance: Logros y Retos (Vista Rápida)',
            'home.balance.lead': 'El movimiento ha transformado la sociedad, pero la lucha por una igualdad efectiva continúa. Revisa los puntos clave.',
            'home.balance.colAvancesTitle': 'Avances',
            'home.balance.itemAvance1': 'Derecho al voto y participación política.',
            'home.balance.itemAvance2': 'Legislación contra la discriminación.',
            'home.balance.itemAvance3': 'Derechos sexuales y reproductivos.',
            'home.balance.colDesafiosTitle': 'Desafíos',
            'home.balance.itemDesafio1': 'Persistencia de la brecha salarial.',
            'home.balance.itemDesafio2': 'Alta incidencia de la violencia machista.',
            'home.balance.itemDesafio3': 'Baja representación en altas esferas.',
            'home.balance.ctaDetail': 'Ver Balance Completo',

            // index: teaser
            'home.teaser.title': 'Plan de Capacitación',
            'home.teaser.lead': 'Domina los conceptos clave del feminismo con módulos cortos y claros.',
            'home.teaser.cta': 'Ir al Plan',

            // index: quiz teaser
            'home.quiz.title': 'Quiz feminista',
            'home.quiz.lead': 'Pon a prueba lo que has aprendido sobre conceptos, olas y retos del feminismo.',
            'home.quiz.cta': 'Empezar Quiz',

            // footer reutilizable
            'home.footer.exploreTitle': 'Explorar',
            'home.footer.exploreHome': 'Inicio',
            'home.footer.exploreConcepts': 'Conceptos',
            'home.footer.exploreWaves': 'Las Olas',
            'home.footer.exploreBalance': 'Balance',
            'home.footer.contactTitle': 'Contacto',
            'home.footer.contactLead': '¿Listo para la acción?',
            'home.footer.contactCta': 'Regístrate Aquí',

            // conceptos.html: cabecera
            'concepts.page.tag': 'Glosario Esencial',
            'concepts.page.title': 'Conceptos Fundamentales del Feminismo',
            'concepts.page.lead': 'Explora los términos y marcos teóricos que sustentan el pensamiento y la acción feminista, claves para entender sus objetivos y críticas.',
            'concepts.view.align1': 'Alineación 1',
            'concepts.view.align2': 'Alineación 2',

            // conceptos.html: tarjetas
            'concepts.cardPatriarcadoTitle': 'Patriarcado',
            'concepts.cardPatriarcadoBody': 'Sistema de organización social en el que el poder principal recae en los hombres, quienes tienen la autoridad en la familia, el liderazgo político, la autoridad moral y el control de la propiedad.',
            'concepts.cardMachismoTitle': 'Machismo',
            'concepts.cardMachismoBody': 'Actitud o ideología de prepotencia de los hombres sobre las mujeres. Es una forma de sexismo que engloba un conjunto de comportamientos y prácticas sociales que promueven la dominación masculina.',
            'concepts.cardTechoTitle': 'Techo de Cristal',
            'concepts.cardTechoBody': 'Metáfora utilizada para referirse a la barrera invisible que impide a las mujeres y a otras minorías alcanzar los puestos más altos en el ámbito laboral y político, a pesar de sus cualificaciones y logros.',
            'concepts.cardInterTitle': 'Interseccionalidad',
            'concepts.cardInterBody': 'Marco teórico que analiza cómo diversas categorías de identidad social y biológica (como raza, género, clase, orientación sexual, discapacidad, etc.) interactúan a múltiples niveles, contribuyendo a experiencias de discriminación y privilegio.',
            'concepts.cardBrechaTitle': 'Brecha Salarial',
            'concepts.cardBrechaBody': 'Diferencia promedio entre la remuneración que perciben hombres y mujeres por un trabajo de igual valor o por el mismo puesto. Es un indicador de desigualdad económica y de género.',

            // conceptos.html: video
            'concepts.video.tag': 'Plan de Capacitación',
            'concepts.video.title': 'Aprende paso a paso',
            'concepts.video.lead': 'Selecciona un módulo del menú y reproduce el video sin salir de esta página.',
            'concepts.video.sidebarTitle': 'Módulos',
            'concepts.video.module1': 'Módulo 1 · ¿Qué es el feminismo?',
            'concepts.video.module2': 'Módulo 2 · Patriarcado y desigualdad',
            'concepts.video.module3': 'Módulo 3 · Interseccionalidad en contexto',
            'concepts.video.fallbackPrefix': 'Si el video no se reproduce,',
            'concepts.video.fallbackLink': 'ábrelo en YouTube',

            // olas.html
            'waves.page.tag': 'Evolución Histórica',
            'waves.page.title': 'Un Recorrido por las Olas del Feminismo',
            'waves.page.lead': 'El feminismo es un movimiento complejo y en constante evolución, tradicionalmente dividido en \"olas\" para comprender sus etapas y objetivos principales.',
            'waves.btn.definitions': 'Definiciones',
            'waves.btn.timeline': 'Línea de tiempo',
            'waves.card1.title': 'Primera Ola',
            'waves.card1.body': 'Principalmente durante los siglos XVIII y XIX, esta ola se centró en la lucha por el derecho al voto (sufragismo) y la igualdad de derechos legales, especialmente en la propiedad y el acceso a la educación. Figuras como Mary Wollstonecraft y las sufragistas británicas y estadounidenses fueron clave.',
            'waves.card2.title': 'Segunda Ola',
            'waves.card2.body': 'Desde la década de 1960 hasta los 80, esta ola expandió el foco más allá del sufragio para incluir cuestiones como la sexualidad, los derechos reproductivos, la igualdad en el lugar de trabajo, y la violencia doméstica. El lema \"lo personal es político\" fue central. Simone de Beauvoir y Betty Friedan son referentes.',
            'waves.card3.title': 'Tercera Ola',
            'waves.card3.body': 'A partir de los años 90, esta ola criticó el universalismo de las olas anteriores, enfocándose en la interseccionalidad de raza, clase y género, así como en la diversidad de experiencias de las mujeres. Explora la identidad, la sexualidad fluida y la cultura popular.',
            'waves.card4.title': 'Cuarta Ola',
            'waves.card4.body': 'Emergiendo alrededor de 2010, se caracteriza por el uso de las redes sociales y el activismo digital. Se centra fuertemente en la lucha contra la violencia machista, el acoso sexual (movimientos como #MeToo), la cultura de la violación, y la misoginia online.',
            'waves.timeline.tag': 'Vista Alternativa',
            'waves.timeline.title': 'Línea de Tiempo de las Olas',
            'waves.timeline.item1': 'Sufragio, derechos legales y acceso a la educación. Convención de Seneca Falls (1848).',
            'waves.timeline.item2': 'Lo personal es político: derechos reproductivos, igualdad laboral y lucha contra la violencia.',
            'waves.timeline.item3': 'Interseccionalidad y diversidad de experiencias. Cuestiona el universalismo previo.',
            'waves.timeline.item4': 'Activismo digital y #MeToo; foco en violencia machista y misoginia online.',
            'waves.map.tag': 'Geografía Histórica',
            'waves.map.title': 'Hitos Globales de las Cuatro Olas',
            'waves.map.lead': 'Explora los lugares clave donde surgieron o se consolidaron los movimientos y los principales logros de cada ola del feminismo.',
            'waves.map.legendTitle': 'Leyenda por Ola',
            'waves.map.legend1': 'Primera Ola (Sufragio)',
            'waves.map.legend2': 'Segunda Ola (Lo personal es político)',
            'waves.map.legend3': 'Tercera Ola (Interseccionalidad)',
            'waves.map.legend4': 'Cuarta Ola (#MeToo, Activismo Digital)',

            // balance.html
            'balance.page.title': 'Balance del Feminismo: Logros y Retos Pendientes',
            'balance.page.lead': 'El feminismo ha provocado transformaciones profundas en la sociedad moderna, pero la lucha por una igualdad plena y efectiva continúa enfrentando importantes desafíos.',
            'balance.logros.title': 'Grandes Avances Históricos',
            'balance.logros.item1.label': 'Derecho al Voto y Participación Política:',
            'balance.logros.item1.body': ' Desde el sufragismo, las mujeres han ganado el derecho a votar y a ser elegidas, aumentando su voz en la política.',
            'balance.logros.item2.label': 'Legislación contra la Discriminación:',
            'balance.logros.item2.body': ' Se han promulgado leyes que prohíben la discriminación de género en el empleo, la educación y otros ámbitos.',
            'balance.logros.item3.label': 'Derechos Sexuales y Reproductivos:',
            'balance.logros.item3.body': ' Acceso a anticonceptivos, legalización del aborto en muchos países y mayor autonomía sobre el cuerpo.',
            'balance.logros.item4.label': 'Acceso a la Educación y Empleo:',
            'balance.logros.item4.body': ' Mayor presencia de mujeres en todos los niveles educativos y en profesiones antes dominadas por hombres.',
            'balance.logros.item5.label': 'Visibilización de la Violencia de Género:',
            'balance.logros.item5.body': ' La violencia machista ha pasado de ser un asunto privado a un problema social y político reconocido, con leyes específicas para combatirla.',
            'balance.desafios.title': 'Retos y Luchas Pendientes',
            'balance.desafios.item1.label': 'Brecha Salarial y Techo de Cristal:',
            'balance.desafios.item1.body': ' A pesar de los avances, las mujeres siguen ganando menos que los hombres por el mismo trabajo y enfrentan barreras para ascender a puestos directivos.',
            'balance.desafios.item2.label': 'Violencia de Género y Feminicidios:',
            'balance.desafios.item2.body': ' La persistencia de la violencia machista en todas sus formas sigue siendo una lacra global que requiere una respuesta contundente.',
            'balance.desafios.item3.label': 'Carga Desproporcionada de Cuidados:',
            'balance.desafios.item3.body': ' Las mujeres aún asumen la mayor parte del trabajo doméstico y de cuidado, impactando su desarrollo profesional y personal.',
            'balance.desafios.item4.label': 'Representación Insuficiente:',
            'balance.desafios.item4.body': ' Aunque hay más mujeres en espacios de poder, la paridad real en política, empresas y otros sectores aún no se ha logrado.',
            'balance.desafios.item5.label': 'Discriminación Interseccional:',
            'balance.desafios.item5.body': ' Mujeres de minorías étnicas, con discapacidad o de la comunidad LGBTQ+ enfrentan múltiples formas de opresión, que requieren enfoques específicos.',

            // contacto.html
            'contact.hero.title': 'Contacto',
            'contact.hero.crumb': 'Inicio / Contacto',
            'contact.main.tag': 'Ponte en contacto',
            'contact.main.title': 'Hablemos',
            'contact.main.lead': 'Cuéntanos tu consulta o iniciativa. Te responderemos a la brevedad.',
            'contact.form.submit': 'Enviar Mensaje',

            // posters.html
            'posters.tag': 'Carteles de la Comunidad',
            'posters.title': 'Catálogo colaborativo',
            'posters.lead': 'Explora, inspírate y deja tu huella compartiendo tus carteles.',
            'posters.filter.all': 'Todos los carteles',
            'posters.filter.local': 'Mis carteles',
            'posters.addButton': 'Añadir carteles',
            'posters.ctaButton': 'Deja tu huella',
            'posters.dropzoneText': 'Arrastra y suelta tus carteles aquí o usa el botón "Deja tu huella".',

            // auth: login / register
            'auth.login.tag': 'Bienvenida',
            'auth.login.title': 'Inicia sesión',
            'auth.login.lead': 'Accede para guardar tus resultados del quiz y tu actividad.',
            'auth.login.emailLabel': 'Correo electrónico',
            'auth.login.passwordLabel': 'Contraseña',
            'auth.login.submit': 'Entrar',
            'auth.login.switchText': '¿No tienes cuenta?',
            'auth.login.switchLink': 'Regístrate',

            'auth.register.tag': 'Crea tu cuenta',
            'auth.register.title': 'Registro',
            'auth.register.lead': 'Regístrate para guardar tus avances y participar más en la comunidad.',
            'auth.register.nameLabel': 'Nombre',
            'auth.register.emailLabel': 'Correo electrónico',
            'auth.register.passwordLabel': 'Contraseña',
            'auth.register.password2Label': 'Repite la contraseña',
            'auth.register.submit': 'Crear cuenta',
            'auth.register.switchText': '¿Ya tienes cuenta?',
            'auth.register.switchLink': 'Inicia sesión',

            // quiz.html
            'quiz.title': 'Quiz feminista',
            'quiz.lead': 'Pon a prueba lo que has aprendido sobre conceptos, olas y retos del feminismo.',
            'quiz.cta': 'Empezar Quiz',
            'quiz.question1': '¿Cuál es el objetivo principal del feminismo?',
            'quiz.answer1': 'La igualdad de género',
            'quiz.question2': '¿Cuál es la primera ola del feminismo?',
            'quiz.answer2': 'Sufragismo',
            'quiz.question3': '¿Cuál es el concepto clave del feminismo?',
            'quiz.answer3': 'Interseccionalidad',
        },

        en: {
            // index: hero
            'home.hero.tag': 'Foundations',
            'home.hero.title': 'Understand, reflect and act',
            'home.hero.lead': 'Feminism is not a monolithic movement, but a set of theories and actions seeking gender equality. Explore the pillars of this movement.',
            'home.hero.ctaConcepts': 'Explore concepts',
            'home.hero.ctaTraining': 'Start training',
            'home.hero.footnote': 'Feminism questions and transforms power structures to guarantee real equality of rights and opportunities.',
            'home.hero.bottomNote': 'Equality, dignity and freedom: feminism drives real change in people\'s lives.',

            // index: resumen conceptos
            'home.concepts.tag': 'Foundations',
            'home.concepts.title': 'Concepts that changed everything (Excerpt)',
            'home.concepts.lead': 'Discover the essential terms to understand feminist theories. To go deeper, click below.',
            'home.concepts.bannerTitle': 'What is feminism?',
            'home.concepts.bannerDesc': 'Feminism is a social and political movement that fights for equal rights and opportunities between genders, questioning power structures and proposing cultural and legal changes to eradicate discrimination.',
            'home.concepts.bannerCta': 'Read more',
            'home.concepts.cardPatriarcadoTitle': 'Patriarchy',
            'home.concepts.cardPatriarcadoBody': 'A system of social domination in which men hold most of the power.',
            'home.concepts.cardTechoTitle': 'Glass ceiling',
            'home.concepts.cardTechoBody': 'Invisible barrier that prevents women from reaching top management positions.',
            'home.concepts.cardInterTitle': 'Intersectionality',
            'home.concepts.cardInterBody': 'Analysis of how different identity categories interact creating oppression.',
            'home.concepts.ctaDetail': 'See concepts in detail',

            // posters.html
            'posters.tag': 'Community posters',
            'posters.title': 'Collaborative catalogue',
            'posters.lead': 'Explore, get inspired and leave your mark by sharing your posters.',
            'posters.filter.all': 'All posters',
            'posters.filter.local': 'My posters',
            'posters.addButton': 'Add posters',
            'posters.ctaButton': 'Leave your mark',
            'posters.dropzoneText': 'Drag and drop your posters here or use the "Leave your mark" button.',

            // auth: login / register
            'auth.login.tag': 'Welcome',
            'auth.login.title': 'Log in',
            'auth.login.lead': 'Log in to save your quiz results and your activity.',
            'auth.login.emailLabel': 'Email address',
            'auth.login.passwordLabel': 'Password',
            'auth.login.submit': 'Sign in',
            'auth.login.switchText': "Don\'t have an account?",
            'auth.login.switchLink': 'Sign up',

            'auth.register.tag': 'Create your account',
            'auth.register.title': 'Sign up',
            'auth.register.lead': 'Sign up to save your progress and participate more in the community.',
            'auth.register.nameLabel': 'Name',
            'auth.register.emailLabel': 'Email address',
            'auth.register.passwordLabel': 'Password',
            'auth.register.password2Label': 'Repeat password',
            'auth.register.submit': 'Create account',
            'auth.register.switchText': 'Already have an account?',
            'auth.register.switchLink': 'Log in',

        // index: teaser
        'home.teaser.title': 'Plan de Capacitación',
        'home.teaser.lead': 'Domina los conceptos clave del feminismo con módulos cortos y claros.',
        'home.teaser.cta': 'Ir al Plan',

        // index: quiz teaser
        'home.quiz.title': 'Quiz feminista',
        'home.quiz.lead': 'Pon a prueba lo que has aprendido sobre conceptos, olas y retos del feminismo.',
        'home.quiz.cta': 'Empezar Quiz',

        // footer reutilizable
        'home.footer.exploreTitle': 'Explorar',
        'home.footer.exploreHome': 'Inicio',
        'home.footer.exploreConcepts': 'Conceptos',
        'home.footer.exploreWaves': 'Las Olas',
        'home.footer.exploreBalance': 'Balance',
        'home.footer.contactTitle': 'Contacto',
        'home.footer.contactLead': '¿Listo para la acción?',
        'home.footer.contactCta': 'Regístrate Aquí',

        // conceptos.html: cabecera
        'concepts.page.tag': 'Glosario Esencial',
        'concepts.page.title': 'Conceptos Fundamentales del Feminismo',
        'concepts.page.lead': 'Explora los términos y marcos teóricos que sustentan el pensamiento y la acción feminista, claves para entender sus objetivos y críticas.',
        'concepts.view.align1': 'Alineación 1',
        'concepts.view.align2': 'Alineación 2',

        // conceptos.html: tarjetas
        'concepts.cardPatriarcadoTitle': 'Patriarcado',
        'concepts.cardPatriarcadoBody': 'Sistema de organización social en el que el poder principal recae en los hombres, quienes tienen la autoridad en la familia, el liderazgo político, la autoridad moral y el control de la propiedad.',
        'concepts.cardMachismoTitle': 'Machismo',
        'concepts.cardMachismoBody': 'Actitud o ideología de prepotencia de los hombres sobre las mujeres. Es una forma de sexismo que engloba un conjunto de comportamientos y prácticas sociales que promueven la dominación masculina.',
        'concepts.cardTechoTitle': 'Techo de Cristal',
        'concepts.cardTechoBody': 'Metáfora utilizada para referirse a la barrera invisible que impide a las mujeres y a otras minorías alcanzar los puestos más altos en el ámbito laboral y político, a pesar de sus cualificaciones y logros.',
        'concepts.cardInterTitle': 'Interseccionalidad',
        'concepts.cardInterBody': 'Marco teórico que analiza cómo diversas categorías de identidad social y biológica (como raza, género, clase, orientación sexual, discapacidad, etc.) interactúan a múltiples niveles, contribuyendo a experiencias de discriminación y privilegio.',
        'concepts.cardBrechaTitle': 'Brecha Salarial',
        'concepts.cardBrechaBody': 'Diferencia promedio entre la remuneración que perciben hombres y mujeres por un trabajo de igual valor o por el mismo puesto. Es un indicador de desigualdad económica y de género.',

        // conceptos.html: video
        'concepts.video.tag': 'Plan de Capacitación',
        'concepts.video.title': 'Aprende paso a paso',
        'concepts.video.lead': 'Selecciona un módulo del menú y reproduce el video sin salir de esta página.',
        'concepts.video.sidebarTitle': 'Módulos',
        'concepts.video.module1': 'Módulo 1 · ¿Qué es el feminismo?',
        'concepts.video.module2': 'Módulo 2 · Patriarcado y desigualdad',
        'concepts.video.module3': 'Módulo 3 · Interseccionalidad en contexto',
        'concepts.video.fallbackPrefix': 'Si el video no se reproduce,',
        'concepts.video.fallbackLink': 'ábrelo en YouTube',

        // olas.html
        'waves.page.tag': 'Evolución Histórica',
        'waves.page.title': 'Un Recorrido por las Olas del Feminismo',
        'waves.page.lead': 'El feminismo es un movimiento complejo y en constante evolución, tradicionalmente dividido en \"olas\" para comprender sus etapas y objetivos principales.',
        'waves.btn.definitions': 'Definiciones',
        'waves.btn.timeline': 'Línea de tiempo',
        'waves.card1.title': 'Primera Ola',
        'waves.card1.body': 'Principalmente durante los siglos XVIII y XIX, esta ola se centró en la lucha por el derecho al voto (sufragismo) y la igualdad de derechos legales, especialmente en la propiedad y el acceso a la educación. Figuras como Mary Wollstonecraft y las sufragistas británicas y estadounidenses fueron clave.',
        'waves.card2.title': 'Segunda Ola',
        'waves.card2.body': 'Desde la década de 1960 hasta los 80, esta ola expandió el foco más allá del sufragio para incluir cuestiones como la sexualidad, los derechos reproductivos, la igualdad en el lugar de trabajo, y la violencia doméstica. El lema \"lo personal es político\" fue central. Simone de Beauvoir y Betty Friedan son referentes.',
        'waves.card3.title': 'Tercera Ola',
        'waves.card3.body': 'A partir de los años 90, esta ola criticó el universalismo de las olas anteriores, enfocándose en la interseccionalidad de raza, clase y género, así como en la diversidad de experiencias de las mujeres. Explora la identidad, la sexualidad fluida y la cultura popular.',
        'waves.card4.title': 'Cuarta Ola',
        'waves.card4.body': 'Emergiendo alrededor de 2010, se caracteriza por el uso de las redes sociales y el activismo digital. Se centra fuertemente en la lucha contra la violencia machista, el acoso sexual (movimientos como #MeToo), la cultura de la violación, y la misoginia online.',
        'waves.timeline.tag': 'Vista Alternativa',
        'waves.timeline.title': 'Línea de Tiempo de las Olas',
        'waves.timeline.item1': 'Sufragio, derechos legales y acceso a la educación. Convención de Seneca Falls (1848).',
        'waves.timeline.item2': 'Lo personal es político: derechos reproductivos, igualdad laboral y lucha contra la violencia.',
        'waves.timeline.item3': 'Interseccionalidad y diversidad de experiencias. Cuestiona el universalismo previo.',
        'waves.timeline.item4': 'Activismo digital y #MeToo; foco en violencia machista y misoginia online.',
        'waves.map.tag': 'Geografía Histórica',
        'waves.map.title': 'Hitos Globales de las Cuatro Olas',
        'waves.map.lead': 'Explora los lugares clave donde surgieron o se consolidaron los movimientos y los principales logros de cada ola del feminismo.',
        'waves.map.legendTitle': 'Leyenda por Ola',
        'waves.map.legend1': 'Primera Ola (Sufragio)',
        'waves.map.legend2': 'Segunda Ola (Lo personal es político)',
        'waves.map.legend3': 'Tercera Ola (Interseccionalidad)',
        'waves.map.legend4': 'Cuarta Ola (#MeToo, Activismo Digital)',

        // balance.html
        'balance.page.title': 'Balance del Feminismo: Logros y Retos Pendientes',
        'balance.page.lead': 'El feminismo ha provocado transformaciones profundas en la sociedad moderna, pero la lucha por una igualdad plena y efectiva continúa enfrentando importantes desafíos.',
        'balance.logros.title': 'Grandes Avances Históricos',
        'balance.logros.item1.label': 'Derecho al Voto y Participación Política:',
        'balance.logros.item1.body': ' Desde el sufragismo, las mujeres han ganado el derecho a votar y a ser elegidas, aumentando su voz en la política.',
        'balance.logros.item2.label': 'Legislación contra la Discriminación:',
        'balance.logros.item2.body': ' Se han promulgado leyes que prohíben la discriminación de género en el empleo, la educación y otros ámbitos.',
        'balance.logros.item3.label': 'Derechos Sexuales y Reproductivos:',
        'balance.logros.item3.body': ' Acceso a anticonceptivos, legalización del aborto en muchos países y mayor autonomía sobre el cuerpo.',
        'balance.logros.item4.label': 'Acceso a la Educación y Empleo:',
        'balance.logros.item4.body': ' Mayor presencia de mujeres en todos los niveles educativos y en profesiones antes dominadas por hombres.',
        'balance.logros.item5.label': 'Visibilización de la Violencia de Género:',
        'balance.logros.item5.body': ' La violencia machista ha pasado de ser un asunto privado a un problema social y político reconocido, con leyes específicas para combatirla.',
        'balance.desafios.title': 'Retos y Luchas Pendientes',
        'balance.desafios.item1.label': 'Brecha Salarial y Techo de Cristal:',
        'balance.desafios.item1.body': ' A pesar de los avances, las mujeres siguen ganando menos que los hombres por el mismo trabajo y enfrentan barreras para ascender a puestos directivos.',
        'balance.desafios.item2.label': 'Violencia de Género y Feminicidios:',
        'balance.desafios.item2.body': ' La persistencia de la violencia machista en todas sus formas sigue siendo una lacra global que requiere una respuesta contundente.',
        'balance.desafios.item3.label': 'Carga Desproporcionada de Cuidados:',
        'balance.desafios.item3.body': ' Las mujeres aún asumen la mayor parte del trabajo doméstico y de cuidado, impactando su desarrollo profesional y personal.',
        'balance.desafios.item4.label': 'Representación Insuficiente:',
        'balance.desafios.item4.body': ' Aunque hay más mujeres en espacios de poder, la paridad real en política, empresas y otros sectores aún no se ha logrado.',
        'balance.desafios.item5.label': 'Discriminación Interseccional:',
        'balance.desafios.item5.body': ' Mujeres de minorías étnicas, con discapacidad o de la comunidad LGBTQ+ enfrentan múltiples formas de opresión, que requieren enfoques específicos.',

        // contacto.html
        'contact.hero.title': 'Contacto',
        'contact.hero.crumb': 'Inicio / Contacto',
        'contact.main.tag': 'Ponte en contacto',
        'contact.main.title': 'Hablemos',
        'contact.main.lead': 'Cuéntanos tu consulta o iniciativa. Te responderemos a la brevedad.',
        'contact.form.submit': 'Enviar Mensaje',

        // posters.html
        'posters.filter.all': 'Todos los carteles',
        'posters.filter.local': 'Mis carteles',
        'posters.addButton': 'Añadir carteles',
        'posters.ctaButton': 'Deja tu huella',
        'posters.dropzoneText': 'Arrastra y suelta tus carteles aquí o usa el botón "Deja tu huella".',

        // quiz.html
        'quiz.title': 'Quiz feminista',
        'quiz.lead': 'Pon a prueba lo que has aprendido sobre conceptos, olas y retos del feminismo.',
        'quiz.cta': 'Empezar Quiz',
        'quiz.question1': '¿Cuál es el objetivo principal del feminismo?',
        'quiz.answer1': 'La igualdad de género',
        'quiz.question2': '¿Cuál es la primera ola del feminismo?',
        'quiz.answer2': 'Sufragismo',
        'quiz.question3': '¿Cuál es el concepto clave del feminismo?',
        'quiz.answer3': 'Interseccionalidad',
    },

    en: {
        // index: hero
        'home.hero.tag': 'Foundations',
        'home.hero.title': 'Understand, reflect and act',
        'home.hero.lead': 'Feminism is not a monolithic movement, but a set of theories and actions seeking gender equality. Explore the pillars of this movement.',
        'home.hero.ctaConcepts': 'Explore concepts',
        'home.hero.ctaTraining': 'Start training',
        'home.hero.footnote': 'Feminism questions and transforms power structures to guarantee real equality of rights and opportunities.',
        'home.hero.bottomNote': 'Equality, dignity and freedom: feminism drives real change in people\'s lives.',

        // index: concepts summary
        'home.concepts.tag': 'Foundations',
        'home.concepts.title': 'Concepts that changed everything (Excerpt)',
        'home.concepts.lead': 'Discover the essential terms to understand feminist theories. To go deeper, click below.',
        'home.concepts.bannerTitle': 'What is feminism?',
        'home.concepts.bannerDesc': 'Feminism is a social and political movement that fights for equal rights and opportunities between genders, challenging power structures and proposing cultural and legal changes to eradicate discrimination.',
        'home.concepts.bannerCta': 'Read more',
        'home.concepts.cardPatriarcadoTitle': 'Patriarchy',
        'home.concepts.cardPatriarcadoBody': 'A social system in which men hold most of the power.',
        'home.concepts.cardTechoTitle': 'Glass ceiling',
        'home.concepts.cardTechoBody': 'An invisible barrier that prevents women from reaching top management positions.',
        'home.concepts.cardInterTitle': 'Intersectionality',
        'home.concepts.cardInterBody': 'Analysis of how different identity categories interact to create oppression.',
        'home.concepts.ctaDetail': 'View concepts in detail',

        // index: video
        'home.video.tag': 'Recommended video',
        'home.video.title': 'What is feminism? (Short explanation)',
        'home.video.lead': 'Watch this introductory video to contextualize the key concepts before going deeper.',
        'home.video.fallbackPrefix': 'If the video does not play,',
        'home.video.fallbackLink': 'open it on YouTube',

        // index: waves summary
        'home.waves.tag': 'In-depth analysis',
        'home.waves.title': 'Critical stages: the four waves (Summary)',
        'home.waves.lead': 'A look at the key phases that have shaped the feminist struggle. For a full analysis, click the button.',
        'home.waves.card1Title': '1st Wave',
        'home.waves.card1Body': 'Focus on suffrage and property rights (18th and 19th centuries).',
        'home.waves.card2Title': '2nd Wave',
        'home.waves.card2Body': 'Focus on sexuality, reproductive rights and gender roles (1960s and 70s).',
        'home.waves.card3Title': '3rd Wave',
        'home.waves.card3Body': 'Questioning \"universalism\" and focusing on gender and identity (1990s).',
        'home.waves.card4Title': '4th Wave',
        'home.waves.card4Body': 'Fight against gender violence and online activism (Since 2010).',
        'home.waves.ctaDetail': 'See all waves (detail)',

        // index: balance summary
        'home.balance.tag': 'Assessment',
        'home.balance.title': 'Balance: achievements and challenges (Quick view)',
        'home.balance.lead': 'The movement has transformed society, but the struggle for effective equality continues. Review the key points.',
        'home.balance.colAvancesTitle': 'Achievements',
        'home.balance.itemAvance1': 'Right to vote and political participation.',
        'home.balance.itemAvance2': 'Anti-discrimination legislation.',
        'home.balance.itemAvance3': 'Sexual and reproductive rights.',
        'home.balance.colDesafiosTitle': 'Challenges',
        'home.balance.itemDesafio1': 'Persistence of the gender pay gap.',
        'home.balance.itemDesafio2': 'High incidence of gender-based violence.',
        'home.balance.itemDesafio3': 'Low representation in top positions.',
        'home.balance.ctaDetail': 'See full balance',

        // index: teaser
        'home.teaser.title': 'Training plan',
        'home.teaser.lead': 'Master the key concepts of feminism with short and clear modules.',
        'home.teaser.cta': 'Go to the plan',

        // index: quiz teaser
        'home.quiz.title': 'Feminist quiz',
        'home.quiz.lead': 'Test what you have learned about concepts, waves and challenges of feminism.',
        'home.quiz.cta': 'Start quiz',

        // footer
        'home.footer.exploreTitle': 'Explore',
        'home.footer.exploreHome': 'Home',
        'home.footer.exploreConcepts': 'Concepts',
        'home.footer.exploreWaves': 'The waves',
        'home.footer.exploreBalance': 'Balance',
        'home.footer.contactTitle': 'Contact',
        'home.footer.contactLead': 'Ready for action?',
        'home.footer.contactCta': 'Register here',

        // conceptos.html: header
        'concepts.page.tag': 'Essential glossary',
        'concepts.page.title': 'Fundamental concepts of feminism',
        'concepts.page.lead': 'Explore the terms and theoretical frameworks that sustain feminist thought and action, key to understanding its goals and critiques.',
        'concepts.view.align1': 'Layout 1',
        'concepts.view.align2': 'Layout 2',

        // conceptos.html: cards
        'concepts.cardPatriarcadoTitle': 'Patriarchy',
        'concepts.cardPatriarcadoBody': 'A social system in which power is primarily held by men, who have authority in the family, political leadership, moral authority and control of property.',
        'concepts.cardMachismoTitle': 'Machismo',
        'concepts.cardMachismoBody': 'An attitude or ideology of male superiority over women. It is a form of sexism that encompasses a set of behaviors and social practices that promote male domination.',
        'concepts.cardTechoTitle': 'Glass ceiling',
        'concepts.cardTechoBody': 'A metaphor used to refer to the invisible barrier that prevents women and other minorities from reaching the highest positions in the workplace and politics, despite their qualifications and achievements.',
        'concepts.cardInterTitle': 'Intersectionality',
        'concepts.cardInterBody': 'A theoretical framework that analyzes how various categories of social and biological identity (such as race, gender, class, sexual orientation, disability, etc.) interact at multiple levels, contributing to experiences of discrimination and privilege.',
        'concepts.cardBrechaTitle': 'Gender pay gap',
        'concepts.cardBrechaBody': 'The average difference in remuneration received by men and women for work of equal value or for the same position. It is an indicator of economic and gender inequality.',

        // conceptos.html: video
        'concepts.video.tag': 'Training plan',
        'concepts.video.title': 'Learn step by step',
        'concepts.video.lead': 'Select a module from the menu and play the video without leaving this page.',
        'concepts.video.sidebarTitle': 'Modules',
        'concepts.video.module1': 'Module 1 · What is feminism?',
        'concepts.video.module2': 'Module 2 · Patriarchy and inequality',
        'concepts.video.module3': 'Module 3 · Intersectionality in context',
        'concepts.video.fallbackPrefix': 'If the video does not play,',
        'concepts.video.fallbackLink': 'open it on YouTube',

        // olas.html
        'waves.page.tag': 'Historical evolution',
        'waves.page.title': 'A journey through the waves of feminism',
        'waves.page.lead': 'Feminism is a complex and constantly evolving movement, traditionally divided into \"waves\" to understand its stages and main goals.',
        'waves.btn.definitions': 'Definitions',
        'waves.btn.timeline': 'Timeline',
        'waves.card1.title': 'First wave',
        'waves.card1.body': 'Mainly during the 18th and 19th centuries, this wave focused on the struggle for the right to vote (suffragism) and equal legal rights, especially in property and access to education. Figures such as Mary Wollstonecraft and British and US suffragists were key.',
        'waves.card2.title': 'Second wave',
        'waves.card2.body': 'From the 1960s to the 80s, this wave expanded the focus beyond suffrage to include issues such as sexuality, reproductive rights, workplace equality and domestic violence. The motto \"the personal is political\" was central. Simone de Beauvoir and Betty Friedan are key figures.',
        'waves.card3.title': 'Third wave',
        'waves.card3.body': 'From the 1990s onwards, this wave criticized the universalism of previous waves, focusing on the intersectionality of race, class and gender, as well as the diversity of women\'s experiences. It explores identity, fluid sexuality and popular culture.',
        'waves.card4.title': 'Fourth wave',
        'waves.card4.body': 'Emerging around 2010, it is characterized by the use of social media and digital activism. It strongly focuses on the fight against gender violence, sexual harassment (#MeToo), rape culture and online misogyny.',
        'waves.timeline.tag': 'Alternative view',
        'waves.timeline.title': 'Timeline of the waves',
        'waves.timeline.item1': 'Suffrage, legal rights and access to education. Seneca Falls Convention (1848).',
        'waves.timeline.item2': 'The personal is political: reproductive rights, workplace equality and the fight against violence.',
        'waves.timeline.item3': 'Intersectionality and diversity of experiences. Questions previous universalism.',
        'waves.timeline.item4': 'Digital activism and #MeToo; focus on gender-based violence and online misogyny.',
        'waves.map.tag': 'Historical geography',
        'waves.map.title': 'Global milestones of the four waves',
        'waves.map.lead': 'Explore the key places where movements emerged or became consolidated and the main achievements of each wave of feminism.',
        'waves.map.legendTitle': 'Legend by wave',
        'waves.map.legend1': 'First wave (suffrage)',
        'waves.map.legend2': 'Second wave (the personal is political)',
        'waves.map.legend3': 'Third wave (intersectionality)',
        'waves.map.legend4': 'Fourth wave (#MeToo, digital activism)',

        // balance.html
        'balance.page.title': 'Balance of feminism: achievements and pending challenges',
        'balance.page.lead': 'Feminism has brought about profound transformations in modern society, but the struggle for full and effective equality still faces major challenges.',
        'balance.logros.title': 'Major historical achievements',
        'balance.logros.item1.label': 'Right to vote and political participation:',
        'balance.logros.item1.body': ' Since the suffrage movement, women have gained the right to vote and to be elected, increasing their voice in politics.',
        'balance.logros.item2.label': 'Anti-discrimination legislation:',
        'balance.logros.item2.body': ' Laws have been passed that prohibit gender discrimination in employment, education and other areas.',
        'balance.logros.item3.label': 'Sexual and reproductive rights:',
        'balance.logros.item3.body': ' Access to contraception, legalization of abortion in many countries and greater autonomy over one\'s body.',
        'balance.logros.item4.label': 'Access to education and employment:',
        'balance.logros.item4.body': ' Greater presence of women at all educational levels and in professions previously dominated by men.',
        'balance.logros.item5.label': 'Visibility of gender-based violence:',
        'balance.logros.item5.body': ' Gender-based violence has gone from being a private matter to a recognized social and political problem, with specific laws to combat it.',
        'balance.desafios.title': 'Challenges and ongoing struggles',
        'balance.desafios.item1.label': 'Gender pay gap and glass ceiling:',
        'balance.desafios.item1.body': ' Despite progress, women still earn less than men for the same work and face barriers to reaching senior positions.',
        'balance.desafios.item2.label': 'Gender violence and femicides:',
        'balance.desafios.item2.body': ' The persistence of gender-based violence in all its forms remains a global scourge that requires a strong response.',
        'balance.desafios.item3.label': 'Disproportionate care burden:',
        'balance.desafios.item3.body': ' Women still take on most domestic and care work, affecting their professional and personal development.',
        'balance.desafios.item4.label': 'Insufficient representation:',
        'balance.desafios.item4.body': ' Although there are more women in positions of power, real parity in politics, business and other sectors has not yet been achieved.',
        'balance.desafios.item5.label': 'Intersectional discrimination:',
        'balance.desafios.item5.body': ' Women from ethnic minorities, with disabilities or from the LGBTQ+ community face multiple forms of oppression that require specific approaches.',

        // contacto.html
        'contact.hero.title': 'Contact',
        'contact.hero.crumb': 'Home / Contact',
        'contact.main.tag': 'Get in touch',
        'contact.main.title': 'Let\'s talk',
        'contact.main.lead': 'Tell us about your question or initiative. We will get back to you as soon as possible.',
        'contact.form.submit': 'Send message',

        // posters.html
        'posters.filter.all': 'All posters',
        'posters.filter.local': 'My posters',
        'posters.addButton': 'Add posters',
        'posters.ctaButton': 'Leave your mark',
        'posters.dropzoneText': 'Drag and drop your posters here or use the "Leave your mark" button.',

        // quiz.html
        'quiz.title': 'Feminist quiz',
        'quiz.lead': 'Test what you have learned about concepts, waves and challenges of feminism.',
        'quiz.cta': 'Start quiz',
        'quiz.question1': 'What is the primary goal of feminism?',
        'quiz.answer1': 'Gender equality',
        'quiz.question2': 'What is the first wave of feminism?',
        'quiz.answer2': 'Suffragism',
        'quiz.question3': 'What is the key concept of feminism?',
        'quiz.answer3': 'Intersectionality',
    }
};

const translations = {
    es: {
        'nav-home': 'Inicio',
        'nav-concepts': 'Conceptos',
        'nav-waves': 'Las Olas',
        'nav-balance': 'Balance',
        'nav-contact': 'Participación',
        'nav-posters': 'Carteles',
        'poster-tag': 'Carteles de la Comunidad',
        'poster-title': 'Catálogo colaborativo',
        'poster-desc': 'Explora, inspírate y deja tu huella compartiendo tus carteles.'
    },
    en: {
        'nav-home': 'Home',
        'nav-concepts': 'Concepts',
        'nav-waves': 'The Waves',
        'nav-balance': 'Balance',
        'nav-contact': 'Participation',
        'nav-posters': 'Posters',
        'poster-tag': 'Community Posters',
        'poster-title': 'Collaborative Catalog',
        'poster-desc': 'Explore, get inspired and leave your mark by sharing your posters.'
    }
};

function applyLanguage(lang) {
    currentLang = lang;
    const dict = translations[lang] || translations.es;

    htmlElement.setAttribute('lang', lang);
    try { localStorage.setItem('lang', lang); } catch {}

    if (langToggle) {
        langToggle.classList.toggle('lang-en', lang === 'en');
        langToggle.setAttribute(
            'aria-label',
            lang === 'es'
                ? 'Idioma: Español (clic para Inglés)'
                : 'Language: English (click to switch to Spanish)'
        );
    }

    if (navHome) navHome.textContent = dict['nav-home'];
    if (navConcepts) navConcepts.textContent = dict['nav-concepts'];
    if (navWaves) navWaves.textContent = dict['nav-waves'];
    if (navBalance) navBalance.textContent = dict['nav-balance'];
    if (navContact) navContact.textContent = dict['nav-contact'];
    if (navPosters) navPosters.textContent = dict['nav-posters'];

    const textDict = i18nTexts[lang] || i18nTexts.es;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (!key) return;
        const value = textDict[key] ?? i18nTexts.es[key];
        if (!value) return;
        el.textContent = value;
    });
}
    // ----------------------------------------------------
    // --- 4.b Toggle de vistas en conceptos.html (Alineación 1/2) ---
    // ----------------------------------------------------

    function activateAlign1() {
        if (!align1View || !align2View) return;
        align1View.classList.add('view-hidden');
        align2View.classList.add('view-hidden');
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
        align1View.classList.add('view-hidden');
        align2View.classList.add('view-hidden');
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

    if (align1Btn) {
        align1Btn.addEventListener('click', activateAlign1);
    }
    if (align2Btn) {
        align2Btn.addEventListener('click', activateAlign2);
    }

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
    // --- 4.c Toggle Definiciones / Línea de tiempo en olas.html ---
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

    if (btnDef) {
        btnDef.addEventListener('click', activateDefinitions);
    }
    if (btnTimeline) {
        btnTimeline.addEventListener('click', activateTimeline);
    }

    if (defSection && timelineSection) {
        // Vista por defecto: Definiciones
        activateDefinitions();
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
        // ----------------------------------------------------
    // --- 6. Galería de Carteles (tipo Pinterest) ---
    // ----------------------------------------------------
    const gallery = document.getElementById('poster-gallery');
    const fileInput = document.getElementById('poster-file');
    const ctaUpload = document.getElementById('cta-upload');
    const dropZone = document.getElementById('drop-zone');

    const posterSearchInput = document.getElementById('poster-search');
    const posterSearchClear = document.getElementById('poster-search-clear');
    const posterFilterSelect = document.getElementById('poster-filter');
    const addPosterBtn = document.getElementById('add-poster-btn');

    const posterModal = document.getElementById('poster-modal');
    const posterModalImage = document.getElementById('poster-modal-image');
    const posterModalClose = document.getElementById('poster-modal-close');

    function renderGallery(items) {
        if (!gallery) return;
        gallery.innerHTML = '';
        items.forEach((src, idx) => {
            const card = document.createElement('div');
            card.className = 'gallery-item';
            const img = document.createElement('img');
            img.src = src;
            img.alt = `Cartel ${idx+1}`;
            img.setAttribute('data-index', String(idx));
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

        // Guardar en Supabase (tabla "posters") si hay sesión
        let userId = '';
        let userName = '';
        try {
            userId = localStorage.getItem('user_id') || '';
            userName = localStorage.getItem('user_name') || '';
        } catch {}

        if (supabaseClient && userId) {
            try {
                const rows = dataUrls.map((url, idx) => ({
                    title: `Cartel ${Date.now()}-${idx + 1}`,
                    author_name: userName || 'Usuario',
                    image_url: url,
                    tags: null
                }));
                await supabaseClient.from('posters').insert(rows);
            } catch (e) {
                console.warn('No se pudieron guardar los carteles en Supabase', e);
            }
        }

        const items = loadStored();
        const next = dataUrls.concat(items); // más recientes primero
        storeItems(next);
        applyGalleryFilters();
    }

    function applyGalleryFilters() {
        const allItems = loadStored();
        const query = (posterSearchInput?.value || '').toLowerCase().trim();
        let filtered = allItems;

        if (query) {
            filtered = allItems.filter((src, idx) => {
                const label = `cartel ${idx+1}`;
                return label.toLowerCase().includes(query);
            });
        }

        // posterFilterSelect (all/local) por ahora no cambia nada, pero se puede extender.
        renderGallery(filtered);
    }

    if (ctaUpload && fileInput) {
        ctaUpload.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
    }

    if (addPosterBtn && fileInput) {
        addPosterBtn.addEventListener('click', () => fileInput.click());
    }

    if (dropZone) {
        ['dragenter','dragover'].forEach(ev => dropZone.addEventListener(ev, (e) => { 
            e.preventDefault(); 
            e.stopPropagation(); 
            dropZone.classList.add('dragover'); 
        }));
        ;['dragleave','drop'].forEach(ev => dropZone.addEventListener(ev, (e) => { 
            e.preventDefault(); 
            e.stopPropagation(); 
            dropZone.classList.remove('dragover'); 
        }));
        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            if (dt && dt.files) handleFiles(dt.files);
        });
    }

    // Inicializar galería desde localStorage usando filtros
    if (gallery) applyGalleryFilters();

    // Borrado por delegación + abrir modal
    if (gallery) {
        gallery.addEventListener('click', (e) => {
            const delBtn = e.target.closest('.del-btn');
            if (delBtn) {
                const idx = parseInt(delBtn.getAttribute('data-index') || '-1', 10);
                if (idx < 0) return;
                const items = loadStored();
                items.splice(idx, 1);
                storeItems(items);
                applyGalleryFilters();
                return;
            }

            const img = e.target.closest('img');
            if (img && posterModal && posterModalImage) {
                const src = img.getAttribute('src');
                if (!src) return;
                posterModalImage.src = src;
                posterModal.classList.add('visible');
                posterModal.setAttribute('aria-hidden', 'false');
                document.body.classList.add('modal-open');
            }
        });
    }

    function closePosterModal() {
        if (!posterModal) return;
        posterModal.classList.remove('visible');
        posterModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    }

    posterModalClose?.addEventListener('click', closePosterModal);
    posterModal?.addEventListener('click', (e) => {
        if (e.target.classList.contains('poster-modal-backdrop')) {
            closePosterModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && posterModal?.classList.contains('visible')) {
            closePosterModal();
        }
    });

    posterSearchInput?.addEventListener('input', applyGalleryFilters);
    posterSearchClear?.addEventListener('click', () => {
        if (!posterSearchInput) return;
        posterSearchInput.value = '';
        applyGalleryFilters();
        posterSearchInput.focus();
    });

    posterFilterSelect?.addEventListener('change', applyGalleryFilters);

    // ----------------------------------------------------
    // --- 6.b Lógica del Quiz (quiz.html) ---
    // ----------------------------------------------------
    const quizSubmit = document.getElementById('quiz-submit');
    const quizResult = document.getElementById('quiz-result');

    if (quizSubmit && quizResult) {
        const correctAnswers = { q1: 'b', q2: 'b', q3: 'b', q4: 'b', q5: 'b' };

        quizSubmit.addEventListener('click', async () => {
            let score = 0;
            const total = Object.keys(correctAnswers).length;

            const answersPayload = [];

            Object.entries(correctAnswers).forEach(([q, correct]) => {
                const selected = document.querySelector(`input[name="${q}"]:checked`);
                const value = selected ? selected.value : null;
                const isCorrect = !!(value && value === correct);
                if (isCorrect) {
                    score += 1;
                }

                answersPayload.push({
                    question_code: q,
                    selected_option: value,
                    is_correct: isCorrect
                });
            });

            const msgEs = `Has acertado ${score} de ${total} preguntas.`;
            const msgEn = `You answered ${score} out of ${total} questions correctly.`;
            quizResult.textContent = currentLang === 'en' ? msgEn : msgEs;

            // Ajustar clases para resaltar el resultado
            quizResult.classList.remove('quiz-result--good', 'quiz-result--medium');
            if (score === total) {
                quizResult.classList.add('quiz-result--good');
            } else if (score >= Math.ceil(total / 2)) {
                quizResult.classList.add('quiz-result--medium');
            }

            // Guardar resultado y respuestas en Supabase si hay sesión
            let userId = '';
            try {
                userId = localStorage.getItem('user_id') || '';
            } catch {}

            if (!supabaseClient || !userId) return;

            try {
                const { data: resultRow, error: resultError } = await supabaseClient
                    .from('quiz_results')
                    .insert({
                        user_id: userId,
                        score: score,
                        total_questions: total,
                        lang: currentLang || 'es'
                    })
                    .select('id')
                    .single();

                if (resultError || !resultRow) {
                    console.warn('No se pudo guardar el resultado del quiz en Supabase', resultError);
                    return;
                }

                const resultId = resultRow.id;

                const answersRows = answersPayload.map((a) => ({
                    result_id: resultId,
                    question_code: a.question_code,
                    selected_option: a.selected_option,
                    is_correct: a.is_correct
                }));

                await supabaseClient.from('quiz_answers').insert(answersRows);
            } catch (e) {
                console.warn('No se pudieron guardar las respuestas del quiz en Supabase', e);
            }
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
    }

);
