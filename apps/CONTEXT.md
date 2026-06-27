# WAIICHIA — Contexte pour nouvelle conversation
## Architecture
- VPS: Ubuntu 24.04, HestiaCP, Nginx (reverse proxy), IP: 84.201.14.212
- API: Fastify + PM2, port 3001, 17 routes (auth, tracks, profiles, payments, products, messages, social, upload, events, emissions, radio, karaoke, campaigns, admin, currency, albums, notifications)
- Frontend: React + Vite, lazy loading, Zustand stores, déployé vers /home/admin/web/waiichia.com/public_html/
- DB: Supabase (35+ tables)
- DNS: Cloudflare (waiichia.com proxied, api.waiichia.com DNS-only)
- API URL: VITE_API_URL=https://api.waiichia.com

## DÉPLOIEMENT — RÈGLE ABSOLUE
- `npm run deploy` depuis /opt/waiichia/apps/web (build + copie vers public_html)
- JAMAIS `npm run build` seul en prod

## Fichiers clés
- /opt/waiichia/apps/api/src/index.js
- /opt/waiichia/apps/api/src/routes/*.js (17 fichiers)
- /opt/waiichia/apps/api/src/utils/notify.js (notifs BDD + Web Push)
- /opt/waiichia/apps/web/src/services/api.js (API client)
- /opt/waiichia/apps/web/src/stores/index.js (useThemeStore, useAuthStore, usePlayerStore, usePageStore, useDeviseStore)
- /opt/waiichia/apps/web/src/hooks/usePrice.js (hook conversion devises)
- /opt/waiichia/apps/web/src/pages/*.jsx (27 pages dont Reports.jsx, Explore.jsx)
- /opt/waiichia/apps/web/src/components/*.jsx (13 composants dont CommentSection.jsx)
- /home/admin/web/waiichia.com/public_html/ (build prod)
- /opt/waiichia/apps/RULES.md (règles de travail)
- /opt/waiichia/apps/ARCHITECTURE.md (état du code)
- /opt/waiichia/apps/CHANGELOG.md (suivi modifications)

## Ce qui fonctionne
- Auth JWT (login/register/me/logout/change-password)
- Player audio (play/pause/next/prev/seek/volume)
- Messagerie complète (texte, vocal, photo, reactions, edit, delete)
- Duet Studio (FFmpeg mix, sélecteur sons, public/privé)
- Boutique (CRUD produits, achat via wallet)
- Admin (users, content, dépôts, vérifications, profil requests, finances, signalements avancés)
- Upload (sons avec pricing)
- Events (CRUD + tickets)
- Radio (stream + tips)
- Follow/Unfollow (avec compteur + notification)
- Lazy loading + code splitting (280KB initial)
- Notifications réelles (BDD + Web Push, throttle anti-spam)
- Conversion devises (hook usePrice, 16 devises, cache 10min)
- Recherche globale (tracks + profiles + emissions + events, debounce 300ms)
- Albums (grille, detail tracklist drawer, player, api.albums dans api.js)
- Playlists (page complète, drawer tracklist, delete, search, filtre)
- Dashboard KPIs réels (wallet, stats, trending, transactions)
- Currency API (rates + convert, 16 devises africaines)
- Wallet (recharge Mvola/Cash/Bank, transfert avec confirmation, retrait, factures PDF)
- Profile (onglets Albums+Events avec drawer, tab scroll mobile)
- ErrorBoundary anti-boucle (waiichia_chunk_reload, affiche erreur réelle)
- Lyrics sync karaoke (LRC, affichage temps réel, éditeur créateur/admin)
- Mode hors-ligne (SW v5, Cache First assets, Network First API, fallback offline.html)
- Rapports fiscaux (Reports.jsx, KPIs, graphique, export PDF, filtre période)
- Feed events (TabEvents dans Feed.jsx avec ReactionBar)
- Admin finance (KPIs revenus/dépenses/commissions, graphique par type, tableau transactions)
- Admin modération avancée (filtres signalements par sévérité et type de contenu)
- Gestion retraits admin (GET/PATCH /admin/withdrawals, débit wallet à l'approve, notif user)
- Page Explorer (trending tracks, artistes à découvrir, events, filtre genres)
- CommentSection.jsx composant réutilisable (liste, réponses, suppression)

## Hook usePrice
- Fichier: /opt/waiichia/apps/web/src/hooks/usePrice.js
- Usage: const { format } = usePrice()
- format(5000) => "10.20 USD" ou "5 000 KMF" selon devise du store
- Cache taux 10min, fallback KMF si taux indisponible
- Pages qui l'utilisent: Music.jsx, Events.jsx, Shop.jsx, Albums.jsx

## api.js — namespaces existants (NE PAS SUPPRIMER)
api.tracks, api.profiles, api.payments, api.events, api.products,
api.messages, api.currency, api.albums (+ .playlists imbriqué),
api.emissions, api.radio, api.notifications, api.campaigns
+ api.get(), api.post(), api.patch(), api.delete() directs

## Lyrics sync karaoke
- DB : colonne `lyrics_lrc TEXT` dans table `karaoke_tracks`
- API : PATCH /karaoke/tracks/:id/lyrics (créateur ou admin), GET /karaoke/tracks/:id/lyrics
- Format : LRC standard [mm:ss.xx]Texte
- Front : parseLRC() côté client, LyricsDisplay (scroll + highlight temps réel), LyricsEditor (créateur/admin uniquement)

## Service Worker
- Fichier : /opt/waiichia/apps/web/public/sw.js
- Version : waiichia-v5 (+ waiichia-static-v5, waiichia-api-v5)
- Cache First : assets JS/CSS/fonts/images
- Network First + fallback cache : pages HTML, appels API clés
- pruneApiCache() : nettoyage auto entrées API > 10min
- Message handlers : SKIP_WAITING, CLEAR_API_CACHE
- NE PAS modifier sauf changement stratégie cache ou notifs push

## Reports.jsx
- Route : setPage('reports')
- Périodes : ce mois / trimestre / année / custom
- KPIs : revenus, dépenses, net, nb opérations
- Graphique barres revenus vs dépenses par mois
- Export PDF lazy-load jspdf (même système que Wallet)

## Bugs corrigés (session 25 juin 2026)
- deploy manquant → npm run deploy ajouté dans package.json
- api.albums manquait dans api.js → réajouté
- usePrice manquait dans Music.jsx et Events.jsx → ajouté
- ErrorBoundary boucle infinie → fix compteur sessionStorage
- Wallet isIncome transfert → fix recipient_id
- Profile tab double-fetch → fix useRef loaded

## Bugs corrigés (session 25 juin 2026 — suite)
- playlist_tracks count : colonne id inexistante → track_id (API)
- AddToPlaylistModal : compteur local incrémenté après ajout
- albums.js : tracks_count mis à jour en BDD après POST tracks

## Roadmap
### P2 ✅ TERMINÉ
### P3 ✅ TERMINÉ
### P4 ✅ TERMINÉ
- Lyrics sync karaoke ✅
- Mode hors-ligne ✅
- Rapports fiscaux ✅
- Feed events ✅
- Admin finance + modération avancée ✅
