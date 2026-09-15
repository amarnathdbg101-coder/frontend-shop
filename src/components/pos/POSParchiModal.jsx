import React, { useState } from 'react';
import {
  FileText,
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Plus,
  RefreshCw,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';
import { aiApi } from '../../api/ai.api';
import { playSoundboxTone } from '../../utils/soundbox';

export const POSParchiModal = ({ isOpen, onClose, inventory = [], onImportItems, onOpenMandiList }) => {
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [matchedItems, setMatchedItems] = useState([]);
  const [unmatchedLines, setUnmatchedLines] = useState([]);
  const [hasParsed, setHasParsed] = useState(false);

  const handleParse = async () => {
    const text = rawText.trim();
    if (!text) {
      alert('Kripya customer ka WhatsApp message ya parchi yahan paste karein.');
      return;
    }

    try {
      setIsParsing(true);
      setHasParsed(true);

      let parsedList = [];
      let unmatchedList = [];

      try {
        const aiRes = await aiApi.parseParchi(text);
        parsedList = aiRes?.matched_items || aiRes?.items || [];
        unmatchedList = aiRes?.unmatched_text || [];
      } catch (aiErr) {
        console.warn('AI parchi endpoint fallback to local matcher:', aiErr);
      }

      // If backend didn't parse or had fallback
      if (parsedList.length === 0) {
        const lines = text.split(/[\n,;+]/).map((l) => l.trim()).filter(Boolean);
        for (const line of lines) {
          const match = line.match(/^(\d+(\.\d+)?\s*(kg|g|gm|packet|pkt|peti|box|pcs|lit|l|doz)?)\s+(.+)$/i);
          const searchName = match ? match[4].trim().toLowerCase() : line.toLowerCase();
          const qty = match ? parseFloat(match[1]) || 1 : 1;

          const found = inventory.find((p) => {
            const pName = (p.name || p.title || '').toLowerCase();
            return searchName.split(' ').some((w) => w.length >= 2 && pName.includes(w));
          });

          if (found) {
            parsedList.push({
              product: found,
              quantity: qty,
              unitPrice: found.price || 0,
              totalPrice: (found.price || 0) * qty,
            });
          } else {
            unmatchedList.push(line);
          }
        }
      } else {
        // Map backend matched items to store inventory products
        const mapped = [];
        for (const p of parsedList) {
          const pName = (p.name || p.product_name || p.raw_name || '').toLowerCase();
          const found = inventory.find((inv) =>
            (inv.name || '').toLowerCase().includes(pName) || pName.includes((inv.name || '').toLowerCase())
          );

          if (found) {
            const qty = Number(p.quantity) || 1;
            mapped.push({
              product: found,
              quantity: qty,
              unitPrice: found.price || 0,
              totalPrice: (found.price || 0) * qty,
            });
          } else {
            unmatchedList.push(p.name || p.product_name || 'Item');
          }
        }
        parsedList = mapped;
      }

      setMatchedItems(parsedList);
      setUnmatchedLines(unmatchedList);
    } catch (err) {
      alert('Parchi parsing error: ' + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImportToCart = () => {
    if (matchedItems.length === 0) return;
    if (onImportItems) {
      onImportItems(matchedItems);
    }
    playSoundboxTone('credit');
    handleClose();
  };

  const handleClose = () => {
    setRawText('');
    setMatchedItems([]);
    setUnmatchedLines([]);
    setHasParsed(false);
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
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '560px',
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
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                Paste WhatsApp Grocery Parchi
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                Grahak ki WhatsApp parchi paste karein aur turant counter cart banayein
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
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

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '14px' }}>
            <textarea
              rows={5}
              placeholder="e.g.&#10;2kg basmati chawal&#10;500g toor dal&#10;1 packet surf excel&#10;2 amul butter"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.86rem',
                fontFamily: 'monospace',
                marginBottom: '10px',
              }}
            />

            <button
              type="button"
              onClick={handleParse}
              disabled={isParsing || !rawText.trim()}
              className="btn btn-primary btn-block"
              style={{ gap: '6px', fontWeight: 800 }}
            >
              {isParsing ? <RefreshCw size={16} className="spin" /> : <Sparkles size={16} />}
              <span>{isParsing ? 'Parchi Analyze Ho Rahi Hai...' : 'Parchi Convert Karein'}</span>
            </button>
          </div>

          {/* Parsed Output */}
          {hasParsed && (
            <div>
              {matchedItems.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-success)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} />
                    <span>Dukan Ke Stock Se Match Huye ({matchedItems.length}):</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', marginBottom: '12px' }}>
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

                  <button
                    type="button"
                    onClick={handleImportToCart}
                    className="btn btn-success btn-block"
                    style={{ gap: '8px', fontWeight: 800, padding: '11px' }}
                  >
                    <Plus size={18} />
                    <span>Cart Me Add Karein ({matchedItems.length} Items)</span>
                  </button>
                </div>
              )}

              {unmatchedLines.length > 0 && (
                <div style={{ marginTop: '12px', padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#d97706', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={14} />
                    <span>Yeh items dukan ke catalog me nahi mile ({unmatchedLines.length}):</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                    {unmatchedLines.map((u, idx) => (
                      <span
                        key={idx}
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-full)',
                          padding: '2px 8px',
                          fontSize: '0.74rem',
                        }}
                      >
                        {u}
                      </span>
                    ))}
                  </div>

                  {onOpenMandiList && (
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        onOpenMandiList();
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '6px', fontSize: '0.75rem' }}
                    >
                      <ClipboardList size={14} />
                      <span>Inhe Mandi Procurement List Me Jodein</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
