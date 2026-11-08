# Kurio NFT Marketplace

[![Deploy na Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel&logoColor=white)](https://frontend-challenge-umber-delta.vercel.app/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![MSW](https://img.shields.io/badge/MSW-FF6A33?style=for-the-badge&logo=testinglibrary&logoColor=white)](https://mswjs.io)
[![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev)
[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev)

Marketplace de NFTs em React + TypeScript desenvolvido como solução para o **desafio técnico da Jungle Gaming**. O projeto simula um ecossistema completo de criptoativos e colecionadores — **sem blockchain real**, contando com um backend robusto rodando inteiramente no navegador via MSW (Mock Service Worker).

👉 **[Acesse a aplicação em produção na Vercel](https://frontend-challenge-umber-delta.vercel.app/)**

> Layout fiel ao Figma do desafio. O escopo original está detalhado em [`CHALLENGE.md`](./CHALLENGE.md).

---

## 📋 Requisitos Atendidos

A aplicação cobre 100% dos fluxos exigidos no desafio, garantindo robustez de dados e excelente experiência de usuário:

- **Catálogo Dinâmico** — Busca, filtros combináveis na URL, ordenação e paginação, com estados de loading, vazio e tratamento de erro.
- **Detalhes do NFT** — Galeria interativa, controle de quantidade baseado em estoque real, favoritos e ações de compra.
- **Carrinho Inteligente** — Gestão de itens, aplicação de cupons de desconto (`KURIO10` / `EXPIRADO`), merge automático no login e cálculos centralizados estritamente na API.
- **Checkout com Idempotência** — Formulário, seleção de carteira, cotação congelada e tratamento para estados de cotação expirada (`QUOTE_STALE`).
- **Gestão de Pedidos** — Acompanhamento de status (pendente, confirmado, recusado) via push em tempo real e recibos detalhados com snapshot.
- **Área do Usuário** — Fluxo de autenticação (login/cadastro), perfil de usuário e gerenciamento de carteiras principal e secundária.
- **Responsividade Completa** — Layout adaptado para múltiplos viewports (Desktop 1440px, Tablet 768px e Mobile 390px).

---

## ⚙️ Engenharia em Evidência

O cliente trata a API como autoridade absoluta. Preços, taxas, cupons e totais nunca são recalculados na UI.

| Desafio Arquitetural | Solução Implementada |
| --- | --- |
| **Favoritar sem latência** | **UX otimista** com rollback: o ícone muda imediatamente; se a mutação falha na rede, o cache é revertido e um toast notifica o usuário. |
| **Prevenção de cobrança duplicada** | **Idempotência no checkout**: a tentativa de pagamento é persistida antes do `POST /orders`, garantindo a mesma `Idempotency-Key`. |
| **Concorrência e tempo real** | **Sincronização via Socket.IO (MSW)**: eventos `nft.updated` e `order.updated` com deduplicação por `eventId` e rejeição de versões obsoletas. |
| **Testes de cenários de borda** | **DevPanel (FAB)**: botão flutuante no canto inferior direito ligado a `window.__appSimulation` para injetar inflação, sold-out, drop de socket e falhas. |

---

## 🚀 Como Rodar Localmente

**Requisito prévio:** Node.js 22+.

```bash
# Clone o repositório e acesse a pasta
git clone https://github.com/alexalves011/frontend-challenge.git
cd frontend-challenge

# Instale as dependências
npm install

# Instale os binários do Playwright (apenas na primeira vez, para os testes E2E)
npx playwright install chromium

# Inicie o ambiente de desenvolvimento
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173) no navegador. O MSW intercepta as requisições antes do React iniciar; nenhuma API externa é necessária.

---

## 🔑 Contas de Acesso para Teste

| Usuário | E-mail | Senha | Observação |
| --- | --- | --- | --- |
| Alice | `alice@kurio.dev` | `Kurio@123` | Com carteiras seed |
| Bob | `bob@kurio.dev` | `Kurio@123` | Sem carteiras |

**Cupons de desconto:**

- `KURIO10` — 10% de desconto (válido)
- `EXPIRADO` — para testar o tratamento de cupom inválido

---

## 📚 Documentação Técnica

Para uma visão aprofundada das decisões de engenharia, arquitetura e limitações mapeadas, consulte a pasta [`docs/`](./docs):

- [`ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — Topologia do frontend, fluxo de dados ponta a ponta e papel do MSW.
- [`DECISIONS.md`](./docs/DECISIONS.md) — Decisões de design (ADRs), escolhas de bibliotecas e estratégias de validação com Zod.
- [`KNOWN_ISSUES.md`](./docs/KNOWN_ISSUES.md) — Comportamentos conhecidos de concorrência e detalhes sobre o ciclo de vida do navegador (como o bfcache).

---

## 🛠️ Scripts Disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor Vite com os mocks do MSW ativos |
| `npm run build` | Gera o route tree, faz typecheck e empacota o bundle de produção |
| `npm run typecheck` | Executa a verificação estática de tipos (`tsc -b`) |
| `npm run lint` | Roda o linter oxlint em `src/` |
| `npm test` | Executa os testes unitários com Vitest |
| `npm run test:e2e` | Roda a suíte E2E com Playwright (viewports 390, 768 e 1440) |

> **Nota:** para rodar a aplicação sem os mocks e conectar a um backend real, defina a variável `VITE_ENABLE_MOCKS=false`.

---

## ☁️ Deploy e Infraestrutura

O projeto está configurado para deploy contínuo integrado diretamente com a Vercel:

- **Configuração de rotas (`vercel.json`)** — Contém as regras de *rewrites* que direcionam todas as rotas (`/(.*)`) para o `index.html`, garantindo que o TanStack Router gerencie o histórico sem erros 404 ao atualizar a página.
- **Zero configuração de ambiente** — Como todo o banco de dados simulado roda via MSW no lado do cliente (`localStorage`), nenhuma variável de ambiente é necessária no painel da Vercel.
- **Integração contínua (CI)** — A pasta `.github/workflows/` contém pipelines automatizados para execução de typecheck, lint, build e testes E2E do Playwright.
