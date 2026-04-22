# Abyssal App Monorepo

Monorepo com backend Spring Boot em microservicos, gateway Nginx com TLS e app mobile React Native + Expo.

## Visao Geral

- `packages/backend`: `identity-service`, `catalog-service`, `operations-service`, `nginx` e `postgres`.
- `packages/mobile`: app Expo com autenticacao, menu, detalhes de prato, reservas, pedidos, endereco principal e perfil.

## Fluxos Principais

- autenticacao de usuario;
- home com filiais e destaques;
- menu com categorias;
- detalhes do prato;
- reserva presencial;
- delivery com carrinho e endereco por CEP;
- endereco principal no perfil;
- historico de reservas e pedidos.

## Requisitos

- Node.js 20+
- Java 21
- Maven 3.9+
- Docker e Docker Compose

## Configuracao

Copie os arquivos de ambiente que pertencem ao estado atual da aplicacao:

```bash
cp packages/backend/.env.example packages/backend/.env
cp packages/mobile/.env.example packages/mobile/.env
```

O gateway local do backend expoe TLS em `https://localhost:3333`. No modo web, o app normaliza URLs locais de desenvolvimento para esse gateway HTTPS automaticamente.

## Como Rodar

Instale as dependencias na raiz:

```bash
npm install
```

Suba backend + app mobile no fluxo padrao:

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

Os detalhes do backend, da configuracao de seguranca e do gateway estao em [packages/backend/README.md](packages/backend/README.md).

## Seguranca

- PII sensivel fica criptografada em repouso.
- O gateway encerra TLS no Nginx.
- CORS e o bypass de URL local ficam ativos apenas em modo dev.
- Em producao, mantenha `REQUIRE_HTTPS_IN_PRODUCTION=true` e restrinja `CORS_ALLOWED_ORIGIN`.
