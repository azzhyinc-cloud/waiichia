#!/bin/bash
# ═══════════════════════════════════════════════════
# CSS FINAL — Tous les styles manquants
# ═══════════════════════════════════════════════════
echo "📝 Ajout des styles manquants..."

cat >> /workspaces/waiichia/apps/web/src/prototype-v7.css << 'CSSEOF'

/* ═══ MESSAGERIE ═══ */
.messages-layout { display:grid;grid-template-columns:300px 1fr;gap:0;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;height:calc(100vh - 200px);min-height:500px; }
.conv-list { background:var(--card);border-right:1px solid var(--border);overflow-y:auto; }
.conv-list-hdr { padding:14px 16px;font-weight:700;font-size:14px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center; }
.conv-item { display:flex;align-items:center;gap:12px;padding:12px 16px;cursor:pointer;transition:all .15s;border-bottom:1px solid var(--border); }
.conv-item:hover,.conv-item.active { background:var(--bg2); }
.conv-item.active { border-left:2px solid var(--gold); }
.conv-ava { width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;flex-shrink:0; }
.conv-info { flex:1;min-width:0; }
.conv-name { font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.conv-last { font-size:11.5px;color:var(--text3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px; }
.conv-meta { display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0; }
.conv-time { font-size:10px;color:var(--text3);font-family:'Space Mono',monospace; }
.unread-dot { width:8px;height:8px;border-radius:50%;background:var(--gold); }
.chat-area { display:flex;flex-direction:column;background:var(--bg); }
.chat-hdr { display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border);background:var(--card); }
.chat-msgs { flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px; }
.msg-bubble { max-width:75%;padding:10px 14px;border-radius:16px;font-size:13px;line-height:1.5; }
.msg-in { background:var(--card);border:1px solid var(--border);border-bottom-left-radius:4px;align-self:flex-start; }
.msg-out { background:linear-gradient(135deg,var(--gold),#e8920a);color:#000;border-bottom-right-radius:4px;align-self:flex-end; }
.chat-input-row { display:flex;gap:8px;padding:12px 16px;border-top:1px solid var(--border);background:var(--card); }
.chat-input { flex:1;padding:10px 14px;border-radius:var(--radius);border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;outline:none; }
.chat-input:focus { border-color:var(--gold); }

/* ═══ WALLET ═══ */
.wallet-card { background:linear-gradient(135deg,#0a2e1e 0%,#007040 50%,#002a10 100%);border-radius:var(--radius);padding:28px;margin-bottom:20px;position:relative;overflow:hidden; }
.wallet-card::before { content:'';position:absolute;top:-20px;right:-20px;width:160px;height:160px;border-radius:50%;background:rgba(44,198,83,.15);pointer-events:none; }
.wallet-devise { font-size:12px;color:rgba(255,255,255,.6);margin-bottom:8px; }
.wallet-balance { font-family:'Syne',sans-serif;font-size:32px;font-weight:800;margin-bottom:6px; }
.wallet-actions { display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px; }
.wallet-action-btn { background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px 10px;text-align:center;cursor:pointer;transition:all .18s; }
.wallet-action-btn:hover { border-color:var(--gold);transform:translateY(-2px); }
.wallet-action-icon { font-size:24px;margin-bottom:6px; }
.wallet-action-label { font-size:11px;font-weight:600; }
.transactions-list { display:flex;flex-direction:column;gap:6px; }
.transaction-item { display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius-sm);transition:border-color .15s; }
.transaction-item:hover { border-color:rgba(245,166,35,.3); }
.tx-icon { width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0; }
.tx-info { flex:1;min-width:0; }
.tx-title { font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.tx-sub { font-size:11px;color:var(--text3);margin-top:2px; }
.tx-amount { font-family:'Space Mono',monospace;font-weight:700;font-size:13px;flex-shrink:0; }
.tx-positive { color:var(--green); }
.tx-negative { color:var(--red); }

/* ═══ EVENTS ═══ */
.events-grid { display:flex;flex-direction:column;gap:10px; }
.event-card { display:flex;gap:14px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;cursor:pointer;transition:all .18s; }
.event-card:hover { border-color:rgba(245,166,35,.3);transform:translateX(4px); }
.event-date-box { width:56px;height:56px;border-radius:var(--radius-sm);display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0; }
.event-day { font-family:'Syne',sans-serif;font-weight:800;font-size:20px;line-height:1;color:#fff; }
.event-month { font-size:10px;font-family:'Space Mono',monospace;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.7); }
.event-info { flex:1;min-width:0; }
.event-title { font-weight:700;font-size:14px;margin-bottom:4px;display:flex;align-items:center;flex-wrap:wrap;gap:6px; }
.event-meta { font-size:11.5px;color:var(--text2);display:flex;gap:10px;flex-wrap:wrap; }
.event-cat { background:rgba(155,89,245,.12);color:var(--purple);padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600; }

/* ═══ CREATORS ═══ */
.creator-card { background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:20px 14px;text-align:center;cursor:pointer;transition:all .2s; }
.creator-card:hover { border-color:rgba(245,166,35,.4);transform:translateY(-4px);box-shadow:0 8px 24px rgba(245,166,35,.1); }
.creator-ava { width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;margin:0 auto; }
.creator-name { font-weight:700;font-size:13px;margin-bottom:2px; }
.creator-fans { font-size:11px;color:var(--text2);font-family:'Space Mono',monospace;margin-bottom:10px; }
.follow-btn { width:100%;padding:7px;border-radius:50px;border:1px solid rgba(245,166,35,.4);background:rgba(245,166,35,.08);color:var(--gold);font-size:12px;font-weight:600;cursor:pointer;transition:all .18s;font-family:'Plus Jakarta Sans',sans-serif; }
.follow-btn:hover { background:var(--gold);color:#000; }

/* ═══ PAYMENT MODAL ═══ */
.pay-modal { max-width:520px; }
.pay-balance-bar { display:flex;justify-content:space-between;align-items:center;background:rgba(44,198,83,.08);border:1px solid rgba(44,198,83,.2);border-radius:var(--radius-sm);padding:14px;margin-bottom:16px; }
.pay-balance-label { font-size:11px;color:var(--text2); }
.pay-balance-val { font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:var(--green); }
.pay-section-label { font-size:12px;font-weight:700;color:var(--text2);margin-bottom:8px;font-family:'Space Mono',monospace;text-transform:uppercase;letter-spacing:.8px; }
.pay-methods-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;margin-bottom:16px; }
.pay-method-card { background:var(--card);border:2px solid var(--border);border-radius:var(--radius-sm);padding:12px;text-align:center;cursor:pointer;transition:all .18s; }
.pay-method-card:hover { border-color:rgba(245,166,35,.4); }
.pay-method-card.sel { border-color:var(--gold);background:rgba(245,166,35,.06); }
.pay-method-icon { font-size:24px;margin-bottom:4px; }
.pay-method-name { font-size:12px;font-weight:700;margin-bottom:2px; }
.pay-method-sub { font-size:10px;color:var(--text3); }

/* ═══ LIVE PULSE ANIMATION ═══ */
@keyframes live-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

/* ═══ RESPONSIVE ═══ */
@media(max-width:768px) {
  .messages-layout { grid-template-columns:1fr;height:auto; }
  .conv-list { max-height:200px; }
  .wallet-actions { grid-template-columns:repeat(2,1fr); }
  .wallet-balance { font-size:24px; }
}
@media(max-width:600px) {
  .event-date-box { width:48px;height:48px; }
  .event-day { font-size:16px; }
}
CSSEOF

echo "✅ CSS ajouté : messagerie, wallet, events, creators, payment modal, responsive"

# Relancer le frontend
echo "🚀 Relancement..."
cd /workspaces/waiichia
pkill -f vite 2>/dev/null; sleep 1
pnpm --filter web run dev

echo ""
echo "═══════════════════════════════════════"
echo "  CSS FINAL APPLIQUÉ !"
echo "  ✅ Messages layout + bulles dorées"
echo "  ✅ Wallet card + actions + transactions"
echo "  ✅ Events grid + date box"
echo "  ✅ Creator cards + follow button"
echo "  ✅ Payment modal (recharge)"
echo "  ✅ Animations (live pulse, shimmer)"
echo "  ✅ Responsive mobile"
echo "═══════════════════════════════════════"
