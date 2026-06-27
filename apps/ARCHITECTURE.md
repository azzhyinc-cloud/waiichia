# ARCHITECTURE WAIICHIA — État au 25 juin 2026

## STACK
- **VPS** : Ubuntu 24.04, HestiaCP, Nginx reverse proxy, IP 84.201.14.212
- **API** : Fastify + PM2, port 3001
- **Frontend** : React + Vite, lazy loading, Zustand
- **DB** : Supabase (35+ tables)
- **DNS** : Cloudflare (waiichia.com proxié, api.waiichia.com DNS-only)

## CHEMINS CRITIQUES
| Rôle | Chemin |
|------|--------|
| Code source frontend | `/opt/waiichia/apps/web/src/` |
| Code source API | `/opt/waiichia/apps/api/src/` |
| Build frontend | `/opt/waiichia/apps/web/dist/` |
| **Production (nginx)** | `/home/admin/web/waiichia.com/public_html/` |
| Deploy | `cd /opt/waiichia/apps/web && npm run deploy` |

## PAGES (23 fichiers dans src/pages/)
| Page | Route | État |
|------|-------|------|
| Home.jsx | home | ✅ |
| Music.jsx | music | ✅ usePrice fix 25/06 |
| Albums.jsx | albums | ✅ api.albums fix 25/06 |
| Events.jsx | events | ✅ usePrice fix 25/06 |
| Profile.jsx | profile | ✅ refonte 25/06 (AlbumDrawer, EventCard, tabs scroll) |
| Wallet.jsx | wallet | ✅ refonte 25/06 (confirm transfer, fix isIncome) |
| PlaylistsPage.jsx | playlists | ✅ refonte 25/06 (drawer, delete, search) |
| Dashboard.jsx | dashboard | ✅ |
| Settings.jsx | settings | ✅ |
| Upload.jsx | upload | ✅ |
| Messagerie.jsx | messages | ✅ |
| Shop.jsx | shop | ✅ |
| MyShop.jsx | shop_mine | ✅ |
| MyContent.jsx | my_content | ✅ |
| MyEvents.jsx | my_events | ✅ |
| Admin.jsx | admin | ✅ |
| Karaoke.jsx | karaoke | ✅ |
| Radio.jsx | radio | ✅ |
| Emission.jsx | emission | ✅ |
| Regie.jsx | regie | ✅ |
| Feed.jsx | feed | ✅ |
| Trending.jsx | trending | ✅ |
| Creators.jsx | creators | ✅ (vide si pas de créateurs en BDD) |
| Register.jsx | register | ✅ |
| Login.jsx | login | ✅ |

## COMPOSANTS (src/components/)
- Layout.jsx, ReactionBar.jsx, BuyModal.jsx, ShareModal.jsx
- AddToPlaylistModal.jsx, PlaylistCreateModal.jsx, TipModal.jsx
- EditProductModal.jsx, EditRadioModal.jsx

## HOOKS (src/hooks/)
- **usePrice.js** → `{ format, rates, devise }` — conversion devises, cache 10min
  - `format(amountKMF)` → string formaté dans la devise du store

## STORES (src/stores/index.js)
- `useThemeStore` → `{ theme, init }`
- `useAuthStore` → `{ user, loadMe, login, logout }`
- `usePlayerStore` → `{ currentTrack, isPlaying, play, pause, toggle, setQueue, progress }`
- `usePageStore` → `{ currentPage, setPage, profileUsername, bumpWalletRefresh }`
- `useDeviseStore` → `{ devise, setDevise }` — devise.code = 'KMF' par défaut

## API.JS — NAMESPACES (src/services/api.js)
```
api.tracks      → CRUD tracks + upload
api.profiles    → get, update, follow, unfollow, isFollowing, tracks, list
api.payments    → wallet, history, recharge, withdraw, transfer, tickets, rentals
api.events      → list, get, buy, myEvents
api.products    → list, get, buy, my, create, update, delete
api.messages    → conversations, messages, send, createConv, searchUsers
api.currency    → rates, convert
api.albums      → list, get, create, update, delete + .playlists{list,get,create,delete}
api.emissions   → list, get, ...
api.radio       → list, get, update
api.notifications → ...
api.campaigns   → ...
api.get(path)   → GET direct
api.post(path, data) → POST direct
api.patch(path, data) → PATCH direct
api.delete(path) → DELETE direct
```

## ROUTES API (17 routes Fastify sur port 3001)
auth, tracks, profiles, payments, products, messages, social, upload,
events, emissions, radio, karaoke, campaigns, admin, currency, albums, notifications

## VARIABLES D'ENVIRONNEMENT
- Frontend : `VITE_API_URL=https://api.waiichia.com`
- Token auth : `localStorage.getItem('waiichia_token')`

## ERRORBOUNDARY (App.jsx)
- Chunk introuvable → 1 reload max toutes les 30s (clé: `waiichia_chunk_reload`)
- Autres crashes → affiche l'erreur, bouton Retour + Actualiser, PAS de boucle
