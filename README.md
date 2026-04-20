# Abyssal App Monorepo

Monorepo com backend `Node.js + Express + MongoDB` em arquitetura de monólito modular e app mobile `React Native + Expo` para a experiência `APP ABYSSAL - Seafood Experience`.

## Estrutura

```text
.
├── package.json
├── .env.example
├── packages
│   ├── backend
│   │   ├── docker-compose.yml
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src
│   │       ├── app.js
│   │       ├── server.js
│   │       ├── config/env.js
│   │       ├── database
│   │       │   ├── mongoose.js
│   │       │   ├── runSeed.js
│   │       │   └── seed.js
│   │       ├── middlewares
│   │       ├── modules
│   │       │   ├── auth
│   │       │   ├── branches
│   │       │   ├── menu
│   │       │   ├── orders
│   │       │   └── reservations
│   │       └── shared
│   └── mobile
│       ├── App.js
│       ├── index.js
│       ├── app.json
│       ├── package.json
│       └── src
│           ├── components
│           ├── context
│           ├── navigation
│           ├── screens
│           ├── services
│           └── theme
└── package-lock.json
```

## Backend

O backend foi separado por domínios independentes:

- `auth`: cadastro, login, JWT e recuperação do perfil autenticado.
- `branches`: CRUD de filiais e níveis de profundidade para reservas.
- `menu`: CRUD de pratos e bebidas com categorias e destaques.
- `reservations`: CRUD de reservas com vínculo ao usuário autenticado.
- `orders`: CRUD de pedidos de delivery/salão com snapshot dos itens.

Cada módulo contém `model`, `schema`, `service` e `routes`.

### Privacidade e segurança

- Senhas armazenadas com `bcrypt`.
- Dados pessoais sensíveis criptografados em repouso com `AES-256-GCM`.
- Nenhum dado bruto de cartão é persistido; apenas método de pagamento tokenizado/status.
- Logs evitam corpo das requisições.
- Em produção, a API rejeita tráfego sem `HTTPS`.

## Mobile

O app Expo cobre os fluxos centrais da Sprint 1:

- autenticação de usuário;
- home com destaques e filiais;
- menu com categorias;
- detalhes do prato;
- reserva presencial;
- delivery com carrinho e endereço preenchido por CEP;
- configuração posterior de endereço principal no perfil;
- perfil com histórico de reservas e pedidos.

O consumo da API usa obrigatoriamente `axios@1.15.1`.

## Variáveis de ambiente

Copie os exemplos:

```bash
cp .env.example .env
cp packages/backend/.env.example packages/backend/.env
cp packages/mobile/.env.example packages/mobile/.env
```

Valores esperados:

```env
# Root / backend helper
PORT=3333
MONGO_URI=mongodb://localhost:27017/abyssal_app
JWT_SECRET=replace-with-a-long-random-secret
ENCRYPTION_KEY=replace-with-64-hex-chars
AUTO_SEED=true
CORS_ORIGIN=*
TRUST_PROXY=false

# Mobile
EXPO_PUBLIC_API_BASE_URL=http://localhost:3333/api
```

Para dispositivo físico no Expo, ajuste `EXPO_PUBLIC_API_BASE_URL` com o IP da sua máquina na rede local.

Para ambientes atrás de proxy reverso, configure também `TRUST_PROXY` no backend com `true`, `1` ou outro valor aceito pelo Express.

## Como rodar

Instalar tudo na raiz:

```bash
npm install
```

Subir backend com Docker:

```bash
npm run dev:backend
```

Rodar backend local sem Docker:

```bash
npm run dev:backend:local
```

Rodar mobile:

```bash
npm run dev:mobile
```

Rodar backend Docker + mobile em paralelo:

```bash
npm run dev
```

Esse fluxo sobe o backend Docker, acompanha os logs da API no mesmo terminal e mantém o Expo com QR code e comandos interativos do Metro.

Ao pressionar `Ctrl+C`, o Expo é encerrado e os containers do `docker compose` tambem sao derrubados automaticamente.

Encerrar e limpar volumes do backend Docker:

```bash
npm run dev:backend:down
```

Popular catálogo e filiais manualmente:

```bash
npm run seed:backend
```

## Endpoints principais

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/branches
POST   /api/branches
PATCH  /api/branches/:id
DELETE /api/branches/:id

GET    /api/menu
POST   /api/menu
PATCH  /api/menu/:id
DELETE /api/menu/:id

GET    /api/reservations
POST   /api/reservations
PATCH  /api/reservations/:id
DELETE /api/reservations/:id

GET    /api/orders
POST   /api/orders
PATCH  /api/orders/:id
DELETE /api/orders/:id
```

## Verificações executadas

- `node -e "require('./packages/backend/src/app').createApp(); console.log('backend-app-ok')"`
- `docker compose -f packages/backend/docker-compose.yml config`
- `docker compose -f packages/backend/docker-compose.yml up --build -d`
- smoke test real na API Dockerizada com sucesso: `auth`, `branches`, `menu`, `reservations` e `orders`
- `npx expo-doctor`
- `npx expo export --platform android --output-dir .expo-export-test`
