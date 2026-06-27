# CHANGELOG WAIICHIA

## Session 25 juin 2026

### 🐛 BUG CRITIQUE DÉCOUVERT
- `npm run build` seul ne déploie PAS en production
- Fix permanent : `npm run deploy` ajouté dans package.json

### ✅ Wallet.jsx — Refonte complète
- Fix isIncome transferts, confirmation avant transfert, debounce recherche username
- ErrorBoundary anti-boucle, KPI strip entrants/sortants

### ✅ Profile.jsx — Refonte complète
- AlbumDrawer, EventCard split À venir/Passés, tab scroll mobile, fix double-fetch

### ✅ PlaylistsPage.jsx — Refonte complète
- normalizeTracks(), PlaylistDrawer, DeleteConfirm, recherche + filtres, stats strip

### 🐛 Fixes
- Music.jsx + Events.jsx : import usePrice manquant
- api.albums réajouté dans api.js
- ErrorBoundary : suppression boucle infinie
- AddToPlaylistModal : compteur tracks_count local
- albums.js API : fix count playlist_tracks (track_id)

### ✅ ShareModal — onglet Intégrer
- iframe embed options largeur/hauteur/thème/autoplay
- public/embed.html : player standalone vanilla JS

### ✅ PlayerBar — mode expanded mobile

---

## Session 25 juin 2026 — Upload multi-type
- emissions.js : POST /:id/episodes
- Upload.jsx : FPodcast + FEmission branchés

---

## Session 26 juin 2026 — MyShop fix + Merch
- MyShop : warning content_id vide, select contenu filtré par type
- MerchBanner.jsx : encart produit affilié sur Music.jsx

---

## Session 26 juin 2026 — Factures PDF
- jspdf lazy-load, generateInvoice() A4 header gold
- TxRow Wallet : bouton 📄 sur purchase/track_buy/ticket
- Wallet bundle : 420KB → 35KB

---

## Session 26 juin 2026 — P4 COMPLET

### Lyrics sync karaoke
- DB : colonne `lyrics_lrc TEXT` sur `karaoke_tracks`
- API : PATCH + GET /karaoke/tracks/:id/lyrics, parseLRC() serveur
- Front : LyricsDisplay (scroll + highlight temps réel), LyricsEditor (créateur/admin), badge Lyrics sur cards

### Mode hors-ligne
- sw.js v5 : 3 caches séparés (static, api, main)
- Cache First : assets JS/CSS/fonts/images
- Network First + fallback cache : navigation HTML + API clés
- pruneApiCache() nettoyage auto > 10min, handlers SKIP_WAITING / CLEAR_API_CACHE

### Rapports fiscaux
- Reports.jsx : nouvelle page (route 'reports')
- KPIs revenus/dépenses/net/opérations, graphique barres mensuel
- Détail par type avec barre progression, liste 50 transactions
- Export PDF complet lazy-load jspdf (toutes transactions)
- App.jsx : lazy import + route 'reports' ajoutée

### Feed events
- TabEvents dans Feed.jsx déjà complet avec ReactionBar ✅

### Admin finance + modération avancée
- Admin.jsx onglet Finance : 6 KPIs réels, graphique répartition par type, tableau 100 transactions, filtre période 7j/30j/90j/1an
- Admin.jsx onglet Signalements : filtres par sévérité (Critiques) et type (Tracks/Profils/Duets/Events), badge sévérité coloré

## Session 26 juin 2026 — Paiements fix + Nav Reports

### ✅ Lien Reports branché
- Dashboard : bouton "📈 Rapports" dans le header (setPage)
- Settings : onglet "📈 Rapports" dans la nav, redirige vers Reports

### 🐛 Bug critique retraits corrigé
- API admin : GET /withdrawals + PATCH /withdrawals/:id (approve/reject)
- Approve : debitWallet() + admin_logs + notif user
- Reject : status failed + notif user
- Front Admin : section "🏧 Retraits en attente" dans sidebar GESTION

## Session 26 juin 2026 — Social & Découverte

### ✅ CommentSection.jsx — nouveau composant
- Liste commentaires + formulaire + réponses imbriquées
- Suppression par l'auteur, timeAgo, avatar gradient
- Réutilisable : targetType + targetId (track, emission, event…)
- NB : Music.jsx utilise déjà ReactionBar qui gère les commentaires — CommentSection prévu pour Emissions/Karaoke/Albums

