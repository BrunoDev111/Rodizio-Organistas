// Lógica do push (cadastro de aparelhos + envio de lembretes), separada das funções
// do Netlify para poder ser testada localmente com um armazenamento em memória.
import { createHash } from 'node:crypto';
import webpush from 'web-push';
import schedule from '../../schedule.js';

export const STORE_NAME = 'push-subscriptions';
const KNOWN_ORGANISTS = new Set(schedule.getAllOrganists());
const MAX_SENT_KEYS = 100;
const TEST_COOLDOWN_MS = 30 * 1000;

const subscriptionId = endpoint => createHash('sha256').update(endpoint).digest('hex');

// Só aceita inscrições dos serviços de push reais (Chrome/Android, Apple, Firefox, Edge)
const PUSH_SERVICE_HOSTS = [
    /(^|\.)fcm\.googleapis\.com$/,
    /(^|\.)android\.googleapis\.com$/,
    /(^|\.)push\.apple\.com$/,
    /(^|\.)push\.services\.mozilla\.com$/,
    /(^|\.)notify\.windows\.com$/
];

function isPushServiceEndpoint(endpoint) {
    try {
        const url = new URL(endpoint);
        return url.protocol === 'https:' && PUSH_SERVICE_HOSTS.some(re => re.test(url.hostname));
    } catch (e) {
        return false;
    }
}

// Função de envio configurada com as chaves VAPID do Netlify (null se faltarem)
export function createPushSender(env = process.env) {
    const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, URL } = env;
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return null;
    webpush.setVapidDetails(VAPID_SUBJECT || URL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    return (subscription, payload) => webpush.sendNotification(subscription, payload, { TTL: 2 * 60 * 60 });
}

const json = (status, data) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
});

// Data cujos getters locais (getHours, getDate...) devolvem o horário de Brasília,
// mesmo com o servidor do Netlify rodando em UTC
export function nowInSaoPaulo(date = new Date()) {
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
        }).formatToParts(date).map(p => [p.type, p.value])
    );
    return new Date(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
}

// GET  → chave pública VAPID (o app precisa dela para se inscrever)
// POST { subscription, organist, sent } → cadastra/atualiza; organist = null descadastra
export async function handleSubscribe(req, store, publicKey) {
    if (req.method === 'GET') {
        if (!publicKey) return json(503, { error: 'VAPID_PUBLIC_KEY não configurada no Netlify' });
        return json(200, { publicKey });
    }
    if (req.method !== 'POST') return json(405, { error: 'Método não permitido' });

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return json(400, { error: 'JSON inválido' });
    }

    const subscription = body && body.subscription;
    if (!subscription || !isPushServiceEndpoint(subscription.endpoint) ||
        !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
        return json(400, { error: 'Inscrição inválida' });
    }

    const id = subscriptionId(subscription.endpoint);

    if (!body.organist) {
        await store.delete(id);
        return json(200, { ok: true, removed: true });
    }
    if (!KNOWN_ORGANISTS.has(body.organist)) return json(400, { error: 'Organista desconhecida' });

    const existing = await store.get(id, { type: 'json' });
    const sent = new Set(existing && existing.organist === body.organist ? existing.sent : []);
    (Array.isArray(body.sent) ? body.sent : [])
        .filter(k => typeof k === 'string' && k.startsWith(`${body.organist}_`))
        .forEach(k => sent.add(k));

    await store.setJSON(id, {
        subscription,
        organist: body.organist,
        sent: [...sent].slice(-MAX_SENT_KEYS),
        updatedAt: new Date().toISOString()
    });
    return json(200, { ok: true });
}

// POST { subscription } → notificação de teste para um aparelho já cadastrado.
// delayMs dá tempo de fechar o app e ver a notificação chegar "de fora".
export async function handleTest(req, store, send, delayMs = 0) {
    if (req.method !== 'POST') return json(405, { error: 'Método não permitido' });

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return json(400, { error: 'JSON inválido' });
    }

    const endpoint = body && body.subscription && body.subscription.endpoint;
    if (typeof endpoint !== 'string') return json(400, { error: 'Inscrição inválida' });

    // Só aparelhos cadastrados, e no máximo um teste a cada 30 s (evita uso indevido)
    const id = subscriptionId(endpoint);
    const entry = await store.get(id, { type: 'json' });
    if (!entry) return json(404, { error: 'Aparelho não cadastrado' });
    if (entry.lastTestAt && Date.now() - Date.parse(entry.lastTestAt) < TEST_COOLDOWN_MS) {
        return json(429, { error: 'Aguarde alguns segundos para testar de novo' });
    }
    await store.setJSON(id, { ...entry, lastTestAt: new Date().toISOString() });

    if (delayMs) await new Promise(r => setTimeout(r, delayMs));

    try {
        await send(entry.subscription, JSON.stringify({
            title: `🧪 Teste: ${entry.organist}`,
            body: 'Notificações funcionando! Os lembretes da escala vão chegar assim. 😊🙏'
        }));
    } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
            await store.delete(id);
            return json(410, { error: 'Inscrição expirada, escolha o nome de novo' });
        }
        console.error('Falha no teste de push:', err.statusCode || '', err.body || err.message);
        return json(502, { error: 'Falha ao enviar' });
    }
    return json(200, { ok: true });
}

// Manda os lembretes vencidos para cada aparelho cadastrado.
// send(subscription, payload) = webpush.sendNotification (injetado para teste)
export async function sendDueReminders(store, send, now = nowInSaoPaulo()) {
    const report = [];
    const { blobs } = await store.list();

    for (const { key } of blobs) {
        const entry = await store.get(key, { type: 'json' });
        if (!entry) continue;

        const sent = new Set(entry.sent || []);
        const due = schedule.computeDueNotifications(entry.organist, now, sent);
        if (!due.length) continue;

        let expired = false;
        for (const alert of due) {
            try {
                await send(entry.subscription, JSON.stringify({ title: alert.title, body: alert.body }));
                alert.keys.forEach(k => sent.add(k));
                report.push(`${entry.organist}: ${alert.body}`);
            } catch (err) {
                // 404/410 = aparelho desinstalou o app ou cancelou a permissão
                if (err.statusCode === 404 || err.statusCode === 410) {
                    expired = true;
                    break;
                }
                console.error(`Falha ao enviar para ${entry.organist}:`, err.statusCode || '', err.body || err.message);
            }
        }

        if (expired) {
            await store.delete(key);
            report.push(`${entry.organist}: inscrição expirada removida`);
        } else {
            await store.setJSON(key, { ...entry, sent: [...sent].slice(-MAX_SENT_KEYS) });
        }
    }
    return report;
}
