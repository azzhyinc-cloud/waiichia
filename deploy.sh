#!/bin/bash
cd /opt/waiichia/apps/web
npx vite build
# Keep old assets, copy new ones on top (no deletion)
cp -r dist/* /home/admin/web/waiichia.com/public_html/
chown -R admin:admin /home/admin/web/waiichia.com/public_html/
# Clean assets older than 7 days
find /home/admin/web/waiichia.com/public_html/assets -name "*.js" -mtime +7 -delete 2>/dev/null
find /home/admin/web/waiichia.com/public_html/assets -name "*.css" -mtime +7 -delete 2>/dev/null
echo "Deployed OK!"
