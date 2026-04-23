#!/usr/bin/env bash
# Deploy do barbearia-sistema seguindo o padrão IAContável
# (registry local + Docker Swarm via EasyPanel).
# Roda no SERVIDOR via SSH, não localmente.
set -euo pipefail

PROJETO="barbearia-sistema"
IMAGEM="barbearia-sistema"
SERVICE="dev-manager-01_barbearia-sistema"
PROJETO_PATH="/etc/easypanel/projects/dev-manager-01/${PROJETO}"

cd "${PROJETO_PATH}"

echo "==> Build da imagem"
docker build -t "${IMAGEM}:latest" .

echo "==> Tag para registry local"
docker tag "${IMAGEM}:latest" "localhost:5000/${IMAGEM}:latest"

echo "==> Push para localhost:5000"
docker push "localhost:5000/${IMAGEM}:latest"

echo "==> Atualizando service"
docker service update --image "localhost:5000/${IMAGEM}:latest" "${SERVICE}" --force

echo "==> Deploy concluído"
docker service ps "${SERVICE}" --no-trunc | head -10
