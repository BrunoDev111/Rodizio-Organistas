// Escala do rodízio + regras dos lembretes. Usado pelo app (index.html) e pelas funções de push do Netlify.
// Dados do sistema - ATUALIZADO PARA 2026 (JANEIRO A DEZEMBRO)
// IMPORTANTE: Janeiro/2026 começa na QUINTA-FEIRA (dia 1)
const scheduleData = {
    months: ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'],
    monthNumbers: { 'JAN': 1, 'FEV': 2, 'MAR': 3, 'ABR': 4, 'MAI': 5, 'JUN': 6, 'JUL': 7, 'AGO': 8, 'SET': 9, 'OUT': 10, 'NOV': 11, 'DEZ': 12 },
    weekdayMap: { 'DOM': 0, 'SEG': 1, 'TER': 2, 'QUA': 3, 'QUI': 4, 'SEX': 5, 'SAB': 6 },

    // Afinação: JAN–JUN = primeiro sábado; JUL–DEZ = primeiro domingo (mudança a partir de 30/06/2026)
    // Sequência: Gabriela, Arlete, Adriana, Ednice, Maeme, Helena (repete)
    // Próximo ciclo (2027): Gabriela, Regiane, Arlete, Adriana, Ednice, Maeme, Helena
    tuning: {
        'JAN': { day: 3,  organist: 'Gabriela', weekday: 6 },  // Sábado, 3 de janeiro
        'FEV': { day: 7,  organist: 'Arlete',   weekday: 6 },  // Sábado, 7 de fevereiro
        'MAR': { day: 7,  organist: 'Adriana',  weekday: 6 },  // Sábado, 7 de março
        'ABR': { day: 4,  organist: 'Ednice',   weekday: 6 },  // Sábado, 4 de abril
        'MAI': { day: 2,  organist: 'Maeme',    weekday: 6 },  // Sábado, 2 de maio
        'JUN': { day: 6,  organist: 'Helena',   weekday: 6 },  // Sábado, 6 de junho
        'JUL': { day: 5,  organist: 'Gabriela', weekday: 0 },  // Domingo, 5 de julho
        'AGO': { day: 2,  organist: 'Arlete',   weekday: 0 },  // Domingo, 2 de agosto
        'SET': { day: 6,  organist: 'Adriana',  weekday: 0 },  // Domingo, 6 de setembro
        'OUT': { day: 4,  organist: 'Ednice',   weekday: 0 },  // Domingo, 4 de outubro
        'NOV': { day: 1,  organist: 'Maeme',    weekday: 0 },  // Domingo, 1 de novembro
        'DEZ': { day: 6,  organist: 'Helena',   weekday: 0 }   // Domingo, 6 de dezembro
    },
    
    // Rodízio Oficial: Maeme começa na SEXTA dia 2 de janeiro (PRIMEIRA A TOCAR)
    // Ordem alfabética na tela: Arlete → Adriana → Ednice → Maeme
    // Sequência do rodízio: Maeme → Arlete → Adriana → Ednice (repete)
    // A partir de 08/11/2026: Maeme → Regiane → Arlete → Adriana → Ednice (repete)
    oficial: {
        'Arlete': {
            'JAN': ['04 DOM', '14 QUA', '23 SEX'],
            'FEV': ['01 DOM', '11 QUA', '20 SEX'],
            'MAR': ['01 DOM', '11 QUA', '20 SEX', '29 DOM'],
            'ABR': ['08 QUA', '17 SEX', '26 DOM'],
            'MAI': ['06 QUA', '15 SEX', '24 DOM'],
            'JUN': ['03 QUA', '12 SEX', '21 DOM'],
            'JUL': ['01 QUA', '10 SEX', '19 DOM', '29 QUA'],
            'AGO': ['07 SEX', '16 DOM', '26 QUA'],
            'SET': ['04 SEX', '13 DOM', '23 QUA'],
            'OUT': ['02 SEX', '11 DOM', '21 QUA', '30 SEX'],
            'NOV': ['11 QUA', '22 DOM'],
            'DEZ': ['04 SEX', '16 QUA', '27 DOM']
        },
        'Adriana': {
            'JAN': ['07 QUA', '16 SEX', '25 DOM'],
            'FEV': ['04 QUA', '13 SEX', '22 DOM'],
            'MAR': ['04 QUA', '13 SEX', '22 DOM'],
            'ABR': ['01 QUA', '10 SEX', '19 DOM', '29 QUA'],
            'MAI': ['08 SEX', '17 DOM', '27 QUA'],
            'JUN': ['05 SEX', '14 DOM', '24 QUA'],
            'JUL': ['03 SEX', '12 DOM', '22 QUA', '31 SEX'],
            'AGO': ['09 DOM', '19 QUA', '28 SEX'],
            'SET': ['06 DOM', '16 QUA', '25 SEX'],
            'OUT': ['04 DOM', '14 QUA', '23 SEX'],
            'NOV': ['01 DOM', '13 SEX', '25 QUA'],
            'DEZ': ['06 DOM', '18 SEX', '30 QUA']
        },
        'Ednice': {
            'JAN': ['09 SEX', '18 DOM', '28 QUA'],
            'FEV': ['06 SEX', '15 DOM', '25 QUA'],
            'MAR': ['06 SEX', '15 DOM', '25 QUA'],
            'ABR': ['03 SEX', '12 DOM', '22 QUA'],
            'MAI': ['01 SEX', '10 DOM', '20 QUA', '29 SEX'],
            'JUN': ['07 DOM', '17 QUA', '26 SEX'],
            'JUL': ['05 DOM', '15 QUA', '24 SEX'],
            'AGO': ['02 DOM', '12 QUA', '21 SEX', '30 DOM'],
            'SET': ['09 QUA', '18 SEX', '27 DOM'],
            'OUT': ['07 QUA', '16 SEX', '25 DOM'],
            'NOV': ['04 QUA', '15 DOM', '27 SEX'],
            'DEZ': ['09 QUA', '20 DOM']
        },
        'Maeme': {
            'JAN': ['02 SEX', '11 DOM', '21 QUA', '30 SEX'],
            'FEV': ['08 DOM', '18 QUA', '27 SEX'],
            'MAR': ['08 DOM', '18 QUA', '27 SEX'],
            'ABR': ['05 DOM', '15 QUA', '24 SEX'],
            'MAI': ['03 DOM', '13 QUA', '22 SEX', '31 DOM'],
            'JUN': ['10 QUA', '19 SEX', '28 DOM'],
            'JUL': ['08 QUA', '17 SEX', '26 DOM'],
            'AGO': ['05 QUA', '14 SEX', '23 DOM'],
            'SET': ['02 QUA', '11 SEX', '20 DOM', '30 QUA'],
            'OUT': ['09 SEX', '18 DOM', '28 QUA'],
            'NOV': ['06 SEX', '18 QUA', '29 DOM'],
            'DEZ': ['11 SEX', '23 QUA']
        },
        // Regiane entrou no rodízio em 08/11/2026 (logo após a Maeme)
        'Regiane': {
            'NOV': ['08 DOM', '20 SEX'],
            'DEZ': ['02 QUA', '13 DOM', '25 SEX']
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
            'JUN': ['21 DOM'],
            'JUL': ['12 DOM'],
            'AGO': ['02 DOM'],
            'SET': ['13 DOM'],
            'OUT': ['04 DOM'],
            'NOV': ['15 DOM'],
            'DEZ': ['06 DOM']
        },
        'Lavinia': {
            'JAN': ['11 DOM'],
            'FEV': ['01 DOM'],
            'MAR': ['15 DOM'],
            'ABR': ['05 DOM'],
            'MAI': ['17 DOM'],
            'JUN': ['07 DOM']
            // Lavínia saiu do Meia Hora a partir de 30/06/2026
        }
    },

    jovens: {
        'Helena': {
            'JAN': ['04 DOM', '25 DOM'],
            'FEV': ['15 DOM'],
            'MAR': ['08 DOM', '29 DOM'],
            'ABR': ['19 DOM'],
            'MAI': ['10 DOM', '31 DOM'],
            'JUN': ['21 DOM'],
            'JUL': ['12 DOM'],
            'AGO': ['02 DOM', '23 DOM'],
            'SET': ['13 DOM'],
            'OUT': ['04 DOM', '25 DOM'],
            'NOV': ['15 DOM'],
            'DEZ': ['06 DOM', '27 DOM']
        },
        'Lavinia': {
            'JAN': ['11 DOM'],
            'FEV': ['01 DOM', '22 DOM'],
            'MAR': ['15 DOM'],
            'ABR': ['05 DOM', '26 DOM'],
            'MAI': ['17 DOM'],
            'JUN': ['07 DOM', '28 DOM'],
            'JUL': ['19 DOM'],
            'AGO': ['09 DOM', '30 DOM'],
            'SET': ['20 DOM'],
            'OUT': ['11 DOM'],
            'NOV': ['01 DOM', '22 DOM'],
            'DEZ': ['13 DOM']
        },
        'Gabriela': {
            'JAN': ['18 DOM'],
            'FEV': ['08 DOM'],
            'MAR': ['01 DOM', '22 DOM'],
            'ABR': ['12 DOM'],
            'MAI': ['03 DOM', '24 DOM'],
            'JUN': ['14 DOM'],
            'JUL': ['05 DOM', '26 DOM'],
            'AGO': ['16 DOM'],
            'SET': ['06 DOM', '27 DOM'],
            'OUT': ['18 DOM'],
            'NOV': ['08 DOM', '29 DOM'],
            'DEZ': ['20 DOM']
        }
    }
};

