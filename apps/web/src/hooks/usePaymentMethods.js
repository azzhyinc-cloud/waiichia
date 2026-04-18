// src/hooks/usePaymentMethods.js
// Hook qui charge les méthodes de paiement actives depuis la config admin
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

// Labels lisibles pour chaque méthode
const METHOD_LABELS = {
  mvola:        { label: 'Mvola',        icon: '📱', type: 'mobile' },
  orange_money: { label: 'Orange Money', icon: '🟠', type: 'mobile' },
  cash:         { label: 'Espèces',      icon: '💵', type: 'cash'   },
  bank:         { label: 'Virement bancaire', icon: '🏦', type: 'bank' },
  paypal:       { label: 'PayPal',       icon: '🅿️', type: 'online' },
  wave:         { label: 'Wave',         icon: '🌊', type: 'mobile' },
  mpesa:        { label: 'M-Pesa',       icon: '💚', type: 'mobile' },
  stripe:       { label: 'Carte bancaire', icon: '💳', type: 'online' },
};

export function usePaymentMethods() {
  const [methods, setMethods]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('waiichia_token');
    fetch(`${API_URL}/api/payments/methods`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => {
        if (!r.ok) throw new Error('Erreur chargement méthodes');
        return r.json();
      })
      .then(data => {
        const enriched = (data.methods || []).map(m => ({
          ...m,
          ...(METHOD_LABELS[m.key] || { label: m.name || m.key, icon: '💰', type: 'other' }),
          // On préserve le label admin s'il est défini
          label: m.name || METHOD_LABELS[m.key]?.label || m.key,
        }));
        setMethods(enriched);
      })
      .catch(err => {
        console.warn('[usePaymentMethods] fallback vide:', err.message);
        setError(err.message);
        setMethods([]); // Pas de méthodes en dur si l'API échoue
      })
      .finally(() => setLoading(false));
  }, []);

  // Méthodes filtrées par type
  const mobileOnly = methods.filter(m => m.type === 'mobile');
  const bankOnly   = methods.filter(m => m.type === 'bank');
  const onlineOnly = methods.filter(m => m.type === 'online');

  return { methods, mobileOnly, bankOnly, onlineOnly, loading, error };
}
