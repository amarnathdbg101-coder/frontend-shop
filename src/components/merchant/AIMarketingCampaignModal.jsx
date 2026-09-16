import React, { useState } from 'react';
import { X, Sparkles, MessageCircle, Copy, Check, Send } from 'lucide-react';
import { aiApi } from '../../api/ai.api';
import { useAuth } from '../../context/AuthContext';

const CAMPAIGN_TYPES = [
  'Festival Dhamaka (Diwali / Eid / Chhath)',
  'Weekend Super Saver Sale',
  'Clearance / Stock Clearance Discount',
  'New Stock / Fresh Arrival Alert',
  'Loyal Customer Exclusive Cashback',
];

export const AIMarketingCampaignModal = ({ isOpen, onClose }) => {
  const { shop } = useAuth();
  const [campaignType, setCampaignType] = useState(CAMPAIGN_TYPES[0]);
  const [discountPercent, setDiscountPercent] = useState('15');
  const [festivalName, setFestivalName] = useState('Diwali Special');
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await aiApi.generateMarketingCampaign({
        campaign_type: campaignType,
        festival_name: festivalName,
        discount_percent: Number(discountPercent),
        target_audience: 'Neighborhood Local Customers',
      });
      const resultText = res.campaign_text || res.message || res.text ||
        `🎉 ${festivalName.toUpperCase()} DHAMAKA SALE at ${shop?.name || 'Local Store'}!\n\n🔥 Get flat ${discountPercent}% OFF on all grocery & essentials this week.\n📍 Store Address: ${shop?.address || 'Local Market'}\n📲 Order / Reserve now on ShopMe: ${window.location.origin}/shop/${shop?.slug || 'store'}\n\nLimited stock. Visit today!`;
      setGeneratedText(resultText);
    } catch (err) {
      const fallback = `🎉 ${festivalName.toUpperCase()} DHAMAKA SALE at ${shop?.name || 'Local Store'}!\n\n🔥 Get flat ${discountPercent}% OFF on all items.\n📍 Address: ${shop?.address || 'Local Market'}\n📲 Reserve on ShopMe: ${window.location.origin}/shop/${shop?.slug || 'store'}`;
      setGeneratedText(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(generatedText)}`, '_blank');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-surface, #1e293b)',
          border: '1px solid var(--border-subtle, #334155)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.5rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', padding: '8px', borderRadius: '10px' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>AI Marketing Campaign Generator</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>1-Tap WhatsApp broadcasts for local shoppers</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
              Select Campaign Theme
            </label>
            <select
              value={campaignType}
              onChange={(e) => setCampaignType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
              }}
            >
              {CAMPAIGN_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                Festival / Event Name
              </label>
              <input
                type="text"
                value={festivalName}
                onChange={(e) => setFestivalName(e.target.value)}
                placeholder="e.g. Diwali Dhamaka"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                Discount % Offered
              </label>
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder="15"
                min={1}
                max={90}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Sparkles size={18} />
            {loading ? 'AI Generating Message...' : 'Generate WhatsApp Campaign'}
          </button>
        </form>

        {generatedText && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Generated Campaign Broadcast Text:
            </label>
            <textarea
              rows={6}
              value={generatedText}
              onChange={(e) => setGeneratedText(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                marginBottom: '1rem',
              }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                onClick={handleCopy}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {copied ? <Check size={16} color="#22c55e" /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>

              <button
                onClick={handleShareWhatsApp}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#25D366',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <MessageCircle size={16} />
                Send via WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
