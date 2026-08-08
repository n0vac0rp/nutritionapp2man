# GluGuide VPS Deployment & Operations

How to host the full stack (Next.js app, FastAPI model service, Postgres, Caddy) on a regular VPS behind automatic HTTPS for `gluguide.com`.

## Architecture

```
Internet ── 80/443 ──► caddy (Caddy v2, auto Let's Encrypt TLS)
                        │
                        └──► next-app:3000     (Next.js 15, web + API)
                              │
                              └──► model-service:3002  (FastAPI + PyTorch, internal only)
                              └──► postgres:5432       (PostgreSQL 16, internal only)
```

- Only `caddy` publishes host ports. `next-app` and `model-service` talk over the internal Docker network.
- Images are built in CI, pushed to GitHub Container Registry (GHCR), and pulled on the VPS — no builds on the server.
- `MODEL_SERVICE_URL` is `http://model-service:3002` (internal). The model service is never exposed publicly.
- A one-shot `migrate` service (image `next-app-migrate`) runs `prisma migrate deploy` + idempotent seed before `next-app` starts. `next-app` waits for it via `depends_on: service_completed_successfully`.

## Files

| File | Purpose |
|---|---|
| `docker-compose.yml` | Single production stack: caddy, postgres, migrate, model-service, next-app |
| `Caddyfile` | Reverse proxy + TLS, templated with `{$DOMAIN}` from `.env` |
| `.github/workflows/deploy.yml` | CI: build & push images to GHCR, SSH deploy to VPS |
| `scripts/backup-db.sh` | `pg_dump` backup with retention (cron) |

---

## 1. Provision the VPS

Requirements:
- Ubuntu 22.04 or 24.04
- **≥ 4 GB RAM recommended** (model service spikes during inference; 2 GB works but is tight)
- ≥ 20 GB disk (images + Postgres volume)
- A public IP

Install Docker + Compose v2:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"
```

Log out and back in (so `docker` works without sudo), then verify:

```bash
docker --version && docker compose version
```

## 2. Harden the server

```bash
sudo apt update && sudo apt upgrade -y

# Firewall: SSH + web traffic only
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Ensure only SSH-key auth
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl reload sshd
```

## 3. Deploy directory + environment

```bash
git clone https://github.com/Wolext4/nutritionapp2man.git ~/gluguide && cd ~/gluguide
```

Create `.env` (never commit this — it is gitignored):

```bash
cp .env.example .env
nano .env
```

Set at minimum:

```env
POSTGRES_PASSWORD=<generate a strong random password>
JWT_SECRET=<64 random characters>
```

Generate values:

```bash
openssl rand -base64 48   # POSTGRES_PASSWORD
openssl rand -hex 64      # JWT_SECRET
```

Optional overrides used by the compose file: `POSTGRES_USER` (default `gluguide_user`), `POSTGRES_DB` (default `gluguide`), `JWT_EXPIRES_IN` (default `7d`), `IMAGE_TAG` (default `latest`; CI passes the git SHA).

## 4. Allow the VPS to pull images from GHCR

```bash
echo <READ_ONLY_GITHUB_TOKEN> | docker login ghcr.io -u <github-username> --password-stdin
```

Use a token with `read:packages` scope (or reuse the CI token for simplicity). It must match the owner of the image path: `ghcr.io/wolext4/nutritionapp2man/...`.

## 5. First start

```bash
docker compose -f docker-compose.yml up -d
```

- `next-app` waits for `postgres` and `model-service` health checks, then runs migrations + seed automatically.
- Check progress: `docker compose -f docker-compose.yml logs -f next-app`
- Caddy will fetch TLS certs for `gluguide.com` — this only succeeds once DNS resolves to this server.

## 6. DNS

Create two `A` records at your domain registrar, both pointing to the VPS public IP:

| Name | Type | Value |
|---|---|---|
| `gluguide.com` | A | `<VPS_IP>` |
| `www` | A | `<VPS_IP>` |

TTL can stay at default. Caddy auto-upgrades HTTP → HTTPS and `www` → apex.

## 7. GitHub Actions (automated deploys)

Repository secrets — Settings → Secrets and variables → Actions → New repository secret:

| Secret | Value |
|---|---|
| `GHCR_TOKEN` | GitHub token with `write:packages` (classic PAT or fine-grained, scope: the `Wolext4` repo, Packages: Write) |
| `VPS_HOST` | VPS public IP or hostname |
| `VPS_USER` | SSH user (e.g. `ubuntu` or `root`) |
| `VPS_SSH_KEY` | Private SSH key the CI can use to log into the VPS |

Flow on every push to `main` (or manual `workflow_dispatch`):

1. Build `next-app` + `next-app-migrate` + `model-service` images
2. Push to `ghcr.io/wolext4/nutritionapp2man/{next-app,next-app-migrate,model-service}` tagged `git-SHA` and `latest`
3. `scp` `docker-compose.yml` + `Caddyfile` to `~/gluguide` on the VPS
4. `docker compose pull` + `up -d`, prune stale images

The SSH user in `VPS_SSH_KEY` must be able to run `docker` without `sudo` (i.e., be in the `docker` group).

## 8. Backups

`scripts/backup-db.sh` dumps Postgres through the running compose service, compresses it, and prunes backups older than 14 days.

Wire into cron (from the repo directory):

```bash
crontab -e
```

```cron
0 3 * * * cd /root/gluguide && ./scripts/backup-db.sh >> /var/log/gluguide-backup.log 2>&1
```

Adjust with environment variables: `BACKUP_DIR` (default `/var/backups/gluguide`), `RETENTION_DAYS` (default 14), `POSTGRES_USER`, `POSTGRES_DB`.

**Strongly recommended:** copy backups off the VPS (rsync to another machine / object storage), e.g. append to the cron job:

```bash
rsync -az /var/backups/gluguide/ user@offsite:/backups/gluguide/
```

### Restore

```bash
gunzip < /var/backups/gluguide/gluguide-YYYY-MM-DD-HHMMSS.sql.gz | \
  docker compose -f docker-compose.yml exec -T postgres \
  psql -U gluguide_user -d gluguide
