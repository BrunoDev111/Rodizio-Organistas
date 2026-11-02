// Roda sozinha a cada 15 minutos e manda os lembretes que venceram
// (mesmos horários de ALERT_SCHEDULE em schedule.js, no horário de Brasília)
import { getStore } from '@netlify/blobs';
import { STORE_NAME, createPushSender, sendDueReminders } from '../lib/push.mjs';

export const config = { schedule: '*/15 * * * *' };

export default async () => {
    const send = createPushSender();
    if (!send) {
        console.error('VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY não configuradas no Netlify');
        return;
    }

    const report = await sendDueReminders(getStore(STORE_NAME), send);
    console.log(report.length ? report.join('\n') : 'Nenhum lembrete agora');
};