### ✅ Explore.jsx — nouvelle page
- Hero + filtre genres (Tout, Twarab, Afrobeats, Amapiano…)
- Trending tracks (grille, rank badge, play direct)
- Artistes à découvrir (follow/unfollow inline)
- Événements à venir
- CTA upload pour créateurs connectés

### ✅ Navigation
- Sidebar : entrée "🔭 Explorer" dans Découvrir
- BottomNav mobile : "🔭 Explorer" remplace Tendances
- App.jsx : lazy import + page map + VALID_PAGES

## Session 26 juin 2026 — CommentSection sur Emissions
- Emission.jsx : import CommentSection + <CommentSection targetType="emission" targetId={em.id} /> après la liste des épisodes (dans EmissionModal)
- Backup : Emission.jsx.bak-comments-*
- Testé OK (commentaires visibles, posts fonctionnels)
- NB : table comments + api.social déjà en place, rien à modifier côté API
- NB infra : épisode de DNS Supabase passager (EAI_AGAIN) + rate limit 429 pendant les tests — non liés au code

## Session 26 juin 2026 — Fix commentaires émissions + infra
- ENUM reaction_target : ajout 'emission', 'karaoke', 'episode' (Supabase SQL) → CAUSE RACINE du 500 sur commentaires émissions
- Rate limit API : 100 → 300 req/min (index.js L43) — page Musique sature à 100
- DNS serveur fiabilisé : 1.1.1.1 + 8.8.8.8 + fallback (resolved.conf + resolvectl dns eth0) — corrige EAI_AGAIN intermittent
- Backups : index.js.bak-ratelimit-*, resolved.conf.bak-*
- NB : DNS eth0 à re-vérifier après reboot (DHCP hébergeur peut réinjecter)
- Process PM2 = "waiichia-api"

## Session 26 juin 2026 — CommentSection sur Karaoke
- Karaoke.jsx : import CommentSection + <CommentSection targetType="karaoke" targetId={track.id} />
- Affiché en phase 'ready' uniquement (caché pendant enregistrement)
- Backup : Karaoke.jsx.bak-comments-*
- ENUM karaoke déjà ajouté plus tôt dans la session → aucun 500
- Build + deploy OK, testé fonctionnel

## Session 26 juin 2026 — CommentSection sur Karaoke
- Karaoke.jsx : import CommentSection + <CommentSection targetType="karaoke" targetId={track.id} />
- Affiché en phase 'ready' uniquement (caché pendant enregistrement)
- Backup : Karaoke.jsx.bak-comments-*
- ENUM karaoke déjà ajouté plus tôt dans la session → aucun 500
- Build + deploy OK, testé fonctionnel

## PROCHAINE SESSION — Test paiement Mvola (CRITIQUE avant prod mobile)
- Objectif : valider le parcours complet de bout en bout
- Mécanisme : PC = QR code à scanner → USSD → validation appel ; Mobile = appel direct
- À vérifier ABSOLUMENT : après recharge, le wallet est-il crédité du BON montant ?
- Outils : tester avec vrai téléphone + vrai compte Mvola + petit montant réel
- Côté serveur : surveiller pm2 logs waiichia-api pendant la transaction
- Fichiers probables à inspecter : api/src/routes/payments.js, currency.js
- Reste aussi à faire : reboot serveur (vérifier DNS+API remontent), passe de test parcours

## Session 27 juin 2026 — Validation paiement Mvola

### ✅ Test bout en bout validé
- Parcours complet testé en réel : demande → USSD → validation admin → crédit wallet
- Montant crédité exactement (500 KMF → +500 KMF sur le wallet)
- Logs PM2 [DEPOSITS] détaillés et corrects

### ✅ Fix UX référence Mvola
- mvolaRef : 15 chars alphanum → 6 chiffres numériques (dérivés de l'ID user, stables)
- UI mobile : encadré violet "Quand Mvola demande la description, tapez : XXXXXX" + bouton copier
- Build + deploy OK

### Reste à faire
- phone: '' dans POST /recharge → ajouter champ saisie numéro dans modal
- Prochain chantier : Capacitor (app mobile iOS/Android)

### ✅ Fix phone recharge Mvola
- Ajout champ "Votre numéro Mvola" dans le modal de recharge (visible uniquement si méthode = mvola)
- State phone transmis dans POST /recharge → stocké dans metadata.phone
- L'admin voit désormais le numéro dans le panel Dépôts