// ===== Escala automática (2027 em diante) =====
// 2026 continua com os dados fixos acima. Para os anos seguintes a escala é gerada
// a partir destas regras. Quando entrar/sair organista, ajuste aqui (ordem + âncora).
const ROTATION_RULES = {
    // Quarta, sexta e domingo em sequência
    oficial: {
        order: ['Maeme', 'Regiane', 'Arlete', 'Adriana', 'Ednice'],
        anchorDate: new Date(2026, 10, 8),   // 08/11/2026 = Regiane
        anchorIndex: 1,
        weekdays: [3, 5, 0]
    },
    // Todos os domingos em sequência
    jovens: {
        order: ['Helena', 'Lavinia', 'Gabriela'],
        anchorDate: new Date(2026, 0, 4),    // 04/01/2026 = Helena
        anchorIndex: 0
    },
    // Primeiro domingo de cada mês
    afinacao: {
        order: ['Gabriela', 'Regiane', 'Arlete', 'Adriana', 'Ednice', 'Maeme', 'Helena'],
        anchorYear: 2027,                    // JAN/2027 = Gabriela (DEZ/2026 foi Helena)
        anchorIndex: 0
    },
    // Fazem a meia hora no primeiro domingo do mês em que tocam Jovens
    meiaHora: ['Helena']
};

