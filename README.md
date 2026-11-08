# Kurio NFT Marketplace

Marketplace de NFTs para colecionadores: descobrir, cotar e comprar com carteira simulada — **sem blockchain real**, com um backend inteiro rodando no navegador.

O cliente trata a API como autoridade. Preços, taxas, cupons e totais nunca são recalculados na UI. Pedidos usam `Idempotency-Key`. Eventos de preço e pagamento chegam por Socket.IO, com deduplicação e rejeição de versões obsoletas.

[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![MSW](https://img.shields.io/badge/MSW-FF6A33?style=for-the-badge&logo=testinglibrary&logoColor=white)](https://mswjs.io)
[![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev)
[![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white)](https://react-hook-form.com)
[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev)

Também no núcleo: **TanStack Router**, **TanStack Query**, **Axios**, **Socket.IO**, **shadcn/ui** e **Vite**.

---

## Engenharia em evidência

| Problema | Solução |
| --- | --- |
| Favoritar não pode esperar a rede | **UX otimista** com rollback: o coração muda na hora; se a mutation falha, o cache volta e o toast avisa |
| Clique repetido, timeout ou refresh no pagamento | **Idempotência no checkout**: a tentativa é persistida *antes* do `POST /orders`, com a mesma `Idempotency-Key` |
| Preço ou estoque mudam enquanto o usuário navega | **Sincronização real-time** via Socket.IO (MSW): `nft.updated` / `order.updated`, dedupe por `eventId`, rejeição por `version` |
| Avaliar falhas sem um backend de staging | **DevPanel (FAB)** no canto inferior direito, ligado a `window.__appSimulation` — inflação, sold-out, drop de socket, sessão e snapshot |

Fluxo de dados, ponta a ponta:

```
rotas → componentes → hooks (Query) → services (schema.parse) → api/client → MSW
```

O mock é **server-authoritative**: o cliente envia intenções; o servidor simulado calcula preços, taxas e totais. ETH trafega como string decimal.

Documentação de aprofundamento: [Arquitetura](docs/ARCHITECTURE.md) · [Decisões](docs/DECISIONS.md) · [Limitações conhecidas](docs/KNOWN_ISSUES.md)

---

## O que a aplicação cobre

- **Catálogo** — busca, filtros combináveis na URL, ordenação, paginação, estados de loading/vazio/erro
- **Detalhe do NFT** — galeria, edição, quantidade limitada ao estoque, favoritos, compra
- **Carrinho** — quantidade, remoção, cupom (`KURIO10` / `EXPIRADO`), merge no login, totais só da API
- **Checkout** — formulário, carteira, cotação congelada, `QUOTE_STALE` com nova confirmação
- **Pedido** — pendente → confirmado ou recusado via push; recibo com snapshot
- **Conta** — login/cadastro, perfil (um único Salvar), carteiras principal e secundária
- **Desktop e mobile** — 1440 / 768 / 390

---

## Como rodar localmente

Requisito: **Node 22+**.

```bash
npm install
npx playwright install chromium   # só na primeira vez, para a suíte E2E
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173). O MSW sobe **antes** do React; não é preciso API externa.

| Conta | E-mail | Senha |
| --- | --- | --- |
| Alice (carteiras seed) | `alice@kurio.dev` | `Kurio@123` |
| Bob (sem carteiras) | `bob@kurio.dev` | `Kurio@123` |

Cupons: `KURIO10` (10%) e `EXPIRADO`.

### Console de simulação

Com os mocks ativos, o FAB no canto inferior direito abre o DevPanel. Dali dá para injetar inflação, forçar sold-out, derrubar o socket, invalidar a sessão ou restaurar o snapshot inicial. O mesmo contrato está em `window.__appSimulation` (Playwright usa essa API).

Cenários também entram na URL: `?scenario=offline`, `payment-rejected`, `order-timeout`, etc.

### Scripts

| Comando | Função |
| --- | --- |
| `npm run dev` | Vite + MSW |
| `npm run build` | Gera o route tree, typecheck e bundle |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | oxlint em `src/` |
| `npm test` | Vitest (domínio ETH / mock) |
| `npm run test:e2e` | Playwright nos viewports 390, 768 e 1440 |

Para desligar o mock (backend real): `VITE_ENABLE_MOCKS=false`.

---

## Testes

A suíte E2E cobre catálogo, auth, favoritos (otimista + rollback), carrinho, compra, falhas de pagamento, realtime e a11y/loading. Três projetos Playwright: **mobile 390**, **tablet 768**, **desktop 1440**.

As baselines visuais versionadas são `linux` e `darwin`. Em Windows, use `npm run test:e2e:docker` para comparar contra `*-linux.png`.

---

O layout segue o [Figma do desafio](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1). O enunciado original está em [`CHALLENGE.md`](CHALLENGE.md).
