# Limitações conhecidas

Comportamentos esperados de rede, concorrência e do ciclo de vida do MSW. Não são regressões da UI: são restrições do modelo “backend no Service Worker”.

## Cache de navegação (bfcache) e o MSW

### O que o avaliador vai ver

No recibo confirmado há o link **Ver no Etherscan (simulado)**. Ele abre `etherscan.io` numa navegação completa. Ao voltar com o botão Voltar do navegador, a rota pode mostrar **“Não foi possível carregar”** (pedido, catálogo ou carrinho), em vez da tela que estava aberta.

### Por que isso acontece

O Kurio intercepta `/api/*` e o WebSocket com um **Service Worker do MSW**, iniciado em `bootstrap()` *antes* do React.

Navegadores (Chrome em especial) guardam a página anterior no **back-forward cache (bfcache)** ao sair para um origin externo. Na volta:

1. O documento é restaurado da memória (JS, React, TanStack Query) **sem** rodar `main.tsx` de novo.
2. O Service Worker que fazia de backend **não está necessariamente ativo** nesse freeze/restore — o interceptador foi desregistrado ou a página restaurada não está controlada pelo worker.
3. O próximo `refetch` (focus, reconnect, `useQuery`) vai para a rede real. Não existe API Kurio lá → Axios devolve `NETWORK` / HTTP de falha.
4. Os componentes de domínio renderizam `ErrorState` com o título **Não foi possível carregar**.

Isso **não** apaga o `localStorage` (`kurio:db`, token, pedido). O snapshot do mock continua no disco. Só a interceptação HTTP que faltou naquele instante.

Não há correção correta no app sem desligar o bfcache (`unload` listeners, `Cache-Control: no-store` em toda navegação) — o que piora LCP e é o oposto do que o desafio pede em performance. Tratar o 404 de `/api` com um “fake success” esconderia falhas reais de rede.

### Como recuperar

- Clicar em **Tentar novamente** no `ErrorState`. O refetch costuma coincidir com o worker já recontrolando a página; se o MSW voltou, a query resolve.
- Se ainda falhar: **reload** (`F5` / puxar para atualizar). `bootstrap()` roda de novo, `worker.start()` reativa os handlers, o app lê o `kurio:db` e a sessão.

Depois disso, o pedido confirmado, o carrinho vazio e o perfil reaparecem iguais a antes do Etherscan.

### Como reproduzir de propósito

1. Compre um NFT até o recibo.
2. Abra **Ver no Etherscan (simulado)**.
3. Volte pelo histórico do navegador (não pelo in-app).
4. Se o Chrome restaurou via bfcache, a tela de erro aparece. Use **Tentar novamente** ou recarregue.

Em alguns navegadores / com a aba em primeiro plano o worker sobrevive e o bug não dispara. É intermitente por definição do bfcache — não de uma race da cotação.

---

## Outros comportamentos esperados

### Concorrência de preço e estoque

`nft.updated` no checkout em revisão **invalida a cotação**. Confirmar com cotação velha (socket perdido) devolve `409 QUOTE_STALE`. A UI bloqueia a compra até nova confirmação. Não é erro de rede: é o servidor recusando snapshot obsoleto.

Eventos duplicados (`eventId`) ou com `version` antiga **não regridem** o preço. O DevPanel tem “Redeliver Último Evento” e “Emitir Evento Stale” para isso.

### Timeout versus pedido criado

No cenário `order-timeout` o mock atrasa a resposta do `POST /orders`. O Axios estoura (8 s), a UI entra em estado incerto, **mas o pedido já existe no `db`**. “Tentar novamente” reenvia a mesma `Idempotency-Key` e devolve o mesmo `ord_*`. Não crie outro POST “limpo” — duplicaria.

### Pagamento recusado

`payment-rejected`: o pedido nasce, o push `order.updated` marca `rejected`, o carrinho **permanece**. Confirmado é o único status que remove itens.

### Visual Playwright em Windows

As baselines versionadas são `*-linux.png` e `*-darwin.png`. Rodar `npm run test:e2e` no Windows procura `*-win32.png` e falha. Use `npm run test:e2e:docker` (imagem `playwright:v1.64.1-noble`) ou CI Linux.

### DevPanel e produção com mocks

O FAB só monta se `window.__appSimulation` existe (mocks ligados). Com `VITE_ENABLE_MOCKS=false` o painel some. Não é um controle de produto; é harness de avaliação.
