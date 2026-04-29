# Backend

Backend refeito em FastAPI + SQLAlchemy com:

- `api`: aplicação principal com autenticação, catálogo, reservas e pedidos.
- `postgres`: um cluster PostgreSQL com um banco dedicado para o backend.

Por padrão, a publicação de portas usa `127.0.0.1` e a API sobe diretamente em `http://localhost:3334`. O CORS da própria aplicação aceita as origens locais `http://localhost:19006` e `http://127.0.0.1:19006`, além de `localhost`/`127.0.0.1` em desenvolvimento enquanto `CORS_ALLOW_LOCALHOST=true`. Se precisar expor a stack para outra máquina ou para produção, defina `BIND_ADDRESS`, `API_PORT`, `CORS_ALLOWED_ORIGINS` e `CORS_ALLOW_LOCALHOST=false` com valores explicitamente seguros.

## Subir a stack

```bash
docker compose -f packages/backend/docker-compose.yml up --build
```

## Validar build Docker

```bash
docker compose -f packages/backend/docker-compose.yml build
```

## Executar testes

```bash
docker compose -f packages/backend/docker-compose.yml run --rm api pytest
```

## Smoke test da API

```bash
curl http://localhost:3334/health
```

## Swagger/OpenAPI

A documentação fica disponível diretamente na API:

- `http://localhost:3334/docs`

O JSON do OpenAPI fica em:

- `http://localhost:3334/openapi.json`

## Observações de segurança

- PII sensível fica criptografada em repouso com AES-256-GCM.
- Email é indexado por hash SHA-256 para evitar armazenamento em claro como chave de busca.
- Antes de usar fora de ambiente local, troque `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, `BIND_ADDRESS`, `API_PORT`, `CORS_ALLOWED_ORIGINS`, `CORS_ALLOW_LOCALHOST=false` e a senha do administrador inicial.
