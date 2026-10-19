#!/bin/sh
# Genera config.js y la configuración de Nginx a partir de variables de entorno al iniciar el contenedor.
set -e
export FEATURE_RECIBIR="${FEATURE_RECIBIR:-true}"
export GATEWAY_HOST="${GATEWAY_HOST:-api-gateway}"
envsubst '${FEATURE_RECIBIR}' < /usr/share/nginx/html/config.js.template > /usr/share/nginx/html/config.js
envsubst '${GATEWAY_HOST}' < /etc/nginx/templates-fiadoya/default.conf > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
