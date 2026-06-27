# RÈGLES DE TRAVAIL — WAIICHIA
> À lire au début de chaque session. Ne jamais contourner ces règles.

## 1. DÉPLOIEMENT
- **Jamais `npm run build` seul** — toujours `npm run deploy`
- `npm run deploy` = build + copie vers `/home/admin/web/waiichia.com/public_html/`
- Vérifier que le deploy a bien eu lieu : `ls -la /home/admin/web/waiichia.com/public_html/index.html`

## 2. AVANT DE MODIFIER UN FICHIER
- Toujours faire un backup : `cp fichier.jsx fichier.jsx.bak-description-$(date +%s)`
- Toujours lire le fichier entier avant de modifier
- Ne jamais réécrire un fichier sans avoir vérifié ce qu'il contient

## 3. HOOKS ET IMPORTS — RÈGLES CRITIQUES
- `usePrice` → retourne `{ format, rates, devise }` — import depuis `../hooks/usePrice.js`
- Si une page utilise `format(...)`, elle doit avoir :
  1. `import { usePrice } from "../hooks/usePrice.js"` en haut
  2. `const { format } = usePrice()` dans le composant
- Pages qui utilisent `format` : Music.jsx, Events.jsx, Shop.jsx, Albums.jsx
- `api.albums` existe dans api.js (lignes ~132-143) — ne pas supprimer
- `api.playlists` n'existe pas séparément — utiliser `api.albums.playlists`

## 4. API.JS — STRUCTURE PROTÉGÉE
Les namespaces suivants doivent toujours être présents dans `api.js` :
- `api.tracks`, `api.profiles`, `api.payments`, `api.events`
- `api.products`, `api.messages`, `api.currency`, `api.albums`
- `api.emissions`, `api.radio`, `api.notifications`, `api.campaigns`
Avant d'éditer api.js : `grep -n "^  [a-z]" src/services/api.js` pour lister les namespaces

## 5. STORES — NE PAS TOUCHER SANS RAISON
Fichier : `src/stores/index.js`
Stores existants : `useThemeStore`, `useAuthStore`, `usePlayerStore`, `usePageStore`, `useDeviseStore`
Chaque store a des méthodes critiques — ne pas renommer ni supprimer

## 6. VÉRIFICATION AVANT DEPLOY
```bash
# Toujours lancer avant npm run deploy :
grep -rn "format(" src/pages/ --include="*.jsx" | grep -v "usePrice\|import\|toLocaleString\|formatDate\|formatK\|fmtDate\|fmtK\|//\|\.format"
# Si une ligne apparaît → vérifier que format est importé dans ce fichier
```

## 7. SERVICE WORKER
- Ne pas modifier `public/sw.js` sauf pour les notifications push
- Le CACHE_NAME est `waiichia-v4` — incrémenter si on change la stratégie de cache

## 8. EN CAS D'ERREUR EN PROD
1. Ouvrir F12 → Console → copier l'erreur exacte
2. L'ErrorBoundary affiche maintenant l'erreur directement (plus de boucle infinie)
3. Chercher le fichier concerné : `grep -rn "mot_clé" src/pages/ --include="*.jsx"`
4. Fix minimal, pas de réécriture complète

## 10. GROS FICHIERS (>100 lignes)
- Générer en artifact Claude → télécharger → uploader via SFTP (Termius) ou scp
- Ne jamais coller un gros fichier dans le terminal (risque de coupure)
- Après upload : vérifier avec `wc -l fichier` puis `npm run deploy`

## 9. STRUCTURE DES SESSIONS
- Toujours commencer par coller `cat /opt/waiichia/apps/CONTEXT.md`
- Toujours finir par mettre à jour CONTEXT.md et CHANGELOG.md
- Sauvegarder avec : `npm run deploy`
