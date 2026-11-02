// Ano exibido pelo app (2026 = dados fixos; depois = gerado). Dados e regras ficam em schedule.js
let scheduleYear = FIXED_SCHEDULE_YEAR;

function loadScheduleYear(year) {
    scheduleYear = Math.max(year, FIXED_SCHEDULE_YEAR);
    Object.assign(scheduleData, getScheduleForYear(scheduleYear));
}

loadScheduleYear(new Date().getFullYear());

// Variáveis globais
let selectedOrganist = null;
let highlightEnabled = true;
let notificationPermission = 'Notification' in window && Notification.permission === 'granted';
let selectorOpen = false;

// SEMPRE usar a data atual do sistema
function getCurrentDate() {
    return new Date();
}

// Função para atualizar a data no header
function updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    const now = getCurrentDate();
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('pt-BR', options);
}

// Sistema de notificações
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        notificationPermission = permission === 'granted';
        return notificationPermission;
    }
    return false;
}

function showCustomNotification(title, message, { system = true } = {}) {
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    
    const titleEl = document.createElement('div');
    titleEl.className = 'notification-title';
    titleEl.textContent = title;
    
    const messageEl = document.createElement('div');
    messageEl.className = 'notification-message';
    messageEl.textContent = message;
    
    notification.appendChild(titleEl);
    notification.appendChild(messageEl);
    document.body.appendChild(notification);
    
    // Mostrar notificação do sistema também
    if (system) showSystemNotification(title, message);

    setTimeout(() => {
        notification.style.animation = 'slideUpCustom 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}

// No Android, `new Notification()` é proibido (lança erro): é obrigatório usar o Service Worker
function showSystemNotification(title, body) {
    if (!notificationPermission) return;
    const options = { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', vibrate: [200, 100, 200] };

    const fallback = () => {
        try { new Notification(title, options); } catch (e) { console.warn('Notificação do sistema indisponível:', e); }
    };

    if (!('serviceWorker' in navigator)) return fallback();
    navigator.serviceWorker.getRegistration()
        .then(reg => reg ? reg.showNotification(title, options) : fallback())
        .catch(fallback);
}

// Alertas já enviados ficam salvos para não repetir a cada vez que o app é aberto
const NOTIFIED_STORAGE_KEY = 'notifiedEvents';
let notifiedProximityEvents = loadNotifiedEvents();

function loadNotifiedEvents() {
    try {
        return new Set(JSON.parse(localStorage.getItem(NOTIFIED_STORAGE_KEY)) || []);
    } catch (e) {
        return new Set();
    }
}

function saveNotifiedEvents() {
    try {
        localStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify([...notifiedProximityEvents].slice(-100)));
    } catch (e) { /* armazenamento indisponível */ }
}

function checkScheduledNotifications() {
    if (!selectedOrganist) return;

    for (const alert of computeDueNotifications(selectedOrganist, getCurrentDate(), notifiedProximityEvents)) {
        alert.keys.forEach(k => notifiedProximityEvents.add(k));
        saveNotifiedEvents();
        // Com push ativo o servidor já manda a notificação do sistema: aqui só o aviso dentro do app
        showCustomNotification(alert.title, alert.body, { system: !isPushActive() });
    }
}

// ===== Push: lembretes com o app fechado (servidor no Netlify, ver netlify/) =====
const PUSH_ENDPOINT = '/.netlify/functions/push-subscribe';
const PUSH_STORAGE_KEY = 'pushOrganist';

function isPushActive() {
    try {
        return !!selectedOrganist && localStorage.getItem(PUSH_STORAGE_KEY) === selectedOrganist;
    } catch (e) {
        return false;
    }
}

function urlBase64ToUint8Array(base64) {
    const padding = '='.repeat((4 - base64.length % 4) % 4);
    const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, c => c.charCodeAt(0));
}

function postPushSubscription(subscription, organist) {
    // Manda junto os lembretes que este aparelho já mostrou, para o servidor não repetir
    const sent = organist ? [...notifiedProximityEvents].filter(k => k.startsWith(`${organist}_`)) : [];
    return fetch(PUSH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON(), organist, sent })
    });
}

