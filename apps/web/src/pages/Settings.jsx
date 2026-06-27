import { useState, useEffect } from 'react'
import { useAuthStore, usePageStore, useThemeStore } from '../stores/index.js'
import api from '../services/api.js'
import { isPushSupported, subscribeToPush, unsubscribeFromPush, isPushSubscribed, getNotificationPermission } from '../services/push.js'

// ═══════════════════════════════════════════════════════════
//  WAIICHIA SETTINGS — "Kitenge Digital"
//  Design inspiré des tissus wax, motifs comoriens, couleurs du Sahel
// ═══════════════════════════════════════════════════════════

export default function Settings() {
  const { user, token, loadMe, logout, setUser } = useAuthStore()
  const { setPage } = usePageStore()
  const { theme, toggle: toggleTheme } = useThemeStore()
  const [tab, setTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [country, setCountry] = useState(user?.country || '')
  const [email, setEmail] = useState(user?.email || '')

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const [pushSupported, setPushSupported] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [pushPermission, setPushPermission] = useState('default')

  useEffect(() => { checkPushStatus() }, [])
  useEffect(() => {
    if (msg) { const t = setTimeout(() => setMsg(''), 4000); return () => clearTimeout(t) }
  }, [msg])

  const checkPushStatus = async () => {
    const supported = isPushSupported()
    setPushSupported(supported)
    if (supported) {
      setPushPermission(getNotificationPermission())
      const subscribed = await isPushSubscribed()
      setPushEnabled(subscribed)
    }
  }

  const updateProfile = async () => {
    setLoading(true); setMsg('')
    try {
      const res = await api.patch('/api/profiles/me', { display_name: displayName, bio, country })
      setUser({ ...user, ...(res || {}) })
      setMsg('✅ Profil mis à jour avec succès !')
    } catch (e) { setMsg('❌ ' + (e.message || 'Erreur')) }
    setLoading(false)
  }

  const changePassword = async () => {
    if (!oldPassword || !newPassword) return setMsg('❌ Remplissez les deux champs')
    if (newPassword.length < 6) return setMsg('❌ Minimum 6 caractères')
    setLoading(true); setMsg('')
    try {
      await api.post('/api/auth/change-password', { old_password: oldPassword, new_password: newPassword })
      setMsg('✅ Mot de passe mis à jour !')
      setOldPassword(''); setNewPassword('')
    } catch (e) { setMsg('❌ ' + (e.message || 'Erreur')) }
    setLoading(false)
  }

  const togglePush = async () => {
    setPushLoading(true)
    try {
      if (pushEnabled) {
        const success = await unsubscribeFromPush()
        if (success) { setPushEnabled(false); setMsg('🔕 Notifications désactivées') }
        else setMsg('❌ Erreur désactivation')
      } else {
        const success = await subscribeToPush()
        if (success) { setPushEnabled(true); setMsg('🔔 Notifications activées !') }
        else {
          const perm = getNotificationPermission()
          setPushPermission(perm)
          setMsg(perm === 'denied' ? '❌ Notifications bloquées dans le navigateur' : '❌ Erreur activation')
        }
      }
    } catch { setMsg('❌ Erreur push') }
    setPushLoading(false)
  }

  const handleLogout = () => { logout(); setPage('home') }

  const TABS = [
    { key: 'profile', icon: '👤', label: 'Profil', accent: '#d4a10a', desc: 'Identité' },
    { key: 'security', icon: '🔐', label: 'Sécurité', accent: '#c0392b', desc: 'Protection' },
    { key: 'notifications', icon: '🔔', label: 'Notifications', accent: '#e8944a', desc: 'Alertes' },
    { key: 'appearance', icon: '🎨', label: 'Apparence', accent: '#0e7c66', desc: 'Thème' },
    { key: 'reports', icon: '📈', label: 'Rapports', accent: '#8e44ad', desc: 'Finances' },
  ]
  const currentTab = TABS.find(t => t.key === tab)
  const isSuccess = msg.startsWith('✅') || msg.startsWith('🔔') || msg.startsWith('🔕')

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800;9..144,900&display=swap');

        .kd-wrapper { max-width: 1020px; margin: 0 auto; padding: 0 16px 80px; }

        /* ─── Hero Header avec motif kitenge ─── */
        .kd-hero {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          padding: 32px 28px 32px;
          margin: 16px 0 28px;
          background:
            radial-gradient(circle at 85% 20%, rgba(232, 148, 74, 0.35) 0%, transparent 50%),
            radial-gradient(circle at 15% 80%, rgba(212, 161, 10, 0.3) 0%, transparent 50%),
            linear-gradient(135deg, #2a1810 0%, #4a2818 45%, #6b2d1a 100%);
          box-shadow:
            0 20px 60px -20px rgba(192, 57, 43, 0.4),
            0 8px 24px -8px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 220, 140, 0.15);
        }
        .kd-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><g fill='none' stroke='%23f5d48a' stroke-width='1' opacity='0.15'><path d='M40 5 L55 20 L40 35 L25 20 Z'/><path d='M40 45 L55 60 L40 75 L25 60 Z'/><circle cx='10' cy='40' r='3'/><circle cx='70' cy='40' r='3'/><path d='M0 40 L8 36 L8 44 Z'/><path d='M80 40 L72 36 L72 44 Z'/></g></svg>");
          opacity: 0.6;
          pointer-events: none;
        }
        .kd-hero::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 6px;
          background: repeating-linear-gradient(
            90deg,
            #d4a10a 0px, #d4a10a 16px,
            #c0392b 16px, #c0392b 32px,
            #0e7c66 32px, #0e7c66 48px,
            #e8944a 48px, #e8944a 64px
          );
        }
        .kd-hero-content {
          position: relative; z-index: 2;
          display: flex; align-items: center; gap: 20px;
        }
        .kd-hero-emblem {
          width: 72px; height: 72px;
          border-radius: 20px;
          background: linear-gradient(135deg, #ffd97d 0%, #d4a10a 50%, #8b6508 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 36px;
          box-shadow:
            0 10px 30px -6px rgba(212, 161, 10, 0.6),
            inset 0 2px 6px rgba(255, 255, 255, 0.4),
            inset 0 -3px 8px rgba(139, 101, 8, 0.5);
          position: relative; flex-shrink: 0;
        }
        .kd-hero-emblem::after {
          content: '';
          position: absolute; inset: -3px;
          border-radius: 23px;
          border: 2px dashed rgba(255, 217, 125, 0.4);
          animation: kd-spin 20s linear infinite;
        }
        .kd-hero-title {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 900;
          font-size: 36px;
          letter-spacing: -1px;
          color: #fff7e6;
          margin: 0;
          line-height: 1.1;
          text-shadow: 0 2px 12px rgba(0,0,0,0.3);
        }
        .kd-hero-title em {
          font-style: italic;
          background: linear-gradient(135deg, #ffd97d, #f5a623);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 600;
        }
        .kd-hero-subtitle {
          color: #f5d4a8;
          font-size: 14px;
          margin: 6px 0 0;
          opacity: 0.9;
          font-weight: 500;
          display: flex; align-items: center; gap: 8px;
        }
        .kd-hero-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #ffd97d;
          animation: kd-pulse 2s ease-in-out infinite;
        }

        /* ─── Layout 2 colonnes ─── */
        .kd-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 820px) { .kd-layout { grid-template-columns: 1fr; gap: 16px; } }

        /* ─── Sidebar nav ─── */
        .kd-nav {
          position: sticky; top: 20px;
          background: var(--card);
          border-radius: 18px;
          border: 1px solid var(--border);
          padding: 10px;
          display: flex; flex-direction: column; gap: 4px;
          box-shadow: 0 4px 20px -8px rgba(0,0,0,0.15);
        }
        @media (max-width: 820px) {
          .kd-nav { position: relative; top: 0; flex-direction: row; overflow-x: auto; padding: 6px; }
        }
        .kd-nav-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          border: none; background: transparent;
          color: var(--text2);
          cursor: pointer;
          font-family: inherit; text-align: left;
          transition: all 0.25s cubic-bezier(.4, 0, .2, 1);
          position: relative; overflow: hidden;
          font-weight: 500;
        }
        @media (max-width: 820px) {
          .kd-nav-item { flex-shrink: 0; padding: 10px 14px; }
          .kd-nav-item-desc { display: none; }
        }
        .kd-nav-item:hover { background: rgba(212, 161, 10, 0.08); color: var(--text); }
        .kd-nav-item.active {
          background: linear-gradient(135deg, rgba(212, 161, 10, 0.15), rgba(192, 57, 43, 0.08));
          color: var(--text);
          box-shadow: inset 0 0 0 1px rgba(212, 161, 10, 0.25);
        }
        .kd-nav-item.active::before {
          content: '';
          position: absolute;
          left: 0; top: 8px; bottom: 8px;
          width: 3px;
          border-radius: 0 3px 3px 0;
          background: var(--tab-accent);
          box-shadow: 0 0 12px var(--tab-accent);
        }
        @media (max-width: 820px) {
          .kd-nav-item.active::before {
            left: 8px; right: 8px; top: auto; bottom: 0;
            width: auto; height: 3px;
            border-radius: 3px 3px 0 0;
          }
        }
        .kd-nav-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          background: rgba(0,0,0,0.15);
          flex-shrink: 0;
          transition: all 0.25s;
        }
        .kd-nav-item.active .kd-nav-icon {
          background: linear-gradient(135deg, var(--tab-accent), color-mix(in srgb, var(--tab-accent) 70%, black));
          box-shadow: 0 4px 14px -4px var(--tab-accent);
          transform: scale(1.08);
        }
        .kd-nav-item-label { font-weight: 600; font-size: 14px; }
        .kd-nav-item-desc { font-size: 11px; color: var(--text2); margin-top: 1px; opacity: 0.7; }

        /* ─── Content + cards ─── */
        .kd-content { animation: kd-slide-in 0.45s cubic-bezier(.4, 0, .2, 1); }

        .kd-card {
          background: var(--card);
          border-radius: 18px;
          border: 1px solid var(--border);
          padding: 24px;
          margin-bottom: 18px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 12px -4px rgba(0,0,0,0.08);
        }
        .kd-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--tab-accent), transparent);
          opacity: 0.6;
        }
        .kd-card-header {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 6px;
        }
        .kd-card-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          background: linear-gradient(135deg,
            color-mix(in srgb, var(--tab-accent) 20%, transparent),
            color-mix(in srgb, var(--tab-accent) 8%, transparent));
          border: 1px solid color-mix(in srgb, var(--tab-accent) 30%, transparent);
          flex-shrink: 0;
        }
        .kd-card-title {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 700;
          font-size: 20px;
          color: var(--text);
          margin: 0;
          letter-spacing: -0.4px;
        }
        .kd-card-desc {
          font-size: 13px;
          color: var(--text2);
          margin: 2px 0 0;
          line-height: 1.5;
        }
        .kd-card-body { margin-top: 20px; }

        /* ─── Form fields ─── */
        .kd-field { margin-bottom: 16px; }
        .kd-label {
          display: block;
          font-size: 12px; font-weight: 700;
          color: var(--text);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .kd-input {
          width: 100%;
          padding: 13px 16px;
          border-radius: 12px;
          border: 1.5px solid var(--border);
          background: var(--bg2);
          color: var(--text);
          font-size: 14px;
          font-family: inherit;
          box-sizing: border-box;
          outline: none;
          transition: all 0.2s;
        }
        .kd-input:focus {
          border-color: var(--tab-accent);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--tab-accent) 15%, transparent);
        }
        .kd-input:disabled { opacity: 0.5; cursor: not-allowed; }
        .kd-hint {
          font-size: 11.5px;
          color: var(--text2);
          margin-top: 6px;
          display: flex; align-items: center; gap: 5px;
          line-height: 1.4;
        }
        textarea.kd-input { resize: vertical; min-height: 80px; }

        /* ─── Buttons ─── */
        .kd-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px 22px;
          border-radius: 12px;
          border: none;
          font-family: inherit;
          font-weight: 700; font-size: 13.5px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .kd-btn-primary {
          background: linear-gradient(135deg, #d4a10a, #c0392b);
          color: #fff;
          box-shadow: 0 4px 16px -4px rgba(212, 161, 10, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        .kd-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px -4px rgba(212, 161, 10, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        .kd-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .kd-btn-danger {
          background: rgba(192, 57, 43, 0.1);
          color: #c0392b;
          border: 1.5px solid rgba(192, 57, 43, 0.3);
        }
        .kd-btn-danger:hover {
          background: #c0392b;
          color: #fff;
          border-color: #c0392b;
        }
        .kd-btn-full { width: 100%; }

        /* ─── Toast flottant ─── */
        .kd-toast {
          position: fixed;
          bottom: 30px; left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          padding: 14px 22px;
          border-radius: 14px;
          font-size: 14px; font-weight: 600;
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.3);
          animation: kd-toast-in 0.3s cubic-bezier(.4, 0, .2, 1);
          backdrop-filter: blur(10px);
          max-width: 90vw;
        }
        .kd-toast.success { background: linear-gradient(135deg, #0e7c66, #1a9d82); color: #fff; }
        .kd-toast.error { background: linear-gradient(135deg, #c0392b, #e74c3c); color: #fff; }

        /* ─── Info rows ─── */
        .kd-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 0;
          border-bottom: 1px dashed var(--border);
        }
        .kd-row:last-child { border-bottom: none; }
        .kd-row-label { font-size: 13px; color: var(--text2); font-weight: 500; }
        .kd-row-value {
          font-size: 13.5px; color: var(--text); font-weight: 700;
          display: flex; align-items: center; gap: 6px;
        }
        .kd-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.3px;
          background: linear-gradient(135deg, #ffd97d, #d4a10a);
          color: #3b2a05;
          box-shadow: 0 2px 8px -2px rgba(212, 161, 10, 0.5);
        }
        .kd-badge-verified {
          background: linear-gradient(135deg, #0e7c66, #16a085);
          color: #fff;
          box-shadow: 0 2px 8px -2px rgba(14, 124, 102, 0.5);
        }

        /* ─── Push card ─── */
        .kd-push-card {
          position: relative;
          padding: 24px;
          border-radius: 16px;
          background:
            radial-gradient(circle at 90% 10%, rgba(232, 148, 74, 0.2), transparent 60%),
            var(--card2);
          border: 1.5px solid var(--border);
          transition: all 0.3s;
        }
        .kd-push-card.active {
          background:
            radial-gradient(circle at 90% 10%, rgba(212, 161, 10, 0.25), transparent 60%),
            linear-gradient(135deg, rgba(14, 124, 102, 0.08), rgba(212, 161, 10, 0.08));
          border-color: rgba(212, 161, 10, 0.4);
          box-shadow: 0 0 40px -10px rgba(212, 161, 10, 0.4);
        }
        .kd-push-row { display: flex; align-items: center; gap: 16px; }
        .kd-push-bell {
          width: 56px; height: 56px;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 28px;
          background: var(--bg2);
          transition: all 0.3s;
        }
        .kd-push-card.active .kd-push-bell {
          background: linear-gradient(135deg, #ffd97d, #d4a10a);
          box-shadow: 0 8px 24px -4px rgba(212, 161, 10, 0.6);
          animation: kd-bell 2.4s ease-in-out infinite;
        }
        .kd-push-info { flex: 1; }
        .kd-push-title { font-weight: 700; font-size: 15px; color: var(--text); font-family: 'Fraunces', serif; }
        .kd-push-sub { font-size: 12.5px; color: var(--text2); margin-top: 3px; }

        /* ─── Notification types ─── */
        .kd-notif-item {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 4px;
          border-bottom: 1px dashed var(--border);
          transition: all 0.2s;
        }
        .kd-notif-item:last-child { border-bottom: none; }
        .kd-notif-item:hover { padding-left: 8px; }
        .kd-notif-icon {
          width: 42px; height: 42px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .kd-notif-label { font-weight: 700; font-size: 13.5px; color: var(--text); }
        .kd-notif-desc { font-size: 12px; color: var(--text2); margin-top: 2px; }
        .kd-notif-status { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

        /* ─── Theme selector ─── */
        .kd-theme-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .kd-theme-card {
          padding: 20px 16px;
          border-radius: 16px;
          cursor: pointer;
          border: 2px solid var(--border);
          background: var(--card2);
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          transition: all 0.25s cubic-bezier(.4, 0, .2, 1);
          font-family: inherit;
          position: relative; overflow: hidden;
        }
        .kd-theme-card:hover { transform: translateY(-3px); }
        .kd-theme-card.active { border-color: #d4a10a; box-shadow: 0 12px 30px -10px rgba(212, 161, 10, 0.5); }
        .kd-theme-card.active.light { background: linear-gradient(135deg, #fff4d6, #ffe194); }
        .kd-theme-card.active.dark { background: linear-gradient(135deg, #1a1a2e, #16213e); }
        .kd-theme-orb {
          font-size: 40px;
          width: 72px; height: 72px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.08);
          transition: all 0.3s;
        }
        .kd-theme-card.active.light .kd-theme-orb {
          background: radial-gradient(circle, #ffd97d, #ffa500);
          box-shadow: 0 0 30px rgba(255, 215, 0, 0.6);
        }
        .kd-theme-card.active.dark .kd-theme-orb {
          background: radial-gradient(circle, #3a4a7a, #1a1a2e);
          box-shadow: 0 0 30px rgba(147, 197, 253, 0.5);
        }
        .kd-theme-name { font-weight: 800; font-size: 15px; font-family: 'Fraunces', serif; }
        .kd-theme-card.active.light .kd-theme-name { color: #3b2a05; }
        .kd-theme-card.active.dark .kd-theme-name { color: #f5f5f5; }
        .kd-theme-status { font-size: 11.5px; font-weight: 600; opacity: 0.8; }
        .kd-theme-card.active.light .kd-theme-status { color: #5a3a05; }
        .kd-theme-card.active.dark .kd-theme-status { color: #c7d2fe; }

        /* ─── Danger card ─── */
        .kd-danger-card {
          background:
            repeating-linear-gradient(135deg,
              transparent 0, transparent 10px,
              rgba(192, 57, 43, 0.03) 10px, rgba(192, 57, 43, 0.03) 11px),
            var(--card);
          border: 1.5px dashed rgba(192, 57, 43, 0.4);
        }
        .kd-danger-card .kd-card-title { color: #c0392b; }
        .kd-danger-card .kd-card-icon {
          background: linear-gradient(135deg, rgba(192, 57, 43, 0.2), rgba(192, 57, 43, 0.05));
          border-color: rgba(192, 57, 43, 0.3);
        }

        /* ─── Tip box ─── */
        .kd-tip {
          padding: 14px 16px;
          border-radius: 12px;
          font-size: 12.5px;
          line-height: 1.55;
          color: var(--text2);
          background:
            repeating-linear-gradient(90deg,
              transparent 0, transparent 8px,
              rgba(212, 161, 10, 0.04) 8px, rgba(212, 161, 10, 0.04) 9px),
            rgba(212, 161, 10, 0.06);
          border: 1px solid rgba(212, 161, 10, 0.25);
          display: flex; gap: 10px; align-items: flex-start;
        }
        .kd-tip strong { color: #d4a10a; }

        /* ─── Animations ─── */
        @keyframes kd-slide-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes kd-toast-in {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes kd-spin { to { transform: rotate(360deg); } }
        @keyframes kd-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        @keyframes kd-bell {
          0%, 70%, 100% { transform: rotate(0deg); }
          10%, 30%, 50% { transform: rotate(-12deg); }
          20%, 40%, 60% { transform: rotate(12deg); }
        }
      `}</style>

      <div className="kd-wrapper" style={{ '--tab-accent': currentTab?.accent }}>

        {/* ═══════ HERO ═══════ */}
        <div className="kd-hero">
          <div className="kd-hero-content">
            <div className="kd-hero-emblem">⚙️</div>
            <div>
              <h1 className="kd-hero-title">Vos <em>Paramètres</em></h1>
              <p className="kd-hero-subtitle">
                <span className="kd-hero-dot"></span>
                {user?.display_name || user?.username} · gérez votre expérience Waiichia
              </p>
            </div>
          </div>
        </div>

        {/* ═══════ LAYOUT ═══════ */}
        <div className="kd-layout">

          {/* Nav verticale */}
          <nav className="kd-nav">
            {TABS.map(t => (
              <button
                key={t.key}
                className={`kd-nav-item ${tab === t.key ? 'active' : ''}`}
                onClick={() => { if (t.key === 'reports') { setPage('reports') } else { setTab(t.key); setMsg('') } }}
                style={{ '--tab-accent': t.accent }}
              >
                <div className="kd-nav-icon">{t.icon}</div>
                <div>
                  <div className="kd-nav-item-label">{t.label}</div>
                  <div className="kd-nav-item-desc">{t.desc}</div>
                </div>
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="kd-content" key={tab}>

            {/* ──── PROFIL ──── */}
            {tab === 'profile' && <>

              <div className="kd-card">
                <div className="kd-card-header">
                  <div className="kd-card-icon">📝</div>
                  <div>
                    <h2 className="kd-card-title">Informations personnelles</h2>
                    <p className="kd-card-desc">Ce que les autres utilisateurs voient de vous</p>
                  </div>
                </div>
                <div className="kd-card-body">
                  <div className="kd-field">
                    <label className="kd-label">Nom affiché</label>
                    <input className="kd-input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Votre nom d'artiste" />
                  </div>
                  <div className="kd-field">
                    <label className="kd-label">Biographie</label>
                    <textarea className="kd-input" value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={200} placeholder="Quelques mots sur vous, votre art, vos passions..." />
                    <div className="kd-hint" style={{ justifyContent: 'space-between' }}>
                      <span>✍️ Racontez votre histoire</span>
                      <span style={{ fontWeight: 700, color: bio.length > 180 ? '#c0392b' : 'var(--text2)' }}>{bio.length}/200</span>
                    </div>
                  </div>
                  <div className="kd-field">
                    <label className="kd-label">Pays</label>
                    <input className="kd-input" value={country} onChange={e => setCountry(e.target.value.toUpperCase())} placeholder="KM" maxLength={2} style={{ fontWeight: 700, fontSize: 16, letterSpacing: 2 }} />
                    <div className="kd-hint">🌍 Code ISO 2 lettres (KM · FR · MG · NG · CI · TZ...)</div>
                  </div>
                  <div className="kd-field">
                    <label className="kd-label">Adresse email</label>
                    <input className="kd-input" value={email} disabled />
                    <div className="kd-hint">🔒 L'email est verrouillé pour votre sécurité</div>
                  </div>
                  <button onClick={updateProfile} disabled={loading} className="kd-btn kd-btn-primary kd-btn-full">
                    {loading ? '⏳ Enregistrement...' : '✨ Enregistrer les modifications'}
                  </button>
                </div>
              </div>

              <div className="kd-card">
                <div className="kd-card-header">
                  <div className="kd-card-icon">🆔</div>
                  <div>
                    <h2 className="kd-card-title">Votre identité</h2>
                    <p className="kd-card-desc">Informations du compte</p>
                  </div>
                </div>
                <div className="kd-card-body">
                  <div className="kd-row">
                    <span className="kd-row-label">Nom d'utilisateur</span>
                    <span className="kd-row-value">@{user?.username}</span>
                  </div>
                  <div className="kd-row">
                    <span className="kd-row-label">Rôle</span>
                    <span className="kd-row-value">
                      {(user?.role === 'admin' || user?.role === 'superadmin') && <span className="kd-badge">👑 {user.role}</span>}
                      {user?.role === 'moderator' && <span className="kd-badge">🛡️ Modérateur</span>}
                      {(!user?.role || user?.role === 'user') && 'Utilisateur'}
                    </span>
                  </div>
                  <div className="kd-row">
                    <span className="kd-row-label">Statut</span>
                    <span className="kd-row-value">
                      {user?.is_verified
                        ? <span className="kd-badge kd-badge-verified">⭐ Vérifié</span>
                        : <span style={{ color: 'var(--text2)' }}>Non vérifié</span>}
                    </span>
                  </div>
                </div>
              </div>

            </>}

            {/* ──── SÉCURITÉ ──── */}
            {tab === 'security' && <>

              <div className="kd-card">
                <div className="kd-card-header">
                  <div className="kd-card-icon">🔑</div>
                  <div>
                    <h2 className="kd-card-title">Mot de passe</h2>
                    <p className="kd-card-desc">Protégez votre compte avec un mot de passe robuste</p>
                  </div>
                </div>
                <div className="kd-card-body">
                  <div className="kd-field">
                    <label className="kd-label">Ancien mot de passe</label>
                    <input className="kd-input" type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <div className="kd-field">
                    <label className="kd-label">Nouveau mot de passe</label>
                    <input className="kd-input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
                    <div className="kd-hint">🔐 Minimum 6 caractères — utilisez un mélange de lettres, chiffres, symboles</div>
                  </div>
                  <button onClick={changePassword} disabled={loading} className="kd-btn kd-btn-primary kd-btn-full">
                    {loading ? '⏳ Mise à jour...' : '🛡️ Mettre à jour le mot de passe'}
                  </button>
                </div>
              </div>

              <div className="kd-card">
                <div className="kd-card-header">
                  <div className="kd-card-icon">🚪</div>
                  <div>
                    <h2 className="kd-card-title">Session active</h2>
                    <p className="kd-card-desc">Déconnexion de cet appareil</p>
                  </div>
                </div>
                <div className="kd-card-body">
                  <button onClick={handleLogout} className="kd-btn kd-btn-danger kd-btn-full">
                    🚪 Se déconnecter
                  </button>
                </div>
              </div>

              <div className="kd-card kd-danger-card">
                <div className="kd-card-header">
                  <div className="kd-card-icon">⚠️</div>
                  <div>
                    <h2 className="kd-card-title">Zone sensible</h2>
                    <p className="kd-card-desc">Actions irréversibles sur votre compte</p>
                  </div>
                </div>
                <div className="kd-card-body">
                  <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
                    Pour supprimer définitivement votre compte et toutes vos données, contactez notre équipe à{' '}
                    <strong style={{ color: '#d4a10a' }}>support@waiichia.com</strong>. Cette action est <strong>irréversible</strong>.
                  </p>
                </div>
              </div>

            </>}

            {/* ──── NOTIFICATIONS ──── */}
            {tab === 'notifications' && <>

              <div className="kd-card">
                <div className="kd-card-header">
                  <div className="kd-card-icon">🔔</div>
                  <div>
                    <h2 className="kd-card-title">Notifications push</h2>
                    <p className="kd-card-desc">Restez connecté avec votre communauté, même hors de Waiichia</p>
                  </div>
                </div>
                <div className="kd-card-body">
                  {!pushSupported ? (
                    <div className="kd-tip" style={{ background: 'rgba(192,57,43,0.08)', borderColor: 'rgba(192,57,43,0.3)' }}>
                      <span>⚠️</span>
                      <span><strong style={{ color: '#c0392b' }}>Non supporté :</strong> votre navigateur ne gère pas les notifications. Utilisez Chrome, Firefox ou Edge récent.</span>
                    </div>
                  ) : (
                    <>
                      {pushPermission === 'denied' && (
                        <div className="kd-tip" style={{ background: 'rgba(192,57,43,0.08)', borderColor: 'rgba(192,57,43,0.3)', marginBottom: 14 }}>
                          <span>🚫</span>
                          <span><strong style={{ color: '#c0392b' }}>Bloquées :</strong> cliquez sur le 🔒 dans la barre d'adresse → Notifications → Autoriser</span>
                        </div>
                      )}

                      <div className={`kd-push-card ${pushEnabled ? 'active' : ''}`}>
                        <div className="kd-push-row">
                          <div className="kd-push-bell">{pushEnabled ? '🔔' : '🔕'}</div>
                          <div className="kd-push-info">
                            <div className="kd-push-title">
                              {pushEnabled ? 'Notifications activées' : 'Notifications inactives'}
                            </div>
                            <div className="kd-push-sub">
                              {pushEnabled ? 'Vous recevez les alertes en temps réel' : 'Activez pour être informé en direct'}
                            </div>
                          </div>
                          <button
                            onClick={togglePush}
                            disabled={pushLoading || pushPermission === 'denied'}
                            className={`kd-btn ${pushEnabled ? 'kd-btn-danger' : 'kd-btn-primary'}`}
                            style={{ opacity: (pushLoading || pushPermission === 'denied') ? 0.5 : 1 }}
                          >
                            {pushLoading ? '⏳' : pushEnabled ? 'Désactiver' : 'Activer'}
                          </button>
                        </div>
                      </div>

                      <div style={{ marginTop: 16 }}>
                        <div className="kd-tip">
                          <span>💡</span>
                          <span><strong>Astuce :</strong> les notifications fonctionnent même quand Waiichia est fermé. Vous pouvez les désactiver à tout moment.</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="kd-card">
                <div className="kd-card-header">
                  <div className="kd-card-icon">📋</div>
                  <div>
                    <h2 className="kd-card-title">Ce qui déclenche une alerte</h2>
                    <p className="kd-card-desc">Les événements qui vous enverront une notification</p>
                  </div>
                </div>
                <div className="kd-card-body">
                  {[
                    { icon: '👥', label: 'Nouveaux abonnés', desc: 'Quand quelqu\'un rejoint votre communauté', color: '#d4a10a' },
                    { icon: '💬', label: 'Commentaires', desc: 'Sur vos sons, albums et playlists', color: '#e8944a' },
                    { icon: '❤️', label: 'Réactions', desc: 'Likes et émojis sur vos contenus', color: '#c0392b' },
                    { icon: '🛒', label: 'Ventes boutique', desc: 'Achats de vos produits numériques', color: '#0e7c66' },
                    { icon: '💰', label: 'Pourboires', desc: 'Tips reçus sur la radio ou vos sons', color: '#d4a10a' },
                    { icon: '✉️', label: 'Messages privés', desc: 'Nouveaux messages dans votre boîte', color: '#e8944a' },
                  ].map((it, i) => (
                    <div key={i} className="kd-notif-item">
                      <div className="kd-notif-icon" style={{
                        background: `linear-gradient(135deg, ${it.color}25, ${it.color}08)`,
                        border: `1px solid ${it.color}40`
                      }}>{it.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div className="kd-notif-label">{it.label}</div>
                        <div className="kd-notif-desc">{it.desc}</div>
                      </div>
                      <div className="kd-notif-status" style={{
                        background: pushEnabled ? '#0e7c66' : '#999',
                        opacity: pushEnabled ? 1 : 0.3,
                        boxShadow: pushEnabled ? '0 0 8px #0e7c66' : 'none'
                      }} />
                    </div>
                  ))}
                </div>
              </div>

            </>}

            {/* ──── APPARENCE ──── */}
            {tab === 'appearance' && <>

              <div className="kd-card">
                <div className="kd-card-header">
                  <div className="kd-card-icon">🎨</div>
                  <div>
                    <h2 className="kd-card-title">Thème d'affichage</h2>
                    <p className="kd-card-desc">Choisissez l'ambiance qui vous correspond</p>
                  </div>
                </div>
                <div className="kd-card-body">
                  <div className="kd-theme-grid">
                    <button
                      className={`kd-theme-card light ${theme === 'light' ? 'active' : ''}`}
                      onClick={() => { if (theme !== 'light') toggleTheme() }}
                    >
                      <div className="kd-theme-orb">☀️</div>
                      <div className="kd-theme-name">Clair</div>
                      <div className="kd-theme-status">
                        {theme === 'light' ? '✓ Actuellement actif' : 'Ambiance jour'}
                      </div>
                    </button>
                    <button
                      className={`kd-theme-card dark ${theme === 'dark' ? 'active' : ''}`}
                      onClick={() => { if (theme !== 'dark') toggleTheme() }}
                    >
                      <div className="kd-theme-orb">🌙</div>
                      <div className="kd-theme-name">Sombre</div>
                      <div className="kd-theme-status">
                        {theme === 'dark' ? '✓ Actuellement actif' : 'Ambiance nuit'}
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="kd-card">
                <div className="kd-card-header">
                  <div className="kd-card-icon">🌍</div>
                  <div>
                    <h2 className="kd-card-title">Langue et région</h2>
                    <p className="kd-card-desc">Paramètres régionaux</p>
                  </div>
                </div>
                <div className="kd-card-body">
                  <div className="kd-row">
                    <span className="kd-row-label">Langue</span>
                    <span className="kd-row-value">🇫🇷 Français</span>
                  </div>
                  <div className="kd-row">
                    <span className="kd-row-label">Devise</span>
                    <span className="kd-row-value" style={{ color: 'var(--text2)', fontWeight: 500, fontSize: 12.5 }}>
                      → Via le menu en haut
                    </span>
                  </div>
                  <div className="kd-row">
                    <span className="kd-row-label">Fuseau horaire</span>
                    <span className="kd-row-value">Automatique</span>
                  </div>
                </div>
              </div>

              <div className="kd-card" style={{
                background: 'linear-gradient(135deg, rgba(212,161,10,0.08), rgba(232,148,74,0.08))',
                border: '1px dashed rgba(212,161,10,0.3)'
              }}>
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                    Waiichia
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 340, margin: '0 auto' }}>
                    L'Afrique qui sonne 🌍<br/>
                    La plateforme africaine pour créer, partager et vivre la musique.
                  </div>
                </div>
              </div>

            </>}

          </div>
        </div>

        {/* ═══════ TOAST ═══════ */}
        {msg && (
          <div className={`kd-toast ${isSuccess ? 'success' : 'error'}`}>
            {msg}
          </div>
        )}

      </div>
    </>
  )
}
