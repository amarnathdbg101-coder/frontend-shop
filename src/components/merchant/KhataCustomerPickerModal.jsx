import React, { useState, useEffect, useMemo } from 'react';
import { Search, UserCheck, UserPlus, X, Phone, ShieldCheck, AlertCircle, Sparkles, BookOpen } from 'lucide-react';
import { khataApi } from '../../api/khata.api';

export const KhataCustomerPickerModal = ({ isOpen, onClose, onSelectCustomer, currentTotal = 0 }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'new'

  // New customer quick form
  const [newName, setNewName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newCreditLimit, setNewCreditLimit] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await khataApi.getCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch khata customers:', err);
      setErrorMsg('Khata customers load karne me dikkat aayi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      setSearch('');
      setActiveTab('list');
      setErrorMsg('');
    }
  }, [isOpen]);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const name = (c.customer_name || c.name || '').toLowerCase();
      const phone = (c.customer_mobile || c.mobile || '').toLowerCase();
      const id = String(c.id || c.khata_id || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || id.includes(q);
    });
  }, [customers, search]);

  const handleSelect = (cust) => {
    onSelectCustomer({
      id: cust.id || cust.khata_id,
      name: cust.customer_name || cust.name || 'Grahak',
      phone: cust.customer_mobile || cust.mobile || '',
      current_balance: Number(cust.current_balance || cust.balance || 0),
      credit_limit: Number(cust.credit_limit || 0),
      trust_badge: cust.trust_badge || 'Silver',
      trust_score: cust.trust_score || 85,
    });
    onClose();
  };

  const handleCreateNewCustomer = (e) => {
    e.preventDefault();
    const name = newName.trim();
    const phone = newMobile.trim().replace(/[^0-9]/g, '').slice(-10);

    if (!name) {
      setErrorMsg('Grahak ka naam likhna zaroori hai');
      return;
    }

    // Auto-select and close
    onSelectCustomer({
      name: name,
      phone: phone || (phone ? phone : `TEMP-${Date.now().toString().slice(-6)}`),
      current_balance: 0,
      credit_limit: Number(newCreditLimit) || 0,
      trust_badge: 'New',
      trust_score: 90,
      isNew: true,
    });
    setNewName('');
    setNewMobile('');
    setNewCreditLimit('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Khata Grahak Chunein
              </h3>
              <p style={{ fontSize: '0.74rem', margin: 0, opacity: 0.85 }}>
                Bina mobile scan kiye 1-click me udhar jodein
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', padding: '10px 16px 0 16px', borderBottom: '1px solid #f1f5f9', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            style={{
              flex: 1,
              padding: '9px 12px',
              fontSize: '0.82rem',
              fontWeight: 700,
              backgroundColor: activeTab === 'list' ? 'var(--bg-surface-subtle, #f8fafc)' : 'transparent',
              color: activeTab === 'list' ? '#4f46e5' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'list' ? '2.5px solid #4f46e5' : '2.5px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <UserCheck size={16} />
            <span>Pehle Se Darj Grahak ({customers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('new')}
            style={{
              flex: 1,
              padding: '9px 12px',
              fontSize: '0.82rem',
              fontWeight: 700,
              backgroundColor: activeTab === 'new' ? 'var(--bg-surface-subtle, #f8fafc)' : 'transparent',
              color: activeTab === 'new' ? '#4f46e5' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'new' ? '2.5px solid #4f46e5' : '2.5px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <UserPlus size={16} />
            <span>+ Naya Grahak</span>
          </button>
        </div>

        {/* Tab 1: Existing Khata Customers List */}
        {activeTab === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Instant Search Bar */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '0 12px',
                }}
              >
                <Search size={16} color="#64748b" style={{ marginRight: '8px' }} />
                <input
                  type="text"
                  autoFocus
                  placeholder="Grahak ka naam ya phone number likhein..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    border: 'none',
                    backgroundColor: 'transparent',
                    outline: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Customers Scrollable List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b', fontSize: '0.85rem' }}>
                  Khata accounts load ho rahe hain...
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b' }}>
                  <AlertCircle size={32} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155' }}>
                    Koi grahak nahi mila
                  </div>
                  <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                    "{search}" naam ya number se koi khata darj nahi hai.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewName(search);
                      setActiveTab('new');
                    }}
                    className="btn btn-primary"
                    style={{ marginTop: '12px', fontSize: '0.78rem', padding: '6px 14px' }}
                  >
                    + "{search}" Ka Naya Khata Banayein
                  </button>
                </div>
              ) : (
                filteredCustomers.map((cust) => {
                  const name = cust.customer_name || cust.name || 'Grahak';
                  const mobile = cust.customer_mobile || cust.mobile || 'No Mobile';
                  const bal = Number(cust.current_balance || cust.balance || 0);
                  const limit = Number(cust.credit_limit || 0);
                  const initials = name.slice(0, 2).toUpperCase();

                  return (
                    <div
                      key={cust.id || cust.khata_id || mobile}
                      onClick={() => handleSelect(cust)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '14px',
                        border: '1.5px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#4f46e5';
                        e.currentTarget.style.backgroundColor = '#f5f3ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Avatar */}
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {initials}
                        </div>

                        {/* Details */}
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                            {name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Phone size={12} />
                            <span>{mobile}</span>
                          </div>
                        </div>
                      </div>

                      {/* Balance & Select */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 900, color: bal > 0 ? '#dc2626' : '#16a34a' }}>
                          ₹{bal.toLocaleString('en-IN')} {bal > 0 ? 'Baki' : 'Jama'}
                        </div>
                        {currentTotal > 0 && (
                          <div style={{ fontSize: '0.72rem', color: '#4338ca', fontWeight: 600, marginTop: '2px' }}>
                            Naya: ₹{(bal + currentTotal).toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Add New Quick Customer */}
        {activeTab === 'new' && (
          <form onSubmit={handleCreateNewCustomer} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '10px 14px', backgroundColor: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', color: '#1e40af', fontSize: '0.8rem' }}>
              Bina mobile phone mangwaye, yahan naam likh kar turant udhar bill banayein.
            </div>

            {errorMsg && (
              <div style={{ padding: '8px 12px', backgroundColor: '#fee2e2', borderRadius: '8px', color: '#b91c1c', fontSize: '0.78rem' }}>
                {errorMsg}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.78rem' }}>
                Grahak Ka Naam (Customer Name) *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Ramesh Kumar / Pinku Bhaiya"
                className="form-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.78rem' }}>
                Mobile Number (Optional)
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210 (Agar available ho)"
                className="form-input"
                value={newMobile}
                onChange={(e) => setNewMobile(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.78rem' }}>
                Credit Limit (Optional)
              </label>
              <input
                type="number"
                placeholder="e.g. 2000"
                className="form-input"
                value={newCreditLimit}
                onChange={(e) => setNewCreditLimit(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="submit"
                className="btn btn-primary btn-block"
                style={{ fontWeight: 800 }}
              >
                Grahak Chunein & Udhar Bill Banayein
              </button>
            </div>
          </form>
        )}

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 16px' }}
          >
            Band Karein
          </button>
        </div>
      </div>
    </div>
  );
};
