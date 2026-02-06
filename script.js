// Dados do sistema - ATUALIZADO PARA 2026 (JANEIRO A JUNHO)
// IMPORTANTE: Janeiro/2026 começa na QUINTA-FEIRA (dia 1)
const scheduleData = {
    months: ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN'],
    monthNumbers: { 'JAN': 1, 'FEV': 2, 'MAR': 3, 'ABR': 4, 'MAI': 5, 'JUN': 6 },
    weekdayMap: { 'DOM': 0, 'SEG': 1, 'TER': 2, 'QUA': 3, 'QUI': 4, 'SEX': 5, 'SAB': 6 },
    
    // Afinação: primeiro sábado de cada mês
    // Sequência: Gabriela, Arlete, Adriana, Ednice, Maeme, Helena
    tuning: {
        'JAN': { day: 3, organist: 'Gabriela' },    // Sábado, 3 de janeiro
        'FEV': { day: 7, organist: 'Arlete' },      // Sábado, 7 de fevereiro
        'MAR': { day: 7, organist: 'Adriana' },     // Sábado, 7 de março
        'ABR': { day: 4, organist: 'Ednice' },      // Sábado, 4 de abril
        'MAI': { day: 2, organist: 'Maeme' },       // Sábado, 2 de maio
        'JUN': { day: 6, organist: 'Helena' }       // Sábado, 6 de junho
    },
    
    // Rodízio Oficial: Maeme começa na SEXTA dia 2 de janeiro (PRIMEIRA A TOCAR)
    // Ordem alfabética na tela: Arlete → Adriana → Ednice → Maeme
    // Sequência do rodízio: Maeme → Arlete → Adriana → Ednice (repete)
    oficial: {
        'Arlete': {
            'JAN': ['04 DOM', '14 QUA', '23 SEX'],
            'FEV': ['01 DOM', '11 QUA', '20 SEX'],
            'MAR': ['01 DOM', '11 QUA', '20 SEX', '29 DOM'],
            'ABR': ['08 QUA', '17 SEX', '26 DOM'],
            'MAI': ['06 QUA', '15 SEX', '24 DOM'],
            'JUN': ['03 QUA', '12 SEX', '21 DOM']
        },
        'Adriana': {
            'JAN': ['07 QUA', '16 SEX', '25 DOM'],
            'FEV': ['04 QUA', '13 SEX', '22 DOM'],
            'MAR': ['04 QUA', '13 SEX', '22 DOM'],
            'ABR': ['01 QUA', '10 SEX', '19 DOM', '29 QUA'],
            'MAI': ['08 SEX', '17 DOM', '27 QUA'],
            'JUN': ['05 SEX', '14 DOM', '24 QUA']
        },
        'Ednice': {
            'JAN': ['09 SEX', '18 DOM', '28 QUA'],
            'FEV': ['06 SEX', '15 DOM', '25 QUA'],
            'MAR': ['06 SEX', '15 DOM', '25 QUA'],
            'ABR': ['03 SEX', '12 DOM', '22 QUA'],
            'MAI': ['01 SEX', '10 DOM', '20 QUA', '29 SEX'],
            'JUN': ['07 DOM', '17 QUA', '26 SEX']
        },
        'Maeme': {
            'JAN': ['02 SEX', '11 DOM', '21 QUA', '30 SEX'],
            'FEV': ['08 DOM', '18 QUA', '27 SEX'],
            'MAR': ['08 DOM', '18 QUA', '27 SEX'],
            'ABR': ['05 DOM', '15 QUA', '24 SEX'],
            'MAI': ['03 DOM', '13 QUA', '22 SEX', '31 DOM'],
            'JUN': ['10 QUA', '19 SEX', '28 DOM']
        }
    },
    
    // Meia Hora: Helena no primeiro domingo que ela toca Jovens
    // Lavinia no primeiro domingo que ela toca Jovens
    meiaHora: {
        'Helena': {
            'JAN': ['04 DOM'], 
            'FEV': ['15 DOM'], 
            'MAR': ['08 DOM'],
            'ABR': ['19 DOM'], 
            'MAI': ['10 DOM'], 
            'JUN': ['21 DOM']
        },
        'Lavinia': {
            'JAN': ['11 DOM'],  // Mesmo dia de Jovens
            'FEV': ['01 DOM'],  // Mesmo dia de Jovens
            'MAR': ['15 DOM'],  // Mesmo dia de Jovens
            'ABR': ['05 DOM'],  // Mesmo dia de Jovens
            'MAI': ['17 DOM'],  // Mesmo dia de Jovens
            'JUN': ['07 DOM']   // Mesmo dia de Jovens
        }
    },
    
    jovens: {
        'Helena': {
            'JAN': ['04 DOM', '25 DOM'], 
            'FEV': ['15 DOM'],
            'MAR': ['08 DOM', '29 DOM'], 
            'ABR': ['19 DOM'],
            'MAI': ['10 DOM', '31 DOM'], 
            'JUN': ['21 DOM']
        },
        'Lavinia': {
            'JAN': ['11 DOM'], 
            'FEV': ['01 DOM', '22 DOM'],
            'MAR': ['15 DOM'], 
            'ABR': ['05 DOM', '26 DOM'],
            'MAI': ['17 DOM'], 
            'JUN': ['07 DOM', '28 DOM']
        },
        'Gabriela': {
            'JAN': ['18 DOM'], 
            'FEV': ['08 DOM'],
            'MAR': ['01 DOM', '22 DOM'], 
            'ABR': ['12 DOM'],
            'MAI': ['03 DOM', '24 DOM'], 
            'JUN': ['14 DOM']
        }
    }
};