// Cadastra (ou atualiza) este aparelho no servidor para receber os lembretes da organista.
// organist = null descadastra. Sem servidor (ex.: rodando local) só retorna false.
async function syncPushSubscription(organist) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    try {
        const reg = await navigator.serviceWorker.ready;
        let subscription = await reg.pushManager.getSubscription();

        if (!organist) {
            if (subscription) {
                await postPushSubscription(subscription, null);
                await subscription.unsubscribe();
            }
            localStorage.removeItem(PUSH_STORAGE_KEY);
            return false;
        }

        if (!notificationPermission) return false;
        if (!subscription) {
            const res = await fetch(PUSH_ENDPOINT);
            if (!res.ok) throw new Error(`push-subscribe GET ${res.status}`);
            const { publicKey } = await res.json();
            subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });
        }

        const res = await postPushSubscription(subscription, organist);
        if (!res.ok) throw new Error(`push-subscribe POST ${res.status}`);
        localStorage.setItem(PUSH_STORAGE_KEY, organist);
        return true;
    } catch (e) {
        console.warn('Push indisponível, avisos só com o app aberto:', e);
        try { localStorage.removeItem(PUSH_STORAGE_KEY); } catch (_) { /* sem armazenamento */ }
        return false;
    }
}

function pushStatusText(organist, pushActive) {
    return pushActive
        ? `✅ Notificações ativadas para ${organist} — chegam mesmo com o app fechado`
        : `✅ Notificações ativadas para ${organist} (com o app aberto)`;
}

// Atualiza o texto do seletor e mostra o botão de teste só com o push ativo
function showPushStatus(organist, pushActive) {
    const statusElement = document.getElementById('notificationStatus');
    if (statusElement) statusElement.textContent = pushStatusText(organist, pushActive);
    const testBtn = document.getElementById('pushTestBtn');
    if (testBtn) testBtn.style.display = pushActive ? 'block' : 'none';
}

// Botão "Testar notificação": o servidor manda um push que chega ~5 s depois
const PUSH_TEST_ENDPOINT = '/.netlify/functions/push-test';

function setupPushTestButton() {
    const btn = document.getElementById('pushTestBtn');
    const statusElement = document.getElementById('notificationStatus');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
            const reg = await navigator.serviceWorker.ready;
            const subscription = await reg.pushManager.getSubscription();
            if (!subscription) throw new Error('aparelho sem inscrição de push');

            statusElement.textContent = '📨 Enviando... pode fechar o app: a notificação chega em uns 5 segundos.';
            // keepalive: o pedido segue mesmo se o app for fechado logo em seguida
            const res = await fetch(PUSH_TEST_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: subscription.toJSON() }),
                keepalive: true
            });
            const data = await res.json().catch(() => ({}));
            statusElement.textContent = res.ok
                ? '✅ Teste enviado! Se a notificação apareceu, está tudo certo.'
                : `⚠️ ${data.error || 'Falha no teste'}`;
        } catch (e) {
            console.warn('Teste de push falhou:', e);
            statusElement.textContent = '⚠️ Não foi possível testar agora. Toque duas vezes no seu nome e tente de novo.';
        } finally {
            setTimeout(() => { btn.disabled = false; }, 5000);
        }
    });
}

