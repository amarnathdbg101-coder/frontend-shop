import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Plus,
  RefreshCw,
  Package,
} from 'lucide-react';
import { playSoundboxTone } from '../../utils/soundbox';

const SAMPLE_COMMANDS = [
  '2 packet maggi aur 1 namak',
  'Do dettol sabun aur 1kg cheeni',
  'Aadha kilo toor dal',
  '1 Surf excel aur 2 parle-g',
];

export const AIVoicePOSModal = ({ isOpen, onClose, inventory = [], onAddItems }) => {
  const [spokenText, setSpokenText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchedItems, setMatchedItems] = useState([]);
  const [unmatchedParts, setUnmatchedParts] = useState([]);
  const [hasParsed, setHasParsed] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setSpokenText('');
      setMatchedItems([]);
      setUnmatchedParts([]);
      setHasParsed(false);
      setIsAnalyzing(false);
    }
  }, [isOpen]);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Aapke browser me speech recognition support nahi hai. Kripya counter command type karein.');
      return;
    }

    try {
      const reco = new SpeechRecognition();
      reco.continuous = false;
      reco.interimResults = false;
      reco.lang = 'hi-IN';

      reco.onstart = () => setIsListening(true);
      reco.onend = () => setIsListening(false);
      reco.onerror = (e) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
      };

      reco.onresult = (event) => {
        const text = event.results[0]?.[0]?.transcript || '';
        if (text) {
          setSpokenText(text);
          parseSpokenText(text);
        }
      };

      recognitionRef.current = reco;
      reco.start();
    } catch (e) {
      console.warn('Speech recognition startup error:', e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const parseSpokenText = (raw) => {
    const text = (raw || spokenText).trim();
    if (!text) return;

    setIsAnalyzing(true);
    setHasParsed(true);

    const parts = text.toLowerCase().split(/\baur\b|\band\b|,|\+/);
    const matched = [];
    const unmatched = [];

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      let qty = 1;
      const numMatch = trimmed.match(/(\d+(\.\d+)?)/);
      if (numMatch) {
        qty = parseFloat(numMatch[1]) || 1;
      } else if (trimmed.includes('do ') || trimmed.includes('double')) {
        qty = 2;
      } else if (trimmed.includes('teen')) {
        qty = 3;
      } else if (trimmed.includes('chaar')) {
        qty = 4;
      } else if (trimmed.includes('paanch')) {
        qty = 5;
      } else if (trimmed.includes('aadha') || trimmed.includes('adha')) {
        qty = 0.5;
      }

      // Match item from inventory
      const foundProd = inventory.find((p) => {
        const pName = (p.name || p.title || '').toLowerCase();
        const pBrand = (p.brand || '').toLowerCase();
        const words = trimmed.split(' ').filter((w) => w.length >= 2);
        return words.some((w) => pName.includes(w) || pBrand.includes(w));
      });

      if (foundProd) {
        matched.push({
          product: foundProd,
          quantity: qty,
          unitPrice: foundProd.price || 0,
          totalPrice: (foundProd.price || 0) * qty,
        });
      } else {
        unmatched.push(trimmed);
      }
    }

    setMatchedItems(matched);
    setUnmatchedParts(unmatched);
    setIsAnalyzing(false);
  };

  const handleAddToCart = () => {
    if (matchedItems.length === 0) return;

    if (onAddItems) {
      onAddItems(matchedItems);
    }
    playSoundboxTone('credit');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              }}
            >
              <Mic size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                AI Voice POS Billing
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                Bolein aur samano ko turant POS counter cart me jodein
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-surface-subtle)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto' }}>
          {/* Voice Input Mic Visualizer */}
          <div
            style={{
              textAlign: 'center',
              padding: '24px 16px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: isListening ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-surface-subtle)',
              border: isListening ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-subtle)',
              marginBottom: '16px',
            }}
          >
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: isListening ? '#ef4444' : 'var(--color-primary)',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
                cursor: 'pointer',
                boxShadow: isListening ? '0 0 20px rgba(239, 68, 68, 0.5)' : '0 6px 16px rgba(79, 70, 229, 0.35)',
                transition: 'all 0.2s ease',
              }}
              title={isListening ? 'Stop listening' : 'Start speaking'}
            >
              {isListening ? <MicOff size={28} /> : <Mic size={28} />}
            </button>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {isListening ? 'Aapki aawaz sun rahe hain...' : 'Mic dabayein aur counter items bolein'}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {isListening ? 'Jaise: "2 packet maggi aur 1kg chini"' : 'Hindi / English me boliye'}
            </div>
          </div>

          {/* Spoken Text Box */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Spoken command ya type karein (e.g. 2 packet maggi aur 1kg chini)..."
                value={spokenText}
                onChange={(e) => setSpokenText(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                }}
              />
              <button
                type="button"
                onClick={() => parseSpokenText()}
                disabled={!spokenText.trim() || isAnalyzing}
                className="btn btn-primary"
                style={{ padding: '0 16px', fontWeight: 700 }}
              >
                {isAnalyzing ? <RefreshCw size={16} className="spin" /> : 'Parse'}
              </button>
            </div>

            {/* Quick Sample Pills */}
            {!hasParsed && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  SAMPLE COMMANDS:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {SAMPLE_COMMANDS.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSpokenText(sug);
                        parseSpokenText(sug);
                      }}
                      style={{
                        backgroundColor: 'var(--bg-surface-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-full)',
                        padding: '4px 10px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results: Matched and Unmatched */}
          {hasParsed && (
            <div>
              {matchedItems.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-success)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} />
                    <span>Matched Items ({matchedItems.length}):</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {matchedItems.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--bg-surface-subtle)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.84rem',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.product.name}</span>
                          <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>Qty: {m.quantity}</span>
                        </div>
                        <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                          ₹{m.totalPrice}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {unmatchedParts.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-warning)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} />
                    <span>Not in Inventory:</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {unmatchedParts.map((u, idx) => (
                      <span
                        key={idx}
                        style={{
                          backgroundColor: 'rgba(245, 158, 11, 0.1)',
                          color: '#d97706',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          borderRadius: 'var(--radius-full)',
                          padding: '2px 10px',
                          fontSize: '0.74rem',
                        }}
                      >
                        "{u}"
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {matchedItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="btn btn-primary btn-block"
                  style={{ gap: '8px', fontWeight: 800, padding: '11px' }}
                >
                  <Plus size={18} />
                  <span>Cart Me Jodein ({matchedItems.length} Items)</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
