# Backend

API do Abyssal construída com FastAPI, SQLAlchemy e PostgreSQL.

## Estado atual

O backend hoje expõe três áreas principais:

- autenticação e perfil em `/api/auth`;
- catálogo de filiais e cardápio em `/api/branches` e `/api/menu`;
- reservas e pedidos em `/api/reservations` e `/api/orders`.

Além disso, a API publica `/health`, `/docs` e `/openapi.json`, executa seed inicial no bootstrap e usa JWT Bearer nas rotas protegidas.

## Execução local

Os scripts do pacote são:

- `npm run build` e `npm run build:dev` para instalar as dependências Python declaradas em `requirements.txt`;
- `npm run dev` para subir a API com reload em `http://localhost:3334`;
- `npm run start` para subir sem reload;
- `npm run test` para executar a suíte com `pytest`.

Se quiser isolar as dependências, crie um virtualenv em `packages/backend/.venv`. Os scripts detectam esse ambiente automaticamente em macOS, Linux e Windows.

## Configuração

As variáveis mais importantes são:

- `DATABASE_URL`;
- `JWT_SECRET`;
- `ENCRYPTION_KEY`;
- `APP_SEED_ENABLED`;
- `APP_SEED_ADMIN_NAME`;
- `APP_SEED_ADMIN_EMAIL`;
- `APP_SEED_ADMIN_PASSWORD`;
- `CORS_ALLOWED_ORIGINS`;
- `CORS_ALLOW_LOCALHOST`;
- `REQUIRE_HTTPS_IN_PRODUCTION`.

O backend normaliza URLs do PostgreSQL para `postgresql+psycopg://` quando necessário. Em desenvolvimento, a API fica presa em `127.0.0.1:3334` e o CORS aceita origens locais do Expo web enquanto `CORS_ALLOW_LOCALHOST=true`.

## Smoke test

```bash
curl http://localhost:3334/health
```

## Swagger/OpenAPI

- Swagger: `http://localhost:3334/docs`
- OpenAPI: `http://localhost:3334/openapi.json`

## Segurança

- PII sensível é criptografada em repouso com AES-256-GCM.
- E-mails são indexados por hash SHA-256.
- Em produção, use `HTTPS`, defina `CORS_ALLOW_LOCALHOST=false` e restrinja `CORS_ALLOWED_ORIGINS` para a origem exata do frontend.
