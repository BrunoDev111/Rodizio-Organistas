// Notificação de teste (botão "Testar notificação" no seletor de organista).
// Chega ~5 s depois, para dar tempo de fechar o app e ver ela chegando.
import { getStore } from '@netlify/blobs';
import { STORE_NAME, createPushSender, handleTest } from '../lib/push.mjs';

export default async (req) => {
    const send = createPushSender();
    if (!send) {
        return new Response(JSON.stringify({ error: 'VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY não configuradas no Netlify' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    return handleTest(req, getStore(STORE_NAME), send, 5000);
};