// Variáveis globais
let selectedOrganist = null;
let highlightEnabled = true;
let notificationPermission = false;
let selectorOpen = false;
let notificationsSent = false;

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

function showCustomNotification(title, message, type = 'info') {
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
    
    // Mostrar notificação do navegador também
    if (notificationPermission) {
        new Notification(title, {
            body: message,
            icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"%3E%3Crect width="192" height="192" fill="%236366f1"/%3E%3Ctext x="96" y="130" font-family="Arial" font-size="120" text-anchor="middle" fill="white"%3E🎵%3C/text%3E%3C/svg%3E',
            vibrate: [200, 100, 200],
            tag: 'organist-reminder'
        });
    }
    
    setTimeout(() => {
        notification.style.animation = 'slideUpCustom 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}

// Verificar se a organista tem compromisso em uma data específica
function checkOrganistSchedule(organist, date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const weekday = date.getDay();
    const monthName = getMonthName(month);
    
    if (!monthName) return null;
    
    // Verificar afinação
    const tuningInfo = scheduleData.tuning[monthName];
    if (tuningInfo && tuningInfo.organist === organist && weekday === 6 && day === tuningInfo.day) {
        return {
            type: 'afinacao',
            time: '09:00',
            description: 'Afinação e Ensaio'
        };
    }
    
    // Verificar rodízio oficial
    if (scheduleData.oficial[organist] && scheduleData.oficial[organist][monthName]) {
        for (const item of scheduleData.oficial[organist][monthName]) {
            const match = item.match(/^(\d{1,2})\s+(\w{3})$/);
            if (match) {
                const scheduleDay = parseInt(match[1]);
                const scheduleWeekday = match[2];
                if (scheduleDay === day && scheduleData.weekdayMap[scheduleWeekday] === weekday) {
                    const time = scheduleWeekday === 'DOM' ? '18:30' : '19:30';
                    return {
                        type: 'oficial',
                        time: time,
                        description: `Culto ${scheduleWeekday === 'DOM' ? 'Dominical' : 'de Oração'}`
                    };
                }
            }
        }
    }
    
    // Verificar meia hora
    if (scheduleData.meiaHora[organist] && scheduleData.meiaHora[organist][monthName]) {
        for (const item of scheduleData.meiaHora[organist][monthName]) {
            const match = item.match(/^(\d{1,2})\s+(\w{3})$/);
            if (match) {
                const scheduleDay = parseInt(match[1]);
                const scheduleWeekday = match[2];
                if (scheduleDay === day && scheduleData.weekdayMap[scheduleWeekday] === weekday) {
                    return {
                        type: 'meia-hora',
                        time: '18:00',
                        description: 'Culto Meia Hora'
                    };
                }
            }
        }
    }
    
    // Verificar jovens
    if (scheduleData.jovens[organist] && scheduleData.jovens[organist][monthName]) {
        for (const item of scheduleData.jovens[organist][monthName]) {
            const match = item.match(/^(\d{1,2})\s+(\w{3})$/);
            if (match) {
                const scheduleDay = parseInt(match[1]);
                const scheduleWeekday = match[2];
                if (scheduleDay === day && scheduleData.weekdayMap[scheduleWeekday] === weekday) {
                    return {
                        type: 'jovens',
                        time: '19:00',
                        description: 'Reunião de Jovens e Menores'
                    };
                }
            }
        }
    }
    
    return null;
}

// Sistema de notificações inteligente baseado na escala real
function checkUpcomingSchedules() {
    if (!selectedOrganist || notificationsSent) return;
    
    const now = getCurrentDate();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Verificar compromissos reais da organista
    const tomorrowSchedule = checkOrganistSchedule(selectedOrganist, tomorrow);
    const todaySchedule = checkOrganistSchedule(selectedOrganist, now);
    
    notificationsSent = true;
    
    // Simular notificações baseadas na escala real
    if (tomorrowSchedule) {
        setTimeout(() => {
            showCustomNotification(
                `🗓️ Lembrete: ${selectedOrganist}`,
                `Amanhã você tem ${tomorrowSchedule.description} às ${tomorrowSchedule.time}. Prepare-se com antecedência!`
            );
        }, 2000);
    } else {
        setTimeout(() => {
            showCustomNotification(
                `🗓️ Lembrete: ${selectedOrganist}`,
                `Você não tem compromissos musicais amanhã. Aproveite para descansar! 😊`
            );
        }, 2000);
    }
    
    if (todaySchedule) {
        setTimeout(() => {
            showCustomNotification(
                `⏰ Atenção: ${selectedOrganist}`,
                `Hoje você tem ${todaySchedule.description} às ${todaySchedule.time}. Revise as músicas!`
            );
        }, 5000);
        
        setTimeout(() => {
            showCustomNotification(
                `🎹 Hora de se preparar: ${selectedOrganist}`,
                `${todaySchedule.description} em 45 minutos (${todaySchedule.time})! É hora de ir para a igreja. Não esqueça das partituras!`
            );
        }, 8000);
    }
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
    selectorButton.textContent = '🎹 Selecionar Organista';
    selectorButton.classList.remove('open');
    selectorOpen = false;
    
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
        option.addEventListener('click', async function() {
            const radio = this.querySelector('input[type="radio"]');
            const organist = this.dataset.organist;
            
            console.log('🎹 Organista selecionado:', organist);
            
            // Limpar seleções anteriores
            options.forEach(opt => opt.classList.remove('selected'));
            
            // Resetar notificações para novo organista
            notificationsSent = false;
            
            // Selecionar atual
            this.classList.add('selected');
            radio.checked = true;
            selectedOrganist = organist;
            
            // Solicitar permissão para notificações
            const permission = await requestNotificationPermission();
            
            if (permission) {
                statusElement.textContent = `✅ Notificações ativadas para ${organist}`;
                showCustomNotification(
                    `🎵 Bem-vinda, ${organist}!`,
                    `Notificações ativadas! Você receberá lembretes personalizados dos seus compromissos musicais.`
                );
                
                // Fechar seletor automaticamente após seleção
                setTimeout(() => {
                    closeSelector();
                }, 3000);
                
                // Iniciar simulação de notificações APENAS UMA VEZ
                setTimeout(() => {
                    checkUpcomingSchedules();
                }, 5000);
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
    updateCurrentDate();
    buildAllSchedules();
    updateHighlights();
    setupToggle();
    
    const selectorButton = document.getElementById('organistSelectorButton');
    const selector = document.getElementById('organistSelector');
    
    console.log('🔍 Elementos encontrados:', {
        botao: !!selectorButton,
        seletor: !!selector
    });
    
    setInterval(() => {
        updateCurrentDate();
        updateHighlights();
    }, 60000);
    
    console.log('✅ App carregado com botão de seleção no header!');
});

function setupTabNavigation() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(this.dataset.section).classList.add('active');
        });
    });
}

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
        
        const tuningInfo = scheduleData.tuning[month];
        if (tuningInfo) {
            const btn = document.createElement('div');
            btn.className = 'tuning-btn';
            btn.textContent = `${String(tuningInfo.day).padStart(2, '0')} SAB\n${tuningInfo.organist}`;
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
    
    const organistOrder = ['Arlete', 'Adriana', 'Ednice', 'Maeme'];
    
    organistOrder.forEach(organist => {
        const schedule = scheduleData.oficial[organist];
        
        const nameCell = document.createElement('div');
        nameCell.className = `grid-cell organist-name ${organist.toLowerCase()}`;
        nameCell.textContent = organist;
        nameCell.dataset.organist = organist;
        grid.appendChild(nameCell);
        
        scheduleData.months.forEach(month => {
            const cell = document.createElement('div');
            cell.className = `grid-cell ${organist.toLowerCase()}`;
            
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

    if (!currentMonthName) return;

    console.log(`📅 Verificando destaques para: ${currentDay}/${currentMonth} (${currentMonthName}) - ${['DOM','SEG','TER','QUA','QUI','SEX','SAB'][currentWeekday]}`);

    const tuningInfo = scheduleData.tuning[currentMonthName];
    if (tuningInfo && currentWeekday === 6 && currentDay === tuningInfo.day) {
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
    
    if (currentMonth !== month) return false;
    
    const match = scheduleItem.match(/^(\d{1,2})\s+(\w{3})$/);
    if (!match) return false;
    
    const scheduleDay = parseInt(match[1]);
    const scheduleWeekday = match[2];
    
    return scheduleDay === currentDay && scheduleData.weekdayMap[scheduleWeekday] === currentWeekday;
}

function getMonthName(monthNumber) {
    const monthNames = { 1: 'JAN', 2: 'FEV', 3: 'MAR', 4: 'ABR', 5: 'MAI', 6: 'JUN' };
    return monthNames[monthNumber] || null;
}

function testDate(day, month, year = 2026) {
    console.warn('⚠️ MODO TESTE ATIVADO - Esta função é apenas para debug');
    const testDateObj = new Date(year, month - 1, day);
    
    const originalGetCurrentDate = getCurrentDate;
    window.getCurrentDate = () => testDateObj;
    
    updateCurrentDate();
    updateHighlights();
    
    console.log(`🧪 Testando data: ${day}/${month}/${year}`);
    
    setTimeout(() => {
        window.getCurrentDate = originalGetCurrentDate;
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
    
    notificationsSent = false;
    
    showCustomNotification(
        '🧪 Teste de Notificações',
        'Iniciando simulação de notificações para demonstração...'
    );
    
    checkUpcomingSchedules();
}

window.testDate = testDate;
window.testNotifications = testNotifications;

console.log('🎵 App Rodízio Organistas carregado!');
console.log('📅 Funcionando com data real do sistema');
console.log('🔧 Use testDate(dia, mes) no console para testar outras datas');
console.log('🔔 Use testNotifications() para testar as notificações');
console.log('🎹 Botão de seleção de organista agora no header!');