/**
 * Mandi Khareed & Market Procurement Order Management Screen
 * 
 * Features:
 * - LocalStorage persistence for offline Mandi visits
 * - Manual item entry (Item Name, Qty with units, Notes)
 * - 1-Click Import of Low Stock & Out-of-Stock items from inventory
 * - AI Smart Paste / Parchi parser (converts raw text notes into structured items)
 * - Interactive checklist toggle (bought vs pending)
 * - 1-Click WhatsApp Wholesale Order formatting for Mandi distributors
 * - Print / Export clean Mandi Order Sheet (Browser print & PDF)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Share2,
  Printer,
  Sparkles,
  Download,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  X,
  Package,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { inventoryApi } from '../../api/inventory.api';
import { aiApi } from '../../api/ai.api';

const STORAGE_KEY = 'shopme_procurement_items_v1';

export const ProcurementListScreen = () => {
  const navigate = useNavigate();
  const { shop } = useAuth();

  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiRawText, setAiRawText] = useState('');
  const [isParsingAi, setIsParsingAi] = useState(false);
  const [previewItems, setPreviewItems] = useState([]);

  const [isLoadingLowStock, setIsLoadingLowStock] = useState(false);

  // Load stored items on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch (e) {
      console.warn('Failed to load procurement items from localStorage:', e);
    }
  }, []);

  // Save items whenever modified
  const updateItems = (newItems) => {
    setItems(newItems);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.warn('Failed to save procurement items:', e);
    }
  };

  const handleAddItem = (e) => {
    if (e) e.preventDefault();
    if (!itemName.trim()) return;

    const newItem = {
      id: `proc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: itemName.trim(),
      qty: itemQty.trim() || '1',
      notes: itemNotes.trim() || '',
      completed: false,
      addedAt: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    };

    updateItems([newItem, ...items]);
    setItemName('');
    setItemQty('');
    setItemNotes('');
  };

  const handleToggleCompleted = (id) => {
    const updated = items.map((i) =>
      i.id === id ? { ...i, completed: !i.completed } : i
    );
    updateItems(updated);
  };

  const handleDeleteItem = (id) => {
    const updated = items.filter((i) => i.id !== id);
    updateItems(updated);
  };

  const handleClearCompleted = () => {
    if (window.confirm('Kya aap sabhi khareede huye items list se hatana chahte hain?')) {
      const remaining = items.filter((i) => !i.completed);
      updateItems(remaining);
    }
  };

  // Import Low Stock alerts from Inventory API
  const handleImportLowStock = async () => {
    try {
      setIsLoadingLowStock(true);
      const res = await inventoryApi.getLowStockAlerts();
      const rawList = res?.items || res?.data || res || [];

      if (!Array.isArray(rawList) || rawList.length === 0) {
        alert('Sabhi items ka stock theek hai! Koi low stock product nahi mila.');
        return;
      }

      // Filter out products already present in list
      const existingNames = new Set(items.map((i) => i.name.toLowerCase()));
      const newItems = [];

      rawList.forEach((prod) => {
        const title = prod.product_name || prod.name || prod.title;
        if (title && !existingNames.has(title.toLowerCase())) {
          newItems.push({
            id: `proc_low_${prod.id || Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: title,
            qty: '1 Reorder',
            notes: `Stock remaining: ${prod.stock_quantity ?? prod.available_quantity ?? 0}`,
            completed: false,
            addedAt: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          });
        }
      });

      if (newItems.length === 0) {
        alert('Low stock items pehle se aapki procurement list me shamil hain.');
        return;
      }

      updateItems([...newItems, ...items]);
      alert(`${newItems.length} low stock items Mandi list me jod diye gaye!`);
    } catch (err) {
      console.error('Low stock import error:', err);
      alert('Low stock items laane me dikkat aayi: ' + (err.message || 'Error'));
    } finally {
      setIsLoadingLowStock(false);
    }
  };

  // Parse Raw Text using AI or Regex Fallback
  const handleParseAi = async () => {
    const text = aiRawText.trim();
    if (!text) {
      alert('Kripya WhatsApp ya note ki list yahan paste karein.');
      return;
    }

    try {
      setIsParsingAi(true);
      let parsedItems = [];

      try {
        const aiRes = await aiApi.parseParchi(text);
        const list = aiRes?.matched_items || aiRes?.items || [];
        if (list.length > 0) {
          parsedItems = list.map((item) => ({
            name: item.name || item.product_name || item.raw_name,
            qty: `${item.quantity || 1} ${item.unit || ''}`.trim(),
            notes: item.notes || 'AI Parsed',
          }));
        }
      } catch (aiErr) {
        console.warn('AI endpoint fallback to regex parser:', aiErr);
      }

      // Fallback regex parsing if AI did not return items
      if (parsedItems.length === 0) {
        const lines = text.split(/[\n,;+]/).map((l) => l.trim()).filter(Boolean);
        parsedItems = lines.map((line) => {
          const match = line.match(/^(\d+(\.\d+)?\s*(kg|g|gm|packet|pkt|peti|box|pcs|lit|l|doz)?)\s+(.+)$/i);
          if (match) {
            return {
              name: match[4].trim(),
              qty: match[1].trim(),
              notes: 'Parchi',
            };
          }
          return {
            name: line,
            qty: '1',
            notes: 'Parchi',
          };
        });
      }

      setPreviewItems(parsedItems.filter((i) => i.name && i.name.length > 1));
    } catch (err) {
      alert('Parsing fail ho gaya: ' + err.message);
    } finally {
      setIsParsingAi(false);
    }
  };

  const handleSavePreview = () => {
    if (previewItems.length === 0) return;

    const formatted = previewItems.map((item, idx) => ({
      id: `proc_ai_${Date.now()}_${idx}`,
      name: item.name,
      qty: item.qty || '1',
      notes: item.notes || '',
      completed: false,
      addedAt: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    }));

    updateItems([...formatted, ...items]);
    setPreviewItems([]);
    setAiRawText('');
    setIsAiModalOpen(false);
    alert(`${formatted.length} items Mandi list me shamil ho gaye!`);
  };

  // WhatsApp Order Generator
  const handleWhatsAppOrder = () => {
    if (items.length === 0) {
      alert('Aapki Mandi list khali hai.');
      return;
    }

    const pending = items.filter((i) => !i.completed);
    const targetItems = pending.length > 0 ? pending : items;

    let text = `📦 *Mandi Khareed & Wholesale Order Sheet*\n`;
    text += `Dukan: *${shop?.name || 'ShopMe Merchant'}*\n`;
    text += `Tareekh: ${new Date().toLocaleDateString('en-IN')}\n\n`;
    text += `*KHAREEDNE WALE ITEMS (${targetItems.length}):*\n`;

    targetItems.forEach((item, idx) => {
      text += `${idx + 1}. ${item.name} — Qty: *${item.qty}*${item.notes ? ` (${item.notes})` : ''}\n`;
    });

    text += `\nKripya wholesale rates aur delivery uplabdhta confirm karein. Dhanyawad!`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Print Mandi Sheet
  const handlePrintSheet = () => {
    if (items.length === 0) {
      alert('Print karne ke liye koi item nahi hai.');
      return;
    }

    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (!printWin) {
      window.print();
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Mandi Khareed Sheet - ${shop?.name || 'ShopMe'}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #1e293b; line-height: 1.5; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: 800; margin: 0; text-transform: uppercase; }
          .meta { font-size: 13px; color: #64748b; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 13px; }
          th { background-color: #f1f5f9; font-weight: 700; }
          .checkbox-cell { width: 40px; text-align: center; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
          .sign-line { border-top: 1px dashed #94a3b8; width: 180px; text-align: center; padding-top: 6px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${shop?.name || 'ShopMe Merchant'}</div>
          <div style="font-weight: 700; font-size: 15px; margin-top: 2px;">MANDI KHAREED & PROCUREMENT SHEET</div>
          <div class="meta">Tareekh: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} | Kul Items: ${items.length}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="checkbox-cell">Tick</th>
              <th style="width: 40px;">S.No</th>
              <th>Product / Saman Ka Naam</th>
              <th style="width: 120px;">Khareed Matra (Qty)</th>
              <th>Dealer / Mandi Notes</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, idx) => `
              <tr>
                <td class="checkbox-cell">□</td>
                <td>${idx + 1}</td>
                <td><strong>${item.name}</strong></td>
                <td>${item.qty}</td>
                <td>${item.notes || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>Generated via ShopMe Dukan OS</div>
          <div class="sign-line">Mandi Dealer Signature</div>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    printWin.document.write(html);
    printWin.document.close();
  };

  const totalCount = items.length;
  const completedCount = items.filter((i) => i.completed).length;
  const pendingCount = totalCount - completedCount;

  return (
    <AppLayout title="Mandi Khareed Suchi" subtitle="Wholesale Market Purchase & Reorder Manager">
      <title>Mandi Procurement List — ShopMe Dukan OS</title>

      {/* Top Banner / Actions Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(2, 132, 199, 0.12)',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ClipboardList size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              Mandi Khareed & Procurement List
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Mandi jane se pehle saman ki list banayein ya WhatsApp dealer ko bheinjein
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleImportLowStock}
            disabled={isLoadingLowStock}
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px', fontWeight: 700 }}
            title="Import items with low stock from inventory"
          >
            <RefreshCw size={14} className={isLoadingLowStock ? 'spin' : ''} />
            <span>Low Stock Import</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{
              gap: '6px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
              borderColor: 'rgba(99, 102, 241, 0.25)',
              color: 'var(--color-primary)',
            }}
          >
            <Sparkles size={14} />
            <span>AI Smart Paste</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppOrder}
            disabled={items.length === 0}
            className="btn btn-success btn-sm"
            style={{ gap: '6px', fontWeight: 800 }}
          >
            <Share2 size={14} />
            <span>WhatsApp Order</span>
          </button>

          <button
            type="button"
            onClick={handlePrintSheet}
            disabled={items.length === 0}
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px', fontWeight: 700 }}
          >
            <Printer size={14} />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div className="card" style={{ padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Items</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)' }}>{totalCount}</div>
        </div>

        <div className="card" style={{ padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-warning)', fontWeight: 600 }}>Khareedna Baaki</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-warning)' }}>{pendingCount}</div>
        </div>

        <div className="card" style={{ padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-success)', fontWeight: 600 }}>Khareed Liya (Bought)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-success)' }}>{completedCount}</div>
        </div>
      </div>

      {/* Add Item Input Form */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '16px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
          + Naya Item Jodein
        </div>
        <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Item ka naam (jaise: Aaloo, Amul Butter, Tata Namak)"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            style={{
              flex: '2 1 200px',
              padding: '9px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.86rem',
              fontWeight: 600,
            }}
          />
          <input
            type="text"
            placeholder="Matra / Qty (e.g. 10kg, 2 peti, 5 pkt)"
            value={itemQty}
            onChange={(e) => setItemQty(e.target.value)}
            style={{
              flex: '1 1 120px',
              padding: '9px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.86rem',
              fontWeight: 600,
            }}
          />
          <input
            type="text"
            placeholder="Notes (e.g. Shyam Dealer, A-Grade)"
            value={itemNotes}
            onChange={(e) => setItemNotes(e.target.value)}
            style={{
              flex: '1 1 120px',
              padding: '9px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.86rem',
              fontWeight: 600,
            }}
          />
          <button
            type="submit"
            disabled={!itemName.trim()}
            className="btn btn-primary"
            style={{ gap: '6px', fontWeight: 700, padding: '9px 18px' }}
          >
            <Plus size={16} />
            <span>List Me Jodein</span>
          </button>
        </form>
      </div>

      {/* Procurement Items List */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Khareed Suchi ({items.length})
          </div>
          {completedCount > 0 && (
            <button
              type="button"
              onClick={handleClearCompleted}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.74rem', padding: '4px 10px', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              Clear Completed ({completedCount})
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <ClipboardList size={40} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Procurement list abhi khali hai
            </div>
            <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
              Upar diye gaye form se saman jodein ya Low Stock Import dabayein.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: item.completed ? 'var(--bg-surface-subtle)' : 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  opacity: item.completed ? 0.65 : 1,
                  transition: 'all 0.15s ease',
                  gap: '12px',
                }}
              >
                {/* Checkbox Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleCompleted(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    color: item.completed ? 'var(--color-success)' : 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                  title={item.completed ? 'Mark as pending' : 'Mark as purchased'}
                >
                  {item.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>

                {/* Item Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      color: 'var(--text-primary)',
                      textDecoration: item.completed ? 'line-through' : 'none',
                    }}
                  >
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Qty: {item.qty}</span>
                    {item.notes && <span>• {item.notes}</span>}
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                  }}
                  title="Delete item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Smart Paste Modal */}
      {isAiModalOpen && (
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
          onClick={() => setIsAiModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: '540px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--color-primary)" />
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  AI Smart Paste (Parchi Parser)
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              WhatsApp ya notebook se copy ki gayi list yahan paste karein. AI apne aap har item aur uski matra (quantity) alag kar dega.
            </div>

            <textarea
              rows={5}
              placeholder="Jaise:&#10;5kg aaloo&#10;10kg pyaz&#10;2 peti amul butter&#10;tata salt 1kg 5 packet"
              value={aiRawText}
              onChange={(e) => setAiRawText(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.86rem',
                fontFamily: 'monospace',
                marginBottom: '12px',
              }}
            />

            <button
              type="button"
              onClick={handleParseAi}
              disabled={isParsingAi || !aiRawText.trim()}
              className="btn btn-primary btn-block"
              style={{ gap: '6px', fontWeight: 800, marginBottom: '14px' }}
            >
              {isParsingAi ? <RefreshCw size={16} className="spin" /> : <Sparkles size={16} />}
              <span>{isParsingAi ? 'AI Parse Kar Raha Hai...' : 'List Parse Karein'}</span>
            </button>

            {/* Preview Parsed Items */}
            {previewItems.length > 0 && (
              <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Parsed Items Preview ({previewItems.length}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', marginBottom: '14px' }}>
                  {previewItems.map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-surface-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.82rem',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</span>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{p.qty}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleSavePreview}
                  className="btn btn-success btn-block"
                  style={{ gap: '6px', fontWeight: 800 }}
                >
                  <CheckCircle2 size={16} />
                  <span>Mandi List Me Save Karein ({previewItems.length})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
};
