#!/usr/bin/env python3
"""
Patch v20-1 : Filtre is_published sur la liste PUBLIQUE GET /albums.

Comportement après patch :
- Avec creator_id/user_id en param  → comportement inchangé (MyContent OK)
- Sans param (liste publique)       → exclut les brouillons (is_published=false)

Idempotent (peut être relancé sans effet de bord).
Backup timestampé avant écriture.
"""
import os
import shutil
import sys
import time

FILE = '/opt/waiichia/apps/api/src/routes/albums.js'

OLD = """      const filterId = creator_id || user_id
      if (filterId) query = query.eq('creator_id', filterId)"""

NEW = """      const filterId = creator_id || user_id
      if (filterId) {
        query = query.eq('creator_id', filterId)
      } else {
        // v20: liste publique = exclure les brouillons (is_published=false)
        query = query.eq('is_published', true)
      }"""

MARKER = "v20: liste publique = exclure les brouillons"


def main():
    if not os.path.isfile(FILE):
        print(f"❌ Fichier introuvable : {FILE}")
        sys.exit(1)

    with open(FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Idempotence
    if MARKER in content:
        print(f"✅ Patch déjà appliqué (marqueur présent). Aucune modification.")
        sys.exit(0)

    # Ancre doit apparaître exactement 1 fois
    count = content.count(OLD)
    if count != 1:
        print(f"❌ Ancre trouvée {count} fois (attendu 1). Patch ANNULÉ.")
        sys.exit(1)

    # Backup
    backup = f"{FILE}.bak-v20-1-{int(time.time())}"
    shutil.copy2(FILE, backup)
    print(f"📦 Backup : {backup}")

    # Patch
    new_content = content.replace(OLD, NEW)

    # Vérifications de sécurité
    if len(new_content) <= len(content):
        print(f"❌ Contenu pas plus long après patch ({len(new_content)} vs {len(content)}). ANNULÉ.")
        sys.exit(1)

    if MARKER not in new_content:
        print(f"❌ Marqueur absent du résultat. ANNULÉ.")
        sys.exit(1)

    # Écriture
    with open(FILE, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"✅ Patch v20-1 appliqué.")
    print(f"   Lignes : avant={len(content.splitlines())}, après={len(new_content.splitlines())}")
    print(f"   Effet : GET /albums (sans param) filtrera is_published=true.")


if __name__ == '__main__':
    main()
