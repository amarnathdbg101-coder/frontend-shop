import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Trash2, Key, Phone, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { staffApi } from '../../api/staff.api';
import { useAuth } from '../../context/AuthContext';

export const StaffManagementModal = ({ isOpen, onClose }) => {
  const { shop } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState('cashier');
  const [submitting, setSubmitting] = useState(false);

  const loadStaff = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await staffApi.listStaff();
      const list = Array.isArray(data?.staff) ? data.staff : (Array.isArray(data) ? data : []);
      setStaffList(list);
    } catch (err) {
      console.warn('Staff fetch fallback:', err);
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStaff();
      setActiveTab('list');
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Kripya staff ka poora naam likhein.');
      return;
    }
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 10) {
      setError('Kripya valid 10-digit mobile number daalein.');
      return;
    }
    if (pin.trim().length !== 4 || isNaN(Number(pin))) {
      setError('Counter login PIN theek 4 numeric digits ka hona chahiye.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await staffApi.createStaff({
        full_name: fullName.trim(),
        phone: cleanPhone,
        pin: pin.trim(),
        role,
      });
      setSuccess(`Cashier "${fullName}" safaltapoorvak create ho gaya!`);
      setFullName('');
      setPhone('');
      setPin('');
      loadStaff();
      setTimeout(() => {
        setSuccess('');
        setActiveTab('list');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Staff create karne me error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id, name) => {
    if (!window.confirm(`Kya aap "${name}" ka counter access revoke/delete karna chahte hain?`)) return;
    try {
      await staffApi.deleteStaff(id);
      loadStaff();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    }
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
            <div style={{ background: 'rgba(124, 58, 237, 0.15)', color: '#8b5cf6', padding: '8px', borderRadius: '10px' }}>
              <Users size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>Counter Staff &amp; Cashiers</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Shop ID: <strong>{shop?.id || shop?.slug || 'STORE'}</strong></span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-surface-subtle)', borderRadius: '12px', padding: '4px', marginBottom: '1.25rem' }}>
          <button
            onClick={() => setActiveTab('list')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'list' ? 'var(--color-primary, #3b82f6)' : 'transparent',
              color: activeTab === 'list' ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Active Staff ({staffList.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'add' ? 'var(--color-primary, #3b82f6)' : 'transparent',
              color: activeTab === 'add' ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <UserPlus size={15} />
            Add New Cashier
          </button>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '10px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22c55e', fontSize: '0.85rem', marginBottom: '1rem', background: 'rgba(34, 197, 94, 0.1)', padding: '10px', borderRadius: '10px' }}>
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {activeTab === 'list' ? (
          <div>
            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.3)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <ShieldCheck size={16} color="#8b5cf6" />
              <span>Staff members can only billing and view stock. They cannot see shop net profit or expense ledgers.</span>
            </div>

            {loading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1.5rem 0' }}>Loading staff list...</p>
            ) : staffList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--bg-surface-subtle)', borderRadius: '14px' }}>
                <Users size={36} style={{ margin: '0 auto 0.5rem auto', opacity: 0.4 }} />
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>No staff members added yet.</p>
                <button
                  onClick={() => setActiveTab('add')}
                  style={{ background: 'var(--color-primary, #3b82f6)', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  Add First Cashier
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {staffList.map((member) => (
                  <div
                    key={member.id}
                    style={{
                      padding: '1rem',
                      borderRadius: '14px',
                      background: 'var(--bg-surface-subtle)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{member.full_name || member.name}</h4>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: member.role === 'manager' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: member.role === 'manager' ? '#60a5fa' : '#34d399', fontWeight: 600 }}>
                          {(member.role || 'cashier').toUpperCase()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={13} /> {member.phone}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Key size={13} /> PIN: ••••
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteStaff(member.id, member.full_name || member.name)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                      title="Revoke access"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                Staff Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Kumar (Counter 1)"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                Mobile Number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                maxLength={10}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  4-Digit Counter PIN *
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="e.g. 1234"
                  maxLength={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    letterSpacing: '4px',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Role Permission
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
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
                  <option value="cashier">Cashier (POS Only)</option>
                  <option value="manager">Store Manager (POS + Stock)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: 'var(--color-primary, #3b82f6)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                marginTop: '0.5rem',
              }}
            >
              {submitting ? 'Creating Cashier...' : 'Create Cashier Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
