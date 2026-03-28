# WAIICHIA — Contexte pour nouvelle conversation

## Architecture
- **VPS**: Ubuntu 24.04, HestiaCP, Nginx (reverse proxy), IP: 84.201.14.212
- **API**: Fastify + PM2, port 3001, 14 routes (auth, tracks, profiles, payments, products, messages, social, upload, events, emissions, radio, karaoke, campaigns, admin)
- **Frontend**: React + Vite, lazy loading, Zustand stores, deployed to /home/admin/web/waiichia.com/public_html/
- **DB**: Supabase (35+ tables)
- **DNS**: Cloudflare (waiichia.com proxied, api.waiichia.com DNS-only pour bypass Bot Fight Mode)
- **API URL**: VITE_API_URL=https://api.waiichia.com
- **Sous-domaine API**: api.waiichia.com → Nginx proxy → localhost:3001 (contourne Cloudflare Bot Fight Mode)

## Fichiers clés
- /opt/waiichia/apps/api/src/index.js (Fastify entry)
- /opt/waiichia/apps/api/src/config.js (Supabase + config)
- /opt/waiichia/apps/api/src/routes/*.js (14 fichiers)
- /opt/waiichia/apps/web/src/App.jsx (React entry + lazy loading + ErrorBoundary)
- /opt/waiichia/apps/web/src/services/api.js (API client)
- /opt/waiichia/apps/web/src/stores/index.js (Zustand: theme, auth, player, page, devise)
- /opt/waiichia/apps/web/src/pages/*.jsx (23 pages)
- /opt/waiichia/apps/web/src/components/*.jsx (12 composants)
- /opt/waiichia/deploy.sh (build + deploy script, keeps old assets 7 days)

## Prototype
- Fichier: waiichia-v7.html (12 680 lignes)
- Audit complet fait — voir waiichia-audit.md

## Ce qui fonctionne
- Auth JWT (login/register/me)
- Player audio (play/pause/next/prev/seek/volume)
- Messagerie complète (texte, vocal, photo, réactions, edit, delete)
- Duet Studio (FFmpeg mix, sélecteur sons, public/privé)
- Boutique (CRUD produits, achat via wallet)
- Admin (users, content, dépôts, vérifications, profil requests)
- Upload (sons avec pricing)
- Events (CRUD + tickets)
- Radio (stream + tips)
- Follow/Unfollow (avec compteur)
- Lazy loading + code splitting (280KB initial)
- Chunk ErrorBoundary (auto-reload)
- Notifications réelles (API, plus de mock)

## Bugs connus restants
- Wallet balance: route existe dans payments.js (/wallet/balance) mais frontend appelle aussi /api/wallet/balance depuis index.js (supprimée) — vérifier le chemin
- Duet Studio PC: double son (fonctionne sur mobile+écouteurs)
- Quelques pages peuvent être vides si pas de données en DB

## Roadmap restante (audit complet)
### P1
- Auto-création notifications (follow/comment/achat → notif)
- Conversion devises (table currency_rates existe)
- Recherche globale fonctionnelle

### P2
- Albums CRUD + page
- Playlists
- Wallet retrait/transfert UI (routes API ajoutées)
- Partage social (modal)
- Dashboard analytics (charts)

### P3
- Player expanded + queue visible
- Upload multi-type (album, émission, média)
- Profil onglets (albums, events)
- Boutique livraison + partage chat
- Factures PDF
- Admin finance + modération avancée

### P4
- Lyrics sync karaoké
- Mode hors-ligne
- Rapports fiscaux
- Feed events
