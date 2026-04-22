# Backend

Backend refeito em microsserviços Spring Boot com:

- `identity-service`: autenticação, perfil e endereço primário.
- `catalog-service`: filiais e cardápio.
- `operations-service`: reservas e pedidos.
- `nginx`: gateway reverso com HTTP em `http://localhost:3334` para desenvolvimento e TLS em `https://localhost:3333`.
- `postgres`: um cluster PostgreSQL com bancos isolados por serviço.

Por padrão, a publicação de portas usa `127.0.0.1` e o CORS do gateway aceita as origens locais `http://localhost:19006` e `http://127.0.0.1:19006`, além de qualquer porta local em `localhost` ou `127.0.0.1` enquanto `CORS_ALLOW_LOCALHOST=true`. Se precisar expor a stack para outra máquina ou para produção, defina `BIND_ADDRESS`, `CORS_ALLOWED_ORIGINS` e `CORS_ALLOW_LOCALHOST=false` com valores explicitamente seguros.

## Subir a stack

```bash
docker compose -f packages/backend/docker-compose.yml up --build
```

## Validar build Maven

```bash
mvn -f packages/backend/pom.xml test
```

## Smoke test do gateway HTTP

```bash
curl http://localhost:3334/health
```

Se quiser validar o TLS local diretamente, use:

```bash
curl -k https://localhost:3333/health
```

## Observações de segurança

- PII sensível fica criptografada em repouso com AES-256-GCM.
- Email é indexado por hash SHA-256 para evitar armazenamento em claro como chave de busca.
- O gateway local em 3334 evita problemas de certificado no navegador; o endpoint TLS em 3333 continua disponível para validações diretas.
- Antes de usar fora de ambiente local, troque `JWT_SECRET`, `ENCRYPTION_KEY`, `POSTGRES_PASSWORD`, `BIND_ADDRESS`, `CORS_ALLOWED_ORIGINS`, `CORS_ALLOW_LOCALHOST=false` e a senha do administrador inicial.
