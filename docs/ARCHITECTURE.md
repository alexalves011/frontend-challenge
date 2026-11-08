# Arquitetura

Kurio é um SPA. Não há servidor de aplicação próprio: o **MSW** intercepta HTTP e WebSocket no Service Worker e se comporta como o backend. O restante da stack (Router, Query, Axios, Zod) trata essa API como se fosse remota.

## Topologia do frontend

```
┌─────────────────────────────────────────────────────────────┐
│  TanStack Router (file-based)                               │
│  rotas públicas · layout _auth (guard) · search Zod         │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Componentes  (UI, RHF + zodResolver, shadcn/ui)            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Hooks        Query / Mutation · queryKeys · sessão         │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Services     Axios + schema.parse() na borda               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  api/client   Bearer · X-Guest-Cart · ApiError              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  MSW  handlers REST  +  @mswjs/socket.io-binding            │
│  db em localStorage (kurio:db)  ·  cenários  ·  DevPanel    │
└─────────────────────────────────────────────────────────────┘
```

Regras desta topologia:

- **Rotas** orquestram. Não falam com Axios.
- **Hooks** são a única porta do TanStack Query. Chaves em `query-keys.ts`.
- **Services** fazem o parse Zod da resposta. Payload inválido falha visível, não “passa quieto”.
- **Schemas** (`src/schemas`) são a fonte única do contrato. UI, RHF e MSW importam os mesmos objetos.
- O mock **não** escreve no cache do React Query. Ele muda o `db` e, quando cabe, emite Socket.IO. A UI reage pelo hook de realtime ou por invalidação REST.

## Backend in-browser (MSW)

`src/main.tsx` sobe os mocks **antes** de renderizar o app. Sem isso, a primeira tela dispararia `fetch` contra a rede real.

```
bootstrap()
  → startMocks()          // worker.start(), cenários, DevPanel
  → import('./app')       // só então o React monta
```

O worker registra os handlers REST e o `socketHandler`. Persistência: `localStorage` na chave `kurio:db` (seed determinística). Resetar o snapshot (DevPanel) limpa as chaves `kurio:*`.

Cenários (`?scenario=` + `kurio:scenario`) injetam latência, 503, offline, timeout de pedido, pagamento recusado, etc. O cliente **não** ramifica UI por cenário: ele só consome status HTTP e eventos. Quem decide é o mock.

`VITE_ENABLE_MOCKS=false` desliga o worker para um backend real, sem mudar services.

## Service Worker + Socket.IO simulado

Dois problemas de ordem de carregamento:

1. **engine.io-client captura `globalThis.WebSocket` na avaliação do módulo.** Se o `socket.io-client` entrar no bundle inicial, ele segura a implementação nativa e o MSW não intercepta o handshake.
2. **O patch do MSW só existe depois de `worker.start()`.**

Por isso o cliente Socket.IO é importado **sob demanda** em `src/realtime/socket.ts`, depois dos mocks:

- `forceNew: true` — um Manager novo por sessão (a query do token não pode reaproveitar a conexão anônima)
- `transports: ['websocket']` — o binding do MSW não cobre long-polling
- **token na query**, não em `auth` — restrição do `@mswjs/socket.io-binding`

O hook `useRealtimeSync` (raiz da árvore) conecta o socket ao cache:

| Evento | Efeito |
| --- | --- |
| `nft.updated` | Atualiza o NFT, invalida listagens, avisa se o item está no carrinho |
| `order.updated` | Atualiza o pedido, limpa a tentativa persistida, toast de confirmado/recusado |
| `connect` | Reconcilia REST dos recursos cuja data no cache é anterior à conexão |

Deduplicação: `eventId` já visto é ignorado. **Versão**: evento com `version` ≤ a já aplicada é descartado (não regride preço). Troca de usuário destroi o socket anterior.

O mock envia ping periódico. `window.__appSimulation` (DevPanel / Playwright) altera o `db` e emite pelos mesmos canais — nunca “seta” estado na UI.

## Roteamento e sessão

TanStack Router file-based. `validateSearch` com Zod. O layout `/_auth` chama `ensureQueryData` da sessão e redireciona para `/login?redirect=` se não houver usuário.

Token em `localStorage` (`kurio:token`), enviado como `Bearer`. Visitante identifica o carrinho com `X-Guest-Cart`. 401 com token dispara `sessionEvents` e a UI limpa dados privados.

## Tempo real vs REST

O socket **não** substitui o REST. Ele notifica. A fonte de verdade continua sendo GET/POST. Na reconexão, Query invalida o que ficou velho. Pedido pendente também sobrevive a refresh: o mock agenda a resolução no `db` e o cliente recupera por `GET /orders/:id` + `order.updated`.
