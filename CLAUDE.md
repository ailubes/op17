# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm install` - Install dependencies
- `npm run dev` - Start dev server on http://localhost:3000
- `npm run build` - Build for production
- `npm run start` - Start production server

## Environment

Set `GEMINI_API_KEY` in `.env.local` for Gemini API access.

## Architecture

This is a Next.js (App Router) + React 19 + TypeScript personal website/landing page for Oleh Plotnytskyi (Ukrainian Thunder athlete branding).

**Project Structure:**
- `app/layout.tsx` - Root layout + global font links + metadata
- `app/page.tsx` - Home page (renders `App.tsx`)
- `app/shop/page.tsx` - Shop page (client component)
- `App.tsx` - Main home composition with scroll reveal animation logic (client)
- `components/` - Page sections (Navbar, Hero, About, CareerTimeline, Stats, Gallery, Videos, ShopPreview, TrophyBanner, Footer)

**Styling:**
- Tailwind CSS via PostCSS (`tailwind.config.cjs`, `postcss.config.cjs`)
- Global styles + custom utilities in `app/globals.css`
- Custom colors: `ukraine-blue`, `ukraine-dark`, `gold`, `slate-950`
- Custom fonts: Bebas Neue, Barlow Condensed, Inter
- Custom utility classes: `.clip-hero`, `.clip-tag`, `.clip-btn`, `.outline-text`, `.noise`

**Path Alias:**
- `@/*` maps to project root

## GitHub Actions Auto-Deploy (Server: 167.235.10.212)

This server uses a `deploy` user + GitHub Actions for zero-downtime deploys on push to `main`.

### How it works
1. Push to `main` → GitHub Actions SSHes into server as `deploy`
2. Pulls latest code, installs deps, runs DB migrations, builds, reloads PM2

### Workflow file (`.github/workflows/deploy.yml`)
```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            set -e
            cd /var/www/YOUR_APP
            git fetch origin main
            git reset --hard origin/main
            git clean -fd .next/
            npm install
            npx prisma migrate deploy
            npm run build
            sudo /usr/local/bin/pm2-reload-YOUR_APP
```

### GitHub Secrets required
| Secret | Value |
|---|---|
| `SSH_HOST` | `167.235.10.212` |
| `SSH_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | RSA private key from `/home/deploy/.ssh/github_actions_op17_rsa` |

### Server setup for a new project
1. **App directory** — must be owned by deploy: `chown -R deploy:deploy /var/www/YOUR_APP`
2. **GitHub SSH key** — deploy user uses `/home/deploy/.ssh/lubes_deploy` to fetch from GitHub
3. **PM2 wrapper** — create `/usr/local/bin/pm2-reload-YOUR_APP`:
   ```bash
   #!/bin/bash
   PM2_HOME=/tmp/.pm2 /usr/bin/pm2 reload YOUR_APP
   ```
   Then: `chmod +x /usr/local/bin/pm2-reload-YOUR_APP`
4. **Sudoers** — allow deploy to run the wrapper: `echo "deploy ALL=(root) NOPASSWD: /usr/local/bin/pm2-reload-YOUR_APP" >> /etc/sudoers.d/deploy`
5. **SSH key** — use RSA PEM format (not OpenSSH ed25519) for `appleboy/ssh-action` compatibility:
   `ssh-keygen -t rsa -b 4096 -f /home/deploy/.ssh/github_actions_KEY -N "" -m PEM`
   Then append `.pub` to `/home/deploy/.ssh/authorized_keys`
6. **known_hosts** — `ssh-keyscan github.com >> /home/deploy/.ssh/known_hosts`
7. **.env file** — must exist on server (not in git); `git reset --hard` will NOT delete it as long as it's in `.gitignore` and untracked
