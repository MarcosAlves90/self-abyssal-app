#!/bin/sh
set -eu

CERT_DIR="/etc/nginx/certs"
CERT_FILE="$CERT_DIR/dev.crt"
KEY_FILE="$CERT_DIR/dev.key"

mkdir -p "$CERT_DIR"

if [ ! -s "$CERT_FILE" ] || [ ! -s "$KEY_FILE" ]; then
  # Dev-only certificate so local HTTPS is enabled by default.
  openssl req \
    -x509 \
    -nodes \
    -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -days 365 \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
fi

allowed_origins="${CORS_ALLOWED_ORIGINS:-http://localhost:19006,http://127.0.0.1:19006}"
allow_localhost="${CORS_ALLOW_LOCALHOST:-true}"

{
  printf 'map $http_origin $cors_allowed_origin {\n'
  printf '  default "";\n'

  if [ "$allow_localhost" = "true" ]; then
    printf '  ~^http://(localhost|127\\.0\\.0\\.1)(:[0-9]+)?$ $http_origin;\n'
  fi

  old_ifs="$IFS"
  IFS=,
  for origin in $allowed_origins; do
    origin=$(printf '%s' "$origin" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')

    if [ -n "$origin" ]; then
      printf '  "%s" $http_origin;\n' "$origin"
    fi
  done
  IFS="$old_ifs"

  printf '}\n'
} > /etc/nginx/conf.d/00-cors-map.conf

cp /etc/nginx/templates/default.conf.template /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
