#!/usr/bin/env python3
"""
Patch v20-2 : Étendre ChunkErrorBoundary pour reload auto 2s sur tout crash React.

État actuel :
- Erreurs chunk (deploy)  → reload immédiat ✅
- Autres crashes React    → fallback UI + bouton manuel uniquement ❌

Après patch :
- Erreurs chunk           → reload immédiat (inchangé)
- Autres crashes React    → fallback UI visible + reload auto après 2 secondes

Idempotent, backup timestampé.
"""
import os
import shutil
import sys
import time

FILE = '/opt/waiichia/apps/web/src/App.jsx'

OLD = """    if (error?.message?.includes('dynamically imported module') || error?.message?.includes('Loading chunk') || error?.message?.includes('Failed to fetch')) {
      window.location.reload()
    }
  }"""

NEW = """    if (error?.message?.includes('dynamically imported module') || error?.message?.includes('Loading chunk') || error?.message?.includes('Failed to fetch')) {
      window.location.reload()
    } else {
      // v20: tout autre crash React -> reload auto apres 2s (fallback UI visible entre-temps)
      setTimeout(() => window.location.reload(), 2000)
    }
  }"""

MARKER = "v20: tout autre crash React"


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

    # Ancre unique
    count = content.count(OLD)
    if count != 1:
        print(f"❌ Ancre trouvée {count} fois (attendu 1). Patch ANNULÉ.")
        sys.exit(1)

    # Backup
    backup = f"{FILE}.bak-v20-2-{int(time.time())}"
    shutil.copy2(FILE, backup)
    print(f"📦 Backup : {backup}")

    # Patch
    new_content = content.replace(OLD, NEW)

    if len(new_content) <= len(content):
        print(f"❌ Contenu pas plus long après patch. ANNULÉ.")
        sys.exit(1)

    if MARKER not in new_content:
        print(f"❌ Marqueur absent du résultat. ANNULÉ.")
        sys.exit(1)

    with open(FILE, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"✅ Patch v20-2 appliqué.")
    print(f"   Lignes : avant={len(content.splitlines())}, après={len(new_content.splitlines())}")
    print(f"   ⚠️  Frontend modifié → un BUILD est nécessaire (npm run build) avant test navigateur.")


if __name__ == '__main__':
    main()
