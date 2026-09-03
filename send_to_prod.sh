#!/bin/bash
# Manual deploy; CI does the same on every merge to main. Needs VPS_HOST, VPS_PORT, VPS_USER (read from .env_prod).
set -eu
set -a; source .env_prod; set +a
make prod-build
docker save family_tree-backend family_tree-frontend | gzip | ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" 'gunzip | docker load'
rsync -rtlz --delete --filter='merge .rsync-filter' -e "ssh -p $VPS_PORT" ./ "$VPS_USER@$VPS_HOST:~/family_tree/"
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" 'cd ~/family_tree && make prod'
