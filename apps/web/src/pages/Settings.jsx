import { useState, useEffect } from 'react'
import { useAuthStore, usePageStore, useThemeStore } from '../stores/index.js'
import api from '../services/api.js'
import { isPushSupported, subscribeToPush, unsubscribeFromPush, isPushSubscribed, getNotificationPermission } from '../services/push.js'

export default function Settings() {
  const { user, token, loadMe, logout, setUser } = useAuthStore()
  const { setPage } = usePageStore()
  const { theme, toggle: toggleTheme } = useThemeStore()
  const [tab, setTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  // Profile fields
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [country, setCountry] = useState(user?.country || '')
  const [email, setEmail] = useState(user?.email || '')

  // Password
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Push
  const [pushSupported, setPushSupported] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [pushPermission, setPushPermission] = useState('default')

  useEffect(() => {
    checkPushStatus()
  }, [])

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
    setLoading(true)
    setMsg('')
    try {
      const res = await api.patch('/api/profiles/me', {
        display_name: displayName,
        bio,
        country
      }, { headers: { Authorization: `Bearer ${token}` } })
      setUser({ ...user, ...res.data })
      setMsg('✅ Profil mis à jour !')
    } catch (e) {
      setMsg('❌ ' + (e.response?.data?.error || 'Erreur'))
    }
    setLoading(false)
  }

  const changePassword = async () => {
    if (!oldPassword || !newPassword) return setMsg('Remplissez les deux champs')
    if (newPassword.length < 6) return setMsg('Le nouveau mot de passe doit faire au moins 6 caractères')
    setLoading(true)
    setMsg('')
    try {
      await api.post('/api/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      }, { headers: { Authorization: `Bearer ${token}` } })
      setMsg('✅ Mot de passe changé !')
      setOldPassword('')
      setNewPassword('')
    } catch (e) {
      setMsg('❌ ' + (e.response?.data?.error || 'Erreur'))
    }
    setLoading(false)
  }

  const togglePush = async () => {
    setPushLoading(true)
    try {
      if (pushEnabled) {
        const success = await unsubscribeFromPush(token)
        if (success) {
          setPushEnabled(false)
          setMsg('🔕 Notifications push désactivées')
        } else {
          setMsg('❌ Erreur désactivation push')
        }
      } else {
        const success = await subscribeToPush(token)
        if (success) {
          setPushEnabled(true)
          setMsg('🔔 Notifications push activées !')
        } else {
          const perm = getNotificationPermission()
          setPushPermission(perm)
          if (perm === 'denied') {
            setMsg('❌ Notifications bloquées dans votre navigateur. Réactivez-les dans les paramètres du navigateur.')
          } else {
            setMsg('❌ Erreur activation push')
          }
        }
      }
    } catch (e) {
      setMsg('❌ Erreur push')
    }
    setPushLoading(false)
  }

  const handleLogout = () => {
    logout()
    setPage('home')
  }

  const tabs = [
    { key: 'profile', label: '👤 Profil' },
    { key: 'security', label: '🔒 Sécurité' },
    { key: 'notifications', label: '🔔 Notifications' },
    { key: 'appearance', label: '🎨 Apparence' },
  ]

  return (
    <div style={{ padding: '1rem', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1rem' }}>⚙️ Paramètres</h1>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setMsg('') }}
            style={{
              padding: '0.5rem 0.8rem', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap',
              background: tab === t.key ? 'var(--accent)' : 'var(--card)',
              color: tab === t.key ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && (
        <div style={{ padding: '0.6rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem', background: msg.startsWith('✅') || msg.startsWith('🔔') || msg.startsWith('🔕') ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: msg.startsWith('✅') || msg.startsWith('🔔') || msg.startsWith('🔕') ? '#22c55e' : '#ef4444' }}>
          {msg}
        </div>
      )}

      <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)', padding: '1.2rem' }}>
        {/* PROFIL */}
        {tab === 'profile' && (
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1rem' }}>Modifier le profil</h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Nom affiché</label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Pays</label>
              <input
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="ex: KM, FR, MG..."
                style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Email</label>
              <input
                value={email}
                disabled
                style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.9rem', boxSizing: 'border-box', opacity: 0.7 }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>L'email ne peut pas être modifié</p>
            </div>

            <button
              onClick={updateProfile}
              disabled={loading}
              style={{ width: '100%', padding: '0.7rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Enregistrement...' : '💾 Enregistrer'}
            </button>
          </div>
        )}

        {/* SÉCURITÉ */}
        {tab === 'security' && (
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1rem' }}>Sécurité</h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Ancien mot de passe</label>
              <input
                type="password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Nouveau mot de passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>

            <button
              onClick={changePassword}
              disabled={loading}
              style={{ width: '100%', padding: '0.7rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.5rem', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Changement...' : '🔒 Changer le mot de passe'}
            </button>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.5rem 0' }} />

            <button
              onClick={handleLogout}
              style={{ width: '100%', padding: '0.7rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem' }}
            >
              🚪 Se déconnecter
            </button>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {tab === 'notifications' && (
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1rem' }}>Notifications push</h2>

            {!pushSupported ? (
              <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                ⚠️ Les notifications push ne sont pas supportées par votre navigateur.
                <br /><br />
                Utilisez un navigateur récent (Chrome, Firefox, Edge) pour activer cette fonctionnalité.
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                  Recevez des notifications en temps réel quand quelqu'un vous suit, commente vos sons, ou vous envoie un message.
                </p>

                {pushPermission === 'denied' && (
                  <div style={{ padding: '0.8rem', background: 'rgba(239,68,68,0.1)', borderRadius: 8, color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    ❌ Les notifications sont bloquées dans votre navigateur.
                    <br />Pour les réactiver, allez dans les paramètres de votre navigateur → Notifications → Autoriser pour waiichia.com
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 10, marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)' }}>
                      {pushEnabled ? '🔔 Notifications activées' : '🔕 Notifications désactivées'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {pushEnabled ? 'Vous recevrez des notifications push' : 'Activez pour recevoir des alertes'}
                    </div>
                  </div>
                  <button
                    onClick={togglePush}
                    disabled={pushLoading || pushPermission === 'denied'}
                    style={{
                      padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                      background: pushEnabled ? '#ef4444' : 'var(--accent)',
                      color: '#fff',
                      opacity: (pushLoading || pushPermission === 'denied') ? 0.5 : 1
                    }}
                  >
                    {pushLoading ? '...' : pushEnabled ? 'Désactiver' : 'Activer'}
                  </button>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  💡 Les notifications push fonctionnent même quand l'application est fermée.
                  Vous pouvez les désactiver à tout moment.
                </div>
              </div>
            )}
          </div>
        )}

        {/* APPARENCE */}
        {tab === 'appearance' && (
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1rem' }}>Apparence</h2>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)' }}>Mode sombre</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {theme === 'dark' ? 'Activé' : 'Désactivé'}
                </div>
              </div>
              <button
                onClick={toggleTheme}
                style={{
                  width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', position: 'relative',
                  background: theme === 'dark' ? 'var(--accent)' : '#ccc', transition: 'background 0.2s'
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3,
                  left: theme === 'dark' ? 27 : 3, transition: 'left 0.2s'
                }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
