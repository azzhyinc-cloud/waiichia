cat > supabase/migrations/001_initial_schema.sql << 'EOF'
-- Migration exportée depuis Supabase Dashboard
-- Exécutée le : $(date)
-- Voir SQL Editor Supabase pour le contenu complet
-- Tables : profiles, tracks, albums, follows, track_access,
--          rentals, transactions, reactions, comments,
--          radio_stations, events, products, ad_campaigns,
--          notifications, playlists, album_tracks, playlist_tracks
EOF
git add . && git commit -m "db: migration 001 schéma initial exécutée sur Supabase" && git push
echo "✅ Commité"
