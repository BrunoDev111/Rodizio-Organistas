// Cadastro dos aparelhos que recebem lembretes por push
// GET /.netlify/functions/push-subscribe  → chave pública
// POST /.netlify/functions/push-subscribe → cadastra/descadastra
import { getStore } from '@netlify/blobs';
import { STORE_NAME, handleSubscribe } from '../lib/push.mjs';

export default async (req) => handleSubscribe(req, getStore(STORE_NAME), process.env.VAPID_PUBLIC_KEY);