```

## 9. Updating

Normal deploys are handled by the workflow. Manual deploy from the server:

```bash
cd ~/gluguide
git pull
docker compose -f docker-compose.yml pull
IMAGE_TAG=latest docker compose -f docker-compose.yml up -d
```

## 10. Common operations

```bash
# Logs
docker compose -f docker-compose.yml logs -f next-app
docker compose -f docker-compose.yml logs -f model-service
docker compose -f docker-compose.yml logs -f caddy

# Shell into the DB
docker compose -f docker-compose.yml exec postgres psql -U gluguide_user -d gluguide

# Run migrations manually
docker compose -f docker-compose.yml exec next-app npx prisma migrate deploy

# Reseed
docker compose -f docker-compose.yml exec next-app npx prisma db seed

# Restart the stack
docker compose -f docker-compose.yml restart

# Stop everything
docker compose -f docker-compose.yml down
```

## 11. Troubleshooting

**`required variable X is missing a value`** — the `.env` is missing a var. Add it and re-run `up -d`.

**Caddy shows no cert / HTTP only** — DNS doesn't resolve to this server, or ports 80/443 are blocked by the firewall/cloud security group. Verify with `dig gluguide.com` and `curl -I http://gluguide.com` (must return a Caddy response).

**Model predictions time out (504/502)** — model image may still be cold-loading (start_period is 60s). Check `docker compose ... logs -f model-service`; CPU-only PyTorch loads the 16 MB weights at startup.

**Container keeps restarting** — check `docker compose ... ps` and the logs; the entrypoint fails fast if Postgres is unreachable or migrations error.

**Stale images piling up** — `docker image prune -f` is already run by CI; manually: `docker system prune -af` (this also drops build cache).

## 12. Moving off Render checklist

- [ ] VPS provisioned, hardened, Docker installed
- [ ] `.env` created with strong `POSTGRES_PASSWORD` + `JWT_SECRET`
- [ ] DNS `A` records for `gluguide.com` + `www` → VPS IP
- [ ] VPS `docker login` to GHCR (read token)
- [ ] First `docker compose up -d` — site live, TLS issued
- [ ] GitHub secrets set; push to `main` triggers a deploy
- [ ] Cron backup installed + verified (and off-site copy if possible)
- [ ] Old Render services decommissioned; `render.yaml` removed (already done in this repo)
