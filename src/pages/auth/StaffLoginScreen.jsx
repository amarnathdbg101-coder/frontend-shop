import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { staffApi } from '../../api/staff.api';
import { ThemeLanguageBar } from '../../components/common/ThemeLanguageBar';

export const StaffLoginScreen = () => {
  const navigate = useNavigate();
  const { setStaffAuth } = useAuth();
  const { t, isHindi } = useLanguage();

  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleLogin = async () => {
    if (pin.length !== 4) return;
    setLoading(true);
    setError('');
    try {
      const res = await staffApi.loginWithPin(pin);
      if (setStaffAuth) setStaffAuth(res);
      navigate('/merchant/pos');
    } catch (err) {
      setError(err.response?.data?.message || (isHindi ? 'अमान्य 4-अंकीय पिन' : 'Invalid 4-digit PIN'));
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (pin.length === 4) {
      handleLogin();
    }
  }, [pin]);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '360px', textAlign: 'center' }}>
        <div className="auth-logo" style={{ margin: '0 auto 12px auto' }}>
          <KeyRound size={28} />
        </div>
        <h2 className="auth-title">{isHindi ? 'कैशियर त्वरित पिन लॉगिन' : 'Cashier Fast PIN Login'}</h2>
        <p className="auth-subtitle">{isHindi ? 'काउंटर बिलिंग हेतु अपना 4-अंकीय पिन दर्ज करें' : 'Enter 4-digit PIN for counter POS billing'}</p>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* PIN Circles */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', margin: '20px 0' }}>
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: '2px solid var(--color-primary)',
                backgroundColor: pin.length > idx ? 'var(--color-primary)' : 'transparent',
              }}
            />
          ))}
        </div>

        {/* Keypad Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxWidth: '240px', margin: '0 auto 20px auto' }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                if (k === 'C') setPin('');
                else if (k === '⌫') handleBackspace();
                else handleDigit(k);
              }}
              className="btn btn-secondary"
              style={{ fontSize: '1.2rem', fontWeight: 800, padding: '14px 0' }}
            >
              {k}
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', fontSize: '0.82rem' }}>
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
            {isHindi ? 'दुकानदार पासवर्ड लॉगिन' : 'Switch to Owner Login'}
          </Link>
        </div>

        <div style={{ marginTop: '20px' }}>
          <ThemeLanguageBar compact={false} />
        </div>
      </div>
    </div>
  );
};
export default StaffLoginScreen;