// NOVO: Configuração do botão de seleção de organista
function setupOrganistSelectorButton() {
    const selectorButton = document.getElementById('organistSelectorButton');
    const selector = document.getElementById('organistSelector');
    const closeBtn = document.getElementById('closeSelectorBtn');
    
    console.log('🔧 Configurando botão de seleção...', { selectorButton, selector, closeBtn });
    
    if (!selectorButton || !selector || !closeBtn) {
        console.error('❌ Elementos não encontrados!');
        return;
    }
    
    selectorButton.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('🔘 Botão clicado, selectorOpen:', selectorOpen);
        
        if (selectorOpen) {
            closeSelector();
        } else {
            openSelector();
        }
    });
    
    closeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        closeSelector();
    });
    
    // Fechar ao clicar fora
    document.addEventListener('click', function(e) {
        if (selectorOpen && !selector.contains(e.target) && !selectorButton.contains(e.target)) {
            closeSelector();
        }
    });
}

// Com organista escolhida, o botão mostra o nome dela (tocar abre o seletor para trocar)
function updateSelectorButtonLabel() {
    const selectorButton = document.getElementById('organistSelectorButton');
    if (!selectorButton || selectorOpen) return;
    selectorButton.textContent = selectedOrganist ? `🎹 ${selectedOrganist} ▾` : '🎹 Selecionar Organista';
    selectorButton.title = selectedOrganist ? 'Toque para trocar a organista' : '';
}

function openSelector() {
    const selector = document.getElementById('organistSelector');
    const selectorButton = document.getElementById('organistSelectorButton');
    
    console.log('📖 Abrindo seletor...');
    
    selector.style.display = 'block';
    selector.classList.add('show');
    selector.classList.remove('hide');
    selectorButton.textContent = '❌ Fechar Seleção';
    selectorButton.classList.add('open');
    selectorOpen = true;
}

function closeSelector() {
    const selector = document.getElementById('organistSelector');
    const selectorButton = document.getElementById('organistSelectorButton');
    
    console.log('📕 Fechando seletor...');
    
    selector.classList.add('hide');
    selector.classList.remove('show');
    selectorButton.classList.remove('open');
    selectorOpen = false;
    updateSelectorButtonLabel();
    
    setTimeout(() => {
        if (!selectorOpen) {
            selector.style.display = 'none';
        }
    }, 300);
}

function setupOrganistSelector() {
    const options = document.querySelectorAll('.organist-option');
    const statusElement = document.getElementById('notificationStatus');
    
    options.forEach(option => {
        option.addEventListener('click', async function(e) {
            // Clicar no <label> gera um segundo clique no <input>; trata só esse segundo
            if (e.target.tagName === 'LABEL') return;

            const radio = this.querySelector('input[type="radio"]');
            const organist = this.dataset.organist;

            // Limpar seleções anteriores
            options.forEach(opt => opt.classList.remove('selected'));

            // Tocar de novo na organista já selecionada desmarca
            if (selectedOrganist === organist) {
                console.log('🎹 Organista desmarcada:', organist);
                radio.checked = false;
                selectedOrganist = null;
                localStorage.removeItem('selectedOrganist');
                statusElement.textContent = 'Nenhuma organista selecionada. Notificações desativadas.';
                focusNearestDate('smooth');
                document.getElementById('pushTestBtn').style.display = 'none';
                syncPushSubscription(null);
                return;
            }

            console.log('🎹 Organista selecionado:', organist);

            // Selecionar atual
            this.classList.add('selected');
            radio.checked = true;
            selectedOrganist = organist;
            localStorage.setItem('selectedOrganist', organist);
            focusNearestDate('smooth');

            // Solicitar permissão para notificações
            const permission = await requestNotificationPermission();

            if (permission) {
                showPushStatus(organist, false);
                checkScheduledNotifications();
                syncPushSubscription(organist).then(pushActive => {
                    if (selectedOrganist === organist) showPushStatus(organist, pushActive);
                });

                setTimeout(() => {
                    closeSelector();
                }, 3000);
            } else {
                statusElement.textContent = `⚠️ ${organist} selecionada, mas notificações não autorizadas`;
            }
        });
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎵 App iniciando...');
    
    setupTabNavigation();
    setupOrganistSelectorButton();
    setupOrganistSelector();
    setupPushTestButton();
    syncHeaderHeight();
    updateCurrentDate();
    showScheduleYear(scheduleYear);
    updateHighlights();
    setupToggle();

    setInterval(() => {
        updateCurrentDate();
        updateHighlights();
        checkScheduledNotifications();
    }, 60000);

    // Restaurar organista salva
    const saved = localStorage.getItem('selectedOrganist');
    if (saved) {
        const option = document.querySelector(`.organist-option[data-organist="${saved}"]`);
        if (option) {
            option.classList.add('selected');
            option.querySelector('input[type="radio"]').checked = true;
            selectedOrganist = saved;
            updateSelectorButtonLabel();
            // Sem gesto do usuário o navegador bloqueia o pedido de permissão: só lê o estado atual
            const statusElement = document.getElementById('notificationStatus');
            if (notificationPermission) {
                showPushStatus(saved, isPushActive());
                // Mantém o cadastro do push em dia (ex.: inscrição renovada pelo navegador)
                syncPushSubscription(saved).then(pushActive => {
                    if (selectedOrganist === saved) showPushStatus(saved, pushActive);
                });
            } else if (statusElement) {
                statusElement.textContent = `⚠️ ${saved} selecionada, mas notificações não autorizadas. Toque duas vezes no seu nome para autorizar.`;
            }
        }
    }

    // Alertas que venceram enquanto o app estava fechado
    checkScheduledNotifications();
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            updateCurrentDate();
            updateHighlights();
            checkScheduledNotifications();
        }
    });

    // Focar na data mais próxima (depois de restaurar a organista salva) e
    // apresentar quem toca hoje
    focusNearestDate();
    setTimeout(playTodayTour, 400);

    console.log('✅ App carregado com botão de seleção no header!');
});

