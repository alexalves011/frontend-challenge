# Decisões de arquitetura

Registro do que foi escolhido de propósito — e o que isso evita.

## 1. Cálculos financeiros só na API

Subtotal, desconto, taxa de rede e total **não** são derivados no cliente. A UI renderiza o que o `GET /cart` e o `POST /quote` devolvem.

**Por quê.** ETH é string decimal (não `number`). Somar no browser duplica regra, diverge do cupom e ignora taxa por rede. A cotação é um snapshot congelado; se o catálogo muda, o servidor responde `409 QUOTE_STALE` com a cotação nova em `details.quote`. A UI mostra o diff e pede outra confirmação. O cliente nunca “corrige” o total sozinho.

## 2. Zod como contrato único

Os schemas em `src/schemas` alimentam:

- parse da resposta nos **services**
- `zodResolver` nos **formulários** (React Hook Form)
- `parseBody` nos **handlers MSW**
- `validateSearch` das rotas

**Por quê.** Um campo a mais ou um endereço `0x` inválido quebra no mesmo lugar para UI e mock. Erros de API com `fields` são mapeados para o input (`applyApiFieldErrors`). Não há um segundo tipo “de tela” paralelo ao contrato.

## 3. Merge de carrinho no login

Visitante persiste itens sob `X-Guest-Cart` (`kurio:guest-cart`). No login, `POST /cart/merge` incorpora esse carrinho ao usuário e o id de visitante é descartado.

**Por quê.** Refresh não pode perder o carrinho anônimo. Autenticar não pode substituir o carrinho da conta nem deixar dois estados. A mescla é regra de servidor (quantidade, edição, estoque), não `concat` no React.

## 4. Idempotency-Key nos pedidos

`usePlaceOrder` grava a tentativa em `localStorage` (`kurio:pending-order:<userId>`) **antes** do POST:

1. Gera `crypto.randomUUID()` por `quoteId`
2. Persiste `{ quoteId, idempotencyKey, orderId, input }`
3. Envia o header `Idempotency-Key`
4. Clique de novo, timeout ou refresh **reusa a mesma chave e o mesmo body**

No mock: mesma chave + mesmo body → o mesmo pedido. Mesma chave + body diferente → `409 IDEMPOTENCY_CONFLICT`. Timeout de rede no cliente não cria duplicata: o servidor pode já ter o pedido; o retry recupera.

`QUOTE_STALE` limpa a tentativa (a cotação morreu). Pedido confirmado/recusado também.

## 5. UX otimista só onde o rollback é barato

Favoritos atualizam o cache na `onMutate` e revertem na `onError`. Carrinho e checkout **não** são otimistas: estoque e preço são do servidor; um heart no lugar errado é recuperável, um total errado não.

## 6. Socket.IO depois do MSW, token na query

`socket.io-client` entra via `import()` depois de `worker.start()`. `forceNew: true`, só WebSocket, token na **query**. Ver [ARCHITECTURE.md](ARCHITECTURE.md).

Sem isso o handshake fura o Service Worker (WebSocket nativo capturado cedo) ou o binding do MSW ignora o `auth` do engine.io.

## 7. Estado do catálogo na URL

Busca, coleção, rede, preço, ordenação e página vivem no `search` (Zod). Share, refresh e histórico funcionam sem um store global. Mudar filtro zera a página. Respostas fora de ordem: o Query descarta o resultado velho pela chave da busca atual; o mock `out-of-order` existe para provar isso.

## 8. Perfil: um único Salvar

Dados, avatar e senha no mesmo submit. Senha só é validada e enviada se algum dos três campos foi preenchido. Dois `Promise.allSettled` (PATCH perfil + POST senha); erros de API caem no campo correspondente.

**Por quê.** O layout tem um botão. Dois formulários mentiriam o desenho e criariam dois estados de “salvo”.

## 9. DevPanel como FAB, não como chrome da aplicação

O painel de cenários é um Floating Action Button, isolado do layout Figma, falando só com `window.__appSimulation`. A UI de produto não ramifica em `if (scenario === ...)`. Avaliador e Playwright exercitam o mesmo “servidor”.
