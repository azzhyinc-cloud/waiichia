# WAIICHIA — Contexte pour nouvelle conversation

## Architecture
- VPS: Ubuntu 24.04, HestiaCP, Nginx (reverse proxy), IP: 84.201.14.212
- API: Fastify + PM2, port 3001, 17 routes (auth, tracks, profiles, payments, products, messages, social, upload, events, emissions, radio, karaoke, campaigns, admin, currency, albums, notifications)
- Frontend: React + Vite, lazy loading, Zustand stores, deployed to /home/admin/web/waiichia.com/public_html/
- DB: Supabase (35+ tables)
- DNS: Cloudflare (waiichia.com proxied, api.waiichia.com DNS-only)
- API URL: VITE_API_URL=https://api.waiichia.com

## Fichiers cles
- /opt/waiichia/apps/api/src/index.js
- /opt/waiichia/apps/api/src/routes/*.js (17 fichiers)
- /opt/waiichia/apps/api/src/utils/notify.js (notifs BDD + Web Push)
- /opt/waiichia/apps/web/src/services/api.js (API client)
- /opt/waiichia/apps/web/src/stores/index.js (useThemeStore, useAuthStore, usePlayerStore, usePageStore, useDeviseStore)
- /opt/waiichia/apps/web/src/hooks/usePrice.js (hook conversion devises)
- /opt/waiichia/apps/web/src/pages/*.jsx (23 pages)
- /opt/waiichia/apps/web/src/components/*.jsx (12 composants)
- /home/admin/web/waiichia.com/public_html/ (build prod)

## Ce qui fonctionne
- Auth JWT (login/register/me/logout/change-password)
- Player audio (play/pause/next/prev/seek/volume)
- Messagerie complete (texte, vocal, photo, reactions, edit, delete)
- Duet Studio (FFmpeg mix, selecteur sons, public/prive)
- Boutique (CRUD produits, achat via wallet)
- Admin (users, content, depots, verifications, profil requests)
- Upload (sons avec pricing)
- Events (CRUD + tickets)
- Radio (stream + tips)
- Follow/Unfollow (avec compteur + notification)
- Lazy loading + code splitting (280KB initial)
- Notifications reelles (BDD + Web Push, throttle anti-spam)
- Conversion devises (hook usePrice, 16 devises, cache 10min)
- Recherche globale (tracks + profiles + emissions + events, debounce 300ms)
- Albums (grille, detail tracklist, player, api.albums dans api.js)
- Playlists API (routes dans albums.js, api.playlists dans api.js)
- Dashboard KPIs reels (wallet, stats, trending, transactions)
- Currency API (rates + convert, 16 devises africaines)

## Hook usePrice
- Fichier: /opt/waiichia/apps/web/src/hooks/usePrice.js
- Usage: const { format } = usePrice()
- format(5000) => "10.20 USD" ou "5 000 KMF" selon devise du store
- Cache taux 10min, fallback KMF si taux indisponible
- Utilise dans: Shop.jsx, Music.jsx, Events.jsx, Albums.jsx

## Bugs corriges (session 25 juin 2026)
- wallet() dans api.js => corrige vers /api/payments/wallet/balance
- buyTicket() => corrige vers /api/payments/ticket
- Recherche globale: click track/emission/event => corrige
- Albums.jsx: migre vers api.albums

## Roadmap restante
### P2
- Wallet retrait/transfert UI (routes API existent: /withdraw, /transfer)
- Playlists page (API existe, api.playlists dans api.js)
- Profile onglets (albums, events)
- Partage social (ShareModal existe, a brancher)

### P3
- Player expanded + queue visible
- Upload multi-type (album, emission, media)
- Boutique livraison + partage chat
- Factures PDF
- Admin finance + moderation avancee

### P4
- Lyrics sync karaoke
- Mode hors-ligne
- Rapports fiscaux
- Feed events