// O conteúdo começa logo abaixo do header, que muda de altura conforme a tela e a fonte do celular
function syncHeaderHeight() {
    const header = document.querySelector('.header');
    if (!header) return;
    const apply = () => document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`);
    apply();
    if ('ResizeObserver' in window) new ResizeObserver(apply).observe(header);
}

function setupTabNavigation() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(this.dataset.section).classList.add('active');
            cancelTour();
            focusNearestDate();
        });
    });
}

// Data (meia-noite) de um item da escala: .schedule-item ("08 DOM") ou .tuning-btn
function getItemDate(el) {
    const month = el.dataset.month;
    const day = el.classList.contains('tuning-btn')
        ? scheduleData.tuning[month].day
        : parseInt(el.dataset.schedule);
    return new Date(scheduleYear, scheduleData.monthNumbers[month] - 1, day);
}

// Próximo item (de hoje em diante) dentro de root; se organist for passado, só dela
function findNextItem(root, organist) {
    const now = getCurrentDate();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let best = null;
    let bestDate = null;

    root.querySelectorAll('.schedule-item, .tuning-btn').forEach(el => {
        if (organist && el.dataset.organist !== organist) return;
        const date = getItemDate(el);
        if (date < today) return;
        if (!best || date < bestDate) {
            best = el;
            bestDate = date;
        }
    });
    return best;
}

function isToday(el) {
    const now = getCurrentDate();
    const date = getItemDate(el);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

// Centraliza el na horizontal dentro da sua tabela, na área à direita da coluna fixa dos nomes
function centerHorizontally(el, behavior = 'auto') {
    const container = el.closest('.table-container');
    if (!container) return;
    const nameColumn = container.querySelector('.grid-header')?.offsetWidth || 0;
    const offset = el.getBoundingClientRect().left - container.getBoundingClientRect().left + container.scrollLeft;
    const visibleWidth = container.clientWidth - nameColumn;
    let left = offset - nameColumn - (visibleWidth - el.offsetWidth) / 2;

    // Arredonda para o começo de um mês (mesma "trava" da rolagem com o dedo)
    const headers = container.querySelectorAll('.grid-header');
    const monthStep = headers.length > 2 ? headers[2].getBoundingClientRect().left - headers[1].getBoundingClientRect().left : 0;
    if (monthStep > 0) left = Math.round(left / monthStep) * monthStep;

    container.scrollTo({ left, behavior });
}

// Centraliza el na vertical, na área visível entre o header e a navegação inferior
function centerVertically(el, behavior = 'auto') {
    const rect = el.getBoundingClientRect();
    const headerBottom = document.querySelector('.header')?.getBoundingClientRect().bottom || 0;
    const navTop = document.querySelector('.tab-navigation')?.getBoundingClientRect().top || window.innerHeight;
    const visibleCenter = (headerBottom + navTop) / 2;
    window.scrollTo({ top: window.scrollY + rect.top + rect.height / 2 - visibleCenter, behavior });
}

// Rola cada tabela da aba ativa até a data mais próxima e centraliza a tela nela.
// Com organista selecionada, prioriza a data dela.
function focusNearestDate(behavior = 'auto') {
    const section = document.querySelector('.section.active');
    if (!section) return;

    const organist = selectedOrganist;
    const pickTarget = root => (organist && findNextItem(root, organist)) || findNextItem(root);

    section.querySelectorAll('.table-container').forEach(container => {
        // Sem datas futuras na tabela: mostra dezembro
        const target = pickTarget(container) || container.querySelectorAll('.grid-header')[scheduleData.months.length];
        if (target) centerHorizontally(target, behavior);
    });

    const target = pickTarget(section);
    if (target) centerVertically(target, behavior);
}

// Ao abrir: passa 1.5s em cada organista que toca hoje e depois volta para a data
// da organista selecionada. Qualquer toque/rolagem do usuário interrompe.
const TOUR_STEP_MS = 1500;
let tourTimers = [];

function clearSpotlight() {
    document.querySelectorAll('.spotlight').forEach(el => el.classList.remove('spotlight'));
}

function cancelTour() {
    tourTimers.forEach(clearTimeout);
    tourTimers = [];
    clearSpotlight();
}

function playTodayTour() {
    cancelTour();
    const section = document.querySelector('.section.active');
    if (!section) return;

    const todayItems = [...section.querySelectorAll('.schedule-item, .tuning-btn')].filter(isToday);
    if (!todayItems.length) return focusNearestDate('smooth');

    todayItems.forEach((el, i) => {
        tourTimers.push(setTimeout(() => {
            clearSpotlight();
            el.classList.add('spotlight');
            centerHorizontally(el, 'smooth');
            centerVertically(el, 'smooth');
        }, i * TOUR_STEP_MS));
    });

    tourTimers.push(setTimeout(() => {
        tourTimers = [];
        clearSpotlight();
        focusNearestDate('smooth');
    }, todayItems.length * TOUR_STEP_MS));
}

['touchstart', 'wheel', 'mousedown', 'keydown'].forEach(type => {
    window.addEventListener(type, () => { if (tourTimers.length) cancelTour(); }, { passive: true });
});

function setupToggle() {
    const toggle = document.getElementById('highlightToggle');
    
    toggle.addEventListener('change', function() {
        highlightEnabled = this.checked;
        if (highlightEnabled) {
            updateHighlights();
        } else {
            document.querySelectorAll('.today-highlight, .organist-today, .tuning-btn.today, .schedule-item.today').forEach(el => {
                el.classList.remove('today-highlight', 'organist-today', 'today');
            });
        }
    });
}

function buildAllSchedules() {
    buildAfinacaoGrid('afinacaoGrid');
    buildAfinacaoGrid('afinacaoGridGeral');
    buildOficialGrid('oficialGrid');
    buildOficialGrid('oficialGridGeral');
    buildMeiaHoraGrid('meiaHoraGrid');
    buildMeiaHoraGrid('meiaHoraGridGeral');
    buildJovensGrid('jovensGrid');
    buildJovensGrid('jovensGridGeral');
}

function createHeader(grid) {
    const headerOrganist = document.createElement('div');
    headerOrganist.className = 'grid-header';
    headerOrganist.textContent = 'ORGANISTA';
    grid.appendChild(headerOrganist);
    
    scheduleData.months.forEach(month => {
        const header = document.createElement('div');
        header.className = 'grid-header';
        header.textContent = month;
        grid.appendChild(header);
    });
}

// Rótulo pequeno do mês no topo de cada caixa
function createMonthLabel(month) {
    const label = document.createElement('div');
    label.className = 'cell-month';
    label.textContent = month;
    return label;
}

function buildAfinacaoGrid(gridId) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';
    
    createHeader(grid);
    
    const nameCell = document.createElement('div');
    nameCell.className = 'grid-cell organist-name afinacao';
    nameCell.textContent = 'AFINAÇÃO';
    grid.appendChild(nameCell);
    
    scheduleData.months.forEach(month => {
        const cell = document.createElement('div');
        cell.className = 'grid-cell afinacao';
        cell.appendChild(createMonthLabel(month));
        
        const tuningInfo = scheduleData.tuning[month];
        if (tuningInfo) {
            const btn = document.createElement('div');
            btn.className = 'tuning-btn';
            const weekdayLabel = ['DOM','SEG','TER','QUA','QUI','SEX','SAB'][tuningInfo.weekday];
            btn.textContent = `${String(tuningInfo.day).padStart(2, '0')} ${weekdayLabel}\n${tuningInfo.organist}`;
            btn.dataset.month = month;
            btn.dataset.organist = tuningInfo.organist;
            cell.appendChild(btn);
        }
        
        grid.appendChild(cell);
    });
}

function buildOficialGrid(gridId) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';
    
    createHeader(grid);
    
    const organistOrder = ['Arlete', 'Adriana', 'Ednice', 'Maeme', 'Regiane'];
    
    organistOrder.forEach(organist => {
        const schedule = scheduleData.oficial[organist] || {};
        
        const nameCell = document.createElement('div');
        nameCell.className = `grid-cell organist-name ${organist.toLowerCase()}`;
        nameCell.textContent = organist;
        nameCell.dataset.organist = organist;
        grid.appendChild(nameCell);
        
        scheduleData.months.forEach(month => {
            const cell = document.createElement('div');
            cell.className = `grid-cell ${organist.toLowerCase()}`;
            cell.appendChild(createMonthLabel(month));
            
            const container = document.createElement('div');
            container.className = 'schedule-items-container';
            
            if (schedule[month]) {
                schedule[month].forEach(item => {
                    const scheduleItem = document.createElement('div');
                    scheduleItem.className = 'schedule-item';
                    scheduleItem.textContent = item;
                    scheduleItem.dataset.month = month;
                    scheduleItem.dataset.schedule = item;
                    scheduleItem.dataset.organist = organist;
                    container.appendChild(scheduleItem);
                });
            }
            
            cell.appendChild(container);
            grid.appendChild(cell);
        });
    });
}

function buildMeiaHoraGrid(gridId) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';
    
    createHeader(grid);
    
    Object.entries(scheduleData.meiaHora).forEach(([organist, schedule]) => {
        const nameCell = document.createElement('div');
        nameCell.className = `grid-cell organist-name ${organist.toLowerCase()}`;
        nameCell.textContent = organist;
        nameCell.dataset.organist = organist;
        grid.appendChild(nameCell);
        
        scheduleData.months.forEach(month => {
            const cell = document.createElement('div');
            cell.className = `grid-cell ${organist.toLowerCase()}`;
            cell.appendChild(createMonthLabel(month));
            
            const container = document.createElement('div');
            container.className = 'schedule-items-container';
            
            if (schedule[month]) {
                schedule[month].forEach(item => {
                    const scheduleItem = document.createElement('div');
                    scheduleItem.className = 'schedule-item';
                    scheduleItem.textContent = item;
                    scheduleItem.dataset.month = month;
                    scheduleItem.dataset.schedule = item;
                    scheduleItem.dataset.organist = organist;
                    container.appendChild(scheduleItem);
                });
            }
            
            cell.appendChild(container);
            grid.appendChild(cell);
        });
    });
}

function buildJovensGrid(gridId) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';
    
    createHeader(grid);
    
    Object.entries(scheduleData.jovens).forEach(([organist, schedule]) => {
        const nameCell = document.createElement('div');
        nameCell.className = `grid-cell organist-name ${organist.toLowerCase()}`;
        nameCell.textContent = organist;
        nameCell.dataset.organist = organist;
        grid.appendChild(nameCell);
        
        scheduleData.months.forEach(month => {
            const cell = document.createElement('div');
            cell.className = `grid-cell ${organist.toLowerCase()}`;
            cell.appendChild(createMonthLabel(month));
            
            const container = document.createElement('div');
            container.className = 'schedule-items-container';
            
            if (schedule[month]) {
                schedule[month].forEach(item => {
                    const scheduleItem = document.createElement('div');
                    scheduleItem.className = 'schedule-item';
                    scheduleItem.textContent = item;
                    scheduleItem.dataset.month = month;
                    scheduleItem.dataset.schedule = item;
                    scheduleItem.dataset.organist = organist;
                    container.appendChild(scheduleItem);
                });
            }
            
            cell.appendChild(container);
            grid.appendChild(cell);
        });
    });
}

function updateHighlights() {
    document.querySelectorAll('.today-highlight, .organist-today, .tuning-btn.today, .schedule-item.today').forEach(el => {
        el.classList.remove('today-highlight', 'organist-today', 'today');
    });

    if (!highlightEnabled) return;

    const now = getCurrentDate();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentWeekday = now.getDay();
    const currentMonthName = getMonthName(currentMonth);

    if (!currentMonthName || now.getFullYear() !== scheduleYear) return;

    console.log(`📅 Verificando destaques para: ${currentDay}/${currentMonth} (${currentMonthName}) - ${['DOM','SEG','TER','QUA','QUI','SEX','SAB'][currentWeekday]}`);

    const tuningInfo = scheduleData.tuning[currentMonthName];
    if (tuningInfo && currentWeekday === tuningInfo.weekday && currentDay === tuningInfo.day) {
        console.log(`🔧 Destaque afinação: ${tuningInfo.organist}`);
        
        document.querySelectorAll('.tuning-btn').forEach(btn => {
            if (btn.dataset.month === currentMonthName && btn.dataset.organist === tuningInfo.organist) {
                btn.classList.add('today');
            }
        });
        
        document.querySelectorAll(`[data-organist="${tuningInfo.organist}"]`).forEach(el => {
            if (el.classList.contains('organist-name')) {
                el.classList.add('organist-today');
            }
        });
    }

    document.querySelectorAll('.schedule-item').forEach(item => {
        if (item.dataset.month === currentMonthName) {
            const schedule = item.dataset.schedule;
            if (checkScheduleToday(schedule, currentMonth)) {
                console.log(`🎵 Destaque culto: ${item.dataset.organist} - ${schedule}`);
                item.classList.add('today');
                
                const organist = item.dataset.organist;
                document.querySelectorAll(`[data-organist="${organist}"]`).forEach(el => {
                    if (el.classList.contains('organist-name')) {
                        el.classList.add('organist-today');
                    }
                });
            }
        }
    });
}

function checkScheduleToday(scheduleItem, month) {
    const now = getCurrentDate();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentWeekday = now.getDay();
    
    if (currentMonth !== month || now.getFullYear() !== scheduleYear) return false;
    
    const match = scheduleItem.match(/^(\d{1,2})\s+(\w{3})$/);
    if (!match) return false;
    
    const scheduleDay = parseInt(match[1]);
    const scheduleWeekday = match[2];
    
    return scheduleDay === currentDay && scheduleData.weekdayMap[scheduleWeekday] === currentWeekday;
}

function getMonthName(monthNumber) {
    const monthNames = { 1: 'JAN', 2: 'FEV', 3: 'MAR', 4: 'ABR', 5: 'MAI', 6: 'JUN', 7: 'JUL', 8: 'AGO', 9: 'SET', 10: 'OUT', 11: 'NOV', 12: 'DEZ' };
    return monthNames[monthNumber] || null;
}

// Troca o ano da escala e redesenha as tabelas
function showScheduleYear(year) {
    loadScheduleYear(year);
    buildAllSchedules();
    const yearLabel = document.getElementById('scheduleYearLabel');
    if (yearLabel) yearLabel.textContent = scheduleYear;
}

function testDate(day, month, year = new Date().getFullYear()) {
    console.warn('⚠️ MODO TESTE ATIVADO - Esta função é apenas para debug');
    const testDateObj = new Date(year, month - 1, day);

    const originalGetCurrentDate = getCurrentDate;
    const originalYear = scheduleYear;
    window.getCurrentDate = () => testDateObj;
    if (year !== scheduleYear) showScheduleYear(year);

    updateCurrentDate();
    updateHighlights();
    focusNearestDate();
    playTodayTour();

    console.log(`🧪 Testando data: ${day}/${month}/${year}`);
    
    setTimeout(() => {
        window.getCurrentDate = originalGetCurrentDate;
        if (scheduleYear !== originalYear) showScheduleYear(originalYear);
        updateCurrentDate();
        updateHighlights();
        console.log('🔄 Voltando para data real');
    }, 10000);
}

function testNotifications() {
    if (!selectedOrganist) {
        showCustomNotification(
            '⚠️ Selecione um organista',
            'Primeiro selecione seu nome para testar as notificações!'
        );
        return;
    }
    
    console.log('🔔 Permissão do navegador:', 'Notification' in window ? Notification.permission : 'não suportado');
    showCustomNotification(
        `🧪 Teste: ${selectedOrganist}`,
        notificationPermission
            ? 'Se apareceu também uma notificação do sistema, está tudo funcionando! 😊'
            : 'Notificações do sistema não autorizadas — só o aviso dentro do app aparece.'
    );
}

// Simula estar a X minutos do horário de um compromisso real da organista selecionada
function testCloseToCulto(day, month, hour, minute, year = new Date().getFullYear()) {
    if (!selectedOrganist) {
        console.warn('⚠️ Selecione uma organista antes de testar.');
        return;
    }

    console.warn('⚠️ MODO TESTE ATIVADO - Esta função é apenas para debug');
    const testDateObj = new Date(year, month - 1, day, hour, minute);

    const originalGetCurrentDate = getCurrentDate;
    const originalNotified = notifiedProximityEvents;
    window.getCurrentDate = () => testDateObj;
    notifiedProximityEvents = new Set();

    console.log(`🧪 Simulando horário: ${testDateObj.toLocaleString('pt-BR')}`);
    checkScheduledNotifications();

    setTimeout(() => {
        window.getCurrentDate = originalGetCurrentDate;
        notifiedProximityEvents = originalNotified;
        saveNotifiedEvents();
        console.log('🔄 Voltando para horário real');
    }, 10000);
}

window.testDate = testDate;
window.testNotifications = testNotifications;
window.testCloseToCulto = testCloseToCulto;

console.log('🎵 App Rodízio Organistas carregado!');
console.log('📅 Funcionando com data real do sistema');
console.log('🔧 Use testDate(dia, mes) no console para testar outras datas');
console.log('🔔 Use testNotifications() para testar as notificações');
console.log('⏰ Use testCloseToCulto(dia, mes, hora, minuto) para simular estar perto do horário do culto');
console.log('🎹 Botão de seleção de organista agora no header!');