const FIXED_SCHEDULE_YEAR = 2026;
const WEEKDAY_LABELS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
const DAY_MS = 24 * 60 * 60 * 1000;

function formatScheduleItem(date) {
    return `${String(date.getDate()).padStart(2, '0')} ${WEEKDAY_LABELS[date.getDay()]}`;
}

function pushScheduleItem(target, organist, date) {
    const month = scheduleData.months[date.getMonth()];
    target[organist] = target[organist] || {};
    (target[organist][month] = target[organist][month] || []).push(formatScheduleItem(date));
}

function generateYearSchedule(year) {
    const oficial = {}, jovens = {}, meiaHora = {}, tuning = {};
    // Mantém a ordem das linhas na tela igual à ordem do rodízio
    ROTATION_RULES.jovens.order.forEach(o => { jovens[o] = {}; });

    // Oficial: percorre desde a âncora contando cada quarta/sexta/domingo
    const ofi = ROTATION_RULES.oficial;
    let slot = 0;
    for (let d = new Date(ofi.anchorDate); d.getFullYear() <= year; d.setDate(d.getDate() + 1)) {
        if (!ofi.weekdays.includes(d.getDay())) continue;
        if (d.getFullYear() === year) {
            pushScheduleItem(oficial, ofi.order[(ofi.anchorIndex + slot) % ofi.order.length], d);
        }
        slot++;
    }

    // Jovens: um domingo para cada, em sequência
    const jov = ROTATION_RULES.jovens;
    for (let d = new Date(year, 0, 1); d.getFullYear() === year; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 0) continue;
        const weeks = Math.round((d - jov.anchorDate) / (7 * DAY_MS));
        pushScheduleItem(jovens, jov.order[(jov.anchorIndex + weeks) % jov.order.length], d);
    }

    // Meia hora: primeiro domingo de Jovens de cada mês
    ROTATION_RULES.meiaHora.forEach(organist => {
        Object.entries(jovens[organist] || {}).forEach(([month, items]) => {
            meiaHora[organist] = meiaHora[organist] || {};
            meiaHora[organist][month] = [items[0]];
        });
    });

    // Afinação: primeiro domingo de cada mês
    const afi = ROTATION_RULES.afinacao;
    scheduleData.months.forEach((month, m) => {
        const firstSunday = new Date(year, m, 1);
        while (firstSunday.getDay() !== 0) firstSunday.setDate(firstSunday.getDate() + 1);
        const monthsSince = (year - afi.anchorYear) * 12 + m;
        const n = afi.order.length;
        tuning[month] = {
            day: firstSunday.getDate(),
            organist: afi.order[(((afi.anchorIndex + monthsSince) % n) + n) % n],
            weekday: 0
        };
    });

    return { tuning, oficial, meiaHora, jovens };
}


