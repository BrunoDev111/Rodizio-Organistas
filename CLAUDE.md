# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

PWA (Progressive Web App) de escala de rodízio de organistas da Igreja Jardim Guarani, do ano atual (2026 fixo, 2027+ gerado). Front sem frameworks nem build — HTML, CSS e JS vanilla — implantado no Netlify, com duas Netlify Functions para lembretes por push.

## Como rodar localmente

Não há build. Basta servir os arquivos estáticos:

```
npx serve .
# ou
python -m http.server 8080
```

Abrir diretamente como `file://` não é recomendado porque o Service Worker requer HTTPS ou `localhost`. Localmente as funções de push não existem (o app tenta, recebe 404 e segue só com avisos de app aberto).

## Arquitetura

Escala e regras dos lembretes ficam em [schedule.js](schedule.js), carregado antes de [script.js](script.js) no navegador e importado pelas funções do Netlify (exporta via `module.exports` quando existe). A escala de **2026** fica hardcoded no objeto `scheduleData`. De **2027 em diante** é gerada por `generateYearSchedule()` a partir de `ROTATION_RULES` (ordem de cada rodízio + data/índice âncora). Quando entrar ou sair organista, ajustar `ROTATION_RULES` (nova âncora = primeira data da nova ordem). `getScheduleForYear(ano)` devolve os dados fixos ou gerados; `loadScheduleYear(ano)` (script.js) copia o ano exibido para `scheduleData`. O app abre no ano atual do sistema.

**Fluxo de dados → DOM:**
1. `scheduleData` → funções `build*Grid()` → criam elementos DOM com `data-*` attributes
2. `updateHighlights()` lê os `data-*` attributes dos itens já renderizados e aplica classes CSS (`today`, `organist-today`) com base na data atual do sistema
3. `getAllOrganistSchedules()` / `computeDueNotifications()` (schedule.js) calculam os lembretes de qualquer data — usados pelo app e pelo servidor
4. `focusNearestDate()` centraliza a data mais próxima; `playTodayTour()` passa 1.5s em cada item de hoje ao abrir

**Dois conjuntos de grids são construídos:** um para a aba "Escala Geral" (sufixo `Geral`) e um para as abas individuais (sem sufixo). Ambos chamam as mesmas funções `build*Grid()`.

**Organistas e tipos de culto:**
- Afinação/Ensaio: primeiro domingo de cada mês desde JUL/2026 (JAN–JUN/2026 era sábado). Sequência em 2026: Gabriela → Arlete → Adriana → Ednice → Maeme → Helena
- Rodízio Oficial: Arlete, Adriana, Ednice, Maeme, Regiane (quarta, sexta, domingo). Organista nova entra na fila logo antes da mais antiga (Arlete). Desde 08/11/2026: Maeme → Regiane → Arlete → Adriana → Ednice. Na Afinação vale a mesma regra: a partir de 2027, Gabriela → Regiane → Arlete → …
- Meia Hora: Helena (primeiro domingo dela em Jovens). Lavinia saiu em 30/06/2026
- Jovens/Menores: Helena → Lavinia → Gabriela, um domingo cada

## Deploy

O site `organistas-guarani` (https://organistas-guarani.netlify.app) **não está ligado ao GitHub**: `git push` só guarda o código. Publicar = `npx netlify-cli deploy --prod --dir . --functions netlify/functions` (pasta já linkada em `.netlify/`, sempre com permissão do usuário). A configuração em [netlify.toml](netlify.toml) define os headers de cache e Content-Type para `sw.js` e `manifest.json`.

## Service Worker e cache

O cache é versionado pela constante `CACHE_NAME` em [sw.js](sw.js). Ao modificar assets, atualizar a versão em: `CACHE_NAME` em `sw.js`, os `?v=` do CSS, do `schedule.js` e do `script.js` em `index.html`, e os mesmos `?v=` no array `urlsToCache` em `sw.js` (o Netlify cacheia `*.js` por 1 ano). Ícones PNG ficam em `icons/`.

## Regra de execução

Sempre pedir autorização antes de executar comandos (rodar servidor local, instalar pacotes, etc.) ou tomar qualquer ação — mesmo que pareça óbvio que o próximo passo é testar algo. Nunca iniciar a execução em paralelo com a explicação do que vai ser feito; explicar primeiro e esperar confirmação.

**Push só com permissão explícita:** nunca fazer `git push` (que faz deploy automático no Netlify) nem implementar notificações Web Push sem o usuário autorizar naquele momento.

## Debug no console

Dois helpers globais estão disponíveis no console do navegador:

```js
testDate(dia, mes)                              // simula outra data por 10 segundos (inclui o tour "quem toca hoje")
testNotifications()                             // mostra uma notificação de teste (no app + sistema, se autorizado)
testCloseToCulto(dia, mes, hora, minuto)        // simula um horário: dispara o alerta mais recente de ALERT_SCHEDULE já vencido, se o compromisso ainda não começou
```

## Notificações

Dois caminhos, com os mesmos horários (`ALERT_SCHEDULE` em schedule.js, horário de Brasília):

- **Locais (app aberto):** `checkScheduledNotifications()` roda ao abrir, ao voltar para o app e a cada minuto; alertas atrasados saem na abertura. Enviados ficam em `localStorage.notifiedEvents`.
- **Push (app fechado):** ao escolher o nome, `syncPushSubscription()` inscreve o aparelho e cadastra em [netlify/functions/push-subscribe.mjs](netlify/functions/push-subscribe.mjs) (Netlify Blobs, store `push-subscriptions`). [push-send-reminders.mjs](netlify/functions/push-send-reminders.mjs) é uma scheduled function (a cada 15 min) que manda os lembretes vencidos; o [sw.js](sw.js) mostra a notificação. Lógica em [netlify/lib/push.mjs](netlify/lib/push.mjs) (testável sem Netlify). O botão "Testar notificação" do seletor (visível só com push ativo) chama [push-test.mjs](netlify/functions/push-test.mjs), que manda um push ~5 s depois (só para aparelho cadastrado, 1 a cada 30 s). Com push ativo (`localStorage.pushOrganist`), o app mostra só o aviso interno para não duplicar.
- **Configuração no Netlify:** variáveis de ambiente `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` (gerar com `npx web-push generate-vapid-keys`); `VAPID_SUBJECT` opcional (padrão: URL do site). Scheduled functions só rodam no deploy de produção. iPhone só recebe push com o app instalado na tela inicial (iOS 16.4+).
