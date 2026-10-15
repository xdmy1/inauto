#!/usr/bin/env bash
# Deploy to the VPS: ship the source, build it in a fresh folder next to the
# live one, then swap and restart (a few seconds of downtime, not the build).
# Traffic reaches 127.0.0.1:3100 through the Cloudflare Tunnel.
# Server layout: /opt/inauto/{app,next,app.prev,shared/.env,shared/uploads}
set -euo pipefail
HOST=root@168.231.127.48
D=/opt/inauto
cd "$(dirname "$0")/.."

echo "→ upload"
tar czf - \
  --exclude=./node_modules --exclude=./.next --exclude=./.git --exclude=./.env \
  --exclude=./.vercel --exclude=./research --exclude=./uploads \
  --exclude=./CLAUDE.md --exclude=./AGENTS.md --exclude=./SKILL.md \
  --exclude=./prompt.md --exclude=./.claude --exclude=./tsconfig.tsbuildinfo . \
  | ssh "$HOST" "rm -rf $D/next && mkdir -p $D/next && tar xzf - -C $D/next \
      && ln -sfn $D/shared/.env $D/next/.env && ln -sfn $D/shared/uploads $D/next/uploads \
      && chown -R inauto:inauto $D/next"

echo "→ build"
ssh "$HOST" "cd $D/next && sudo -u inauto -H bash -c 'npm ci --no-audit --no-fund --loglevel=error && npm run build'"

echo "→ swap + restart"
ssh "$HOST" "set -e; cd $D; cp next/deploy/*.service next/deploy/*.timer /etc/systemd/system/
  systemctl daemon-reload
  rm -rf app.prev; [ -d app ] && mv app app.prev; mv next app
  systemctl enable -q --now inauto-import.timer; systemctl enable -q inauto; systemctl restart inauto
  for i in \$(seq 1 30); do curl -fs -o /dev/null http://127.0.0.1:3100/robots.txt && break; sleep 1; done
  echo \"home: \$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: www.inauto.md' http://127.0.0.1:3100/)\""