// 2026 = dados fixos acima; demais anos = gerados pelas regras (com cache)
const fixedSchedule = {
    tuning: scheduleData.tuning,
    oficial: scheduleData.oficial,
    meiaHora: scheduleData.meiaHora,
    jovens: scheduleData.jovens
};
const generatedSchedules = {};

function getScheduleForYear(year) {
    if (year <= FIXED_SCHEDULE_YEAR) return fixedSchedule;
    return generatedSchedules[year] || (generatedSchedules[year] = generateYearSchedule(year));
}

// ===== Lembretes (usados pelo app e pelo servidor de push no Netlify) =====

// Retorna TODOS os eventos da organista em uma data (uma organista pode ter jovens + meia-hora no mesmo domingo)
function getAllOrganistSchedules(organist, date) {
    const events = [];
    if (date.getFullYear() < FIXED_SCHEDULE_YEAR) return events;

    const schedule = getScheduleForYear(date.getFullYear());
    const monthName = scheduleData.months[date.getMonth()];
    const day = date.getDate();
    const weekday = date.getDay();
    const matchDay = item => {
        const match = item.match(/^(\d{1,2})\s+(\w{3})$/);
        return match && parseInt(match[1]) === day && scheduleData.weekdayMap[match[2]] === weekday ? match : null;
    };

    const tuningInfo = schedule.tuning[monthName];
    if (tuningInfo && weekday === tuningInfo.weekday && day === tuningInfo.day) {
        if (tuningInfo.organist === organist) {
            events.push({ type: 'afinacao', time: '16:00', description: 'Afinação e Ensaio' });
        } else {
            events.push({ type: 'ensaio-geral', time: '16:00', description: 'Ensaio do Jardim Guarani' });
        }
    }

    for (const item of schedule.oficial[organist]?.[monthName] || []) {
        const match = matchDay(item);
        if (match) {
            const time = match[2] === 'DOM' ? '18:30' : '19:30';
            events.push({ type: 'oficial', time, description: `Culto ${match[2] === 'DOM' ? 'Dominical' : 'de Oração'}` });
        }
    }

    for (const item of schedule.meiaHora[organist]?.[monthName] || []) {
        if (matchDay(item)) events.push({ type: 'meia-hora', time: '18:00', description: 'Culto Meia Hora' });
    }

    for (const item of schedule.jovens[organist]?.[monthName] || []) {
        if (matchDay(item)) events.push({ type: 'jovens', time: '10:00', description: 'Reunião de Jovens e Menores' });
    }

    return events;
}

