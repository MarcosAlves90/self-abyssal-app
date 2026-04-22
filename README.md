# Abyssal App Monorepo

Monorepo com backend Spring Boot em microsserviços, gateway Nginx com TLS e app mobile React Native + Expo.

## Visão Geral

- `packages/backend`: `identity-service`, `catalog-service`, `operations-service`, `nginx` e `postgres`.
- `packages/mobile`: app Expo com autenticação, menu, detalhes de prato, reservas, pedidos, endereço principal e perfil.

## Fluxos Principais

- autenticação de usuário;
- home com filiais e destaques;
- menu com categorias;
- detalhes do prato;
- reserva presencial;
- delivery com carrinho e endereço por CEP;
- endereço principal no perfil;
- histórico de reservas e pedidos.

## Requisitos

- Node.js 20+
- Java 21
- Maven 3.9+
- Docker e Docker Compose

## Configuração

Copie os arquivos de ambiente que pertencem ao estado atual da aplicação:

```bash
cp packages/backend/.env.example packages/backend/.env
cp packages/mobile/.env.example packages/mobile/.env
```

O gateway local do backend expõe TLS em `https://localhost:3333`. No modo web, o app normaliza URLs locais de desenvolvimento para esse gateway HTTPS automaticamente.

Se estiver testando em Android ou iOS físico, ajuste `EXPO_PUBLIC_API_BASE_URL` para um host alcançável no seu ambiente.

## Como Rodar

Instale as dependências na raiz:

```bash
npm install
```

Suba backend + app mobile no fluxo padrão:

```bash
npm run dev
```

Rode o app no navegador:

```bash
npm run dev:web
```

Rode apenas o backend em Docker:

```bash
npm run dev:backend
```

Rode o backend em background:

```bash
npm run dev:backend:detached
```

Pare a stack e remova os volumes do backend:

```bash
npm run dev:backend:down
```

Rode apenas o app mobile:

```bash
npm run dev:mobile
```

Rode apenas o app mobile em modo web:

```bash
npm run dev:mobile:web
```

Build e testes do backend:

```bash
npm run build:backend
npm run test:backend
```

## Backend

Os detalhes do backend, da configuração de segurança e do gateway estão em [packages/backend/README.md](packages/backend/README.md).

## Segurança

- PII sensível fica criptografada em repouso.
- O gateway encerra TLS no Nginx.
- CORS e o bypass de URL local ficam ativos apenas em modo dev.
- Em produção, mantenha `REQUIRE_HTTPS_IN_PRODUCTION=true` e restrinja `CORS_ALLOWED_ORIGIN`.
