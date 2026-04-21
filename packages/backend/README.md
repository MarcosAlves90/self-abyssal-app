# Backend

Backend refeito em microservicos Spring Boot com:

- `identity-service`: autenticacao, perfil e endereco primario.
- `catalog-service`: filiais e cardapio.
- `operations-service`: reservas e pedidos.
- `nginx`: gateway reverso com TLS em `https://localhost:3333`.
- `postgres`: um cluster PostgreSQL com bancos isolados por servico.

## Subir a stack

```bash
docker compose -f packages/backend/docker-compose.yml up --build
```

## Validar build Maven

```bash
mvn -f packages/backend/pom.xml test
```

## Smoke test do gateway

```bash
curl -k https://localhost:3333/health
```

## Observacoes de seguranca

- PII sensivel fica criptografada em repouso com AES-256-GCM.
- Email e indexado por hash SHA-256 para evitar armazenamento em claro como chave de busca.
- O gateway termina TLS no Nginx e os servicos exigem contexto HTTPS encaminhado pelo proxy.
- Antes de usar fora de ambiente local, troque `JWT_SECRET`, `ENCRYPTION_KEY`, `POSTGRES_PASSWORD`, `CORS_ALLOWED_ORIGIN` e a senha do administrador seeded.