// Horários fixos de notificação por tipo de culto
const ALERT_SCHEDULE = {
    'afinacao':      ['12:00', '14:00'],
    'ensaio-geral':  ['12:00', '14:00'],
    'oficial-dom':   ['12:00', '16:00'],   // culto dominical 18:30
    'oficial-semana':['12:00', '17:30'],   // quarta/sexta 19:30
    'meia-hora':     ['12:00', '16:00'],
    'jovens-mesmo':  ['08:30'],            // mesmo dia (domingo manhã)
    'jovens-vespera':['21:00']             // sábado anterior
};

function getAlertKey(schedule) {
    if (schedule.type === 'oficial') return schedule.time === '18:30' ? 'oficial-dom' : 'oficial-semana';
    if (schedule.type === 'jovens') return 'jovens-mesmo';
    return schedule.type;
}

function hhmmNow(date) {
    return `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
}

function buildNotificationMessage(schedule, organist) {
    switch (schedule.type) {
        case 'afinacao':
            return ['🎵 Jardim Guarani', 'Hoje é ensaio do Jardim Guarani e você fará a afinação! 😊🙏'];
        case 'ensaio-geral':
            return ['🎵 Jardim Guarani', 'Hoje é ensaio do Jardim Guarani! 😊🙏'];
        case 'oficial':
            return [`🎹 Lembrete: ${organist}`, 'Hoje você é a organista que vai tocar no culto!!! 😊🙏'];
        case 'meia-hora':
            return [`🎹 Lembrete: ${organist}`, 'Hoje você fará a meia hora do culto! 😊🙏'];
        case 'jovens':
            return [`🎹 Lembrete: ${organist}`, 'Hoje você é a organista que vai tocar na reunião de jovens! 😊🙏'];
        default:
            return [`🎹 Lembrete: ${organist}`, `Hoje você tem ${schedule.description} às ${schedule.time}.`];
    }
}

// Lembretes que já venceram em `now` e ainda não estão em `sent`.
// Não exige o minuto exato: um alerta atrasado ainda sai até o compromisso começar,
// e só o mais recente de cada compromisso (keys = todos os horários que ele cobre).
function computeDueNotifications(organist, now, sent) {
    const due = [];
    const currentHHMM = hhmmNow(now);
    const todayKey = now.toDateString();

    for (const event of getAllOrganistSchedules(organist, now)) {
        if (currentHHMM >= event.time) continue; // compromisso já começou

        const dueTimes = (ALERT_SCHEDULE[getAlertKey(event)] || []).filter(t => currentHHMM >= t);
        if (!dueTimes.length) continue;

        const keyFor = t => `${organist}_${todayKey}_${event.type}_${t}`;
        if (sent.has(keyFor(dueTimes[dueTimes.length - 1]))) continue;

        const [title, body] = buildNotificationMessage(event, organist);
        due.push({ keys: dueTimes.map(keyFor), title, body });
    }

    // Sábado a partir das 21:00 → alerta de véspera para jovens do domingo seguinte
    if (now.getDay() === 6 && currentHHMM >= ALERT_SCHEDULE['jovens-vespera'][0]) {
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        if (getAllOrganistSchedules(organist, tomorrow).some(e => e.type === 'jovens')) {
            const key = `${organist}_${tomorrow.toDateString()}_jovens_vespera`;
            if (!sent.has(key)) {
                due.push({
                    keys: [key],
                    title: `🎹 Lembrete: ${organist}`,
                    body: 'Amanhã você é a organista que vai tocar na reunião de jovens! 😊🙏'
                });
            }
        }
    }

    return due;
}

// Todas as organistas conhecidas (validação no servidor)
function getAllOrganists() {
    return [...new Set([
        ...Object.keys(scheduleData.oficial),
        ...Object.keys(scheduleData.meiaHora),
        ...Object.keys(scheduleData.jovens),
        ...ROTATION_RULES.oficial.order,
        ...ROTATION_RULES.jovens.order,
        ...ROTATION_RULES.afinacao.order
    ])];
}

// No navegador este arquivo é um <script> comum (tudo vira global);
// no Netlify é importado pelas funções de push.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        scheduleData,
        ROTATION_RULES,
        getScheduleForYear,
        getAllOrganistSchedules,
        computeDueNotifications,
        getAllOrganists
    };
}
