import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  Calendar,
  FileText,
  PieChart,
} from 'lucide-react';
import { expenseApi } from '../../api/expense.api';
import { useLanguage } from '../../context/LanguageContext';
import { AppLayout } from '../../components/layout/AppLayout';

export const ExpenseScreen = () => {
  const { t, isHindi } = useLanguage();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [category, setCategory] = useState('Rent');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await expenseApi.getExpenses();
      const list = Array.isArray(res?.expenses) ? res.expenses : (Array.isArray(res) ? res : []);
      setExpenses(list);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setSubmitting(true);
    try {
      await expenseApi.createExpense({
        category,
        amount: Number(amount),
        notes,
      });
      setAmount('');
      setNotes('');
      setShowAddForm(false);
      fetchExpenses();
    } catch (err) {
      alert(isHindi ? 'खर्च दर्ज करने में त्रुटि' : 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const totalExpense = expenses.reduce((sum, it) => sum + Number(it.amount || 0), 0);

  return (
    <AppLayout title={t('nav.expenses')} subtitle={t('expenses.subtitle')}>
      {/* Top Banner */}
      <div style={{ backgroundColor: 'var(--bg-card, var(--bg-surface))', borderRadius: '16px', border: '1px solid var(--border-subtle)', padding: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('expenses.total_expenses_month')}</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ef4444', marginTop: '2px' }}>₹{totalExpense.toLocaleString('en-IN')}</div>
        </div>

        <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary btn-sm">
          <Plus size={16} />
          <span>{t('expenses.add_expense')}</span>
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleCreateExpense} style={{ backgroundColor: 'var(--bg-card, var(--bg-surface))', borderRadius: '14px', border: '1px solid var(--border-subtle)', padding: '16px', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 12px 0' }}>{t('expenses.add_expense')}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>{t('expenses.expense_category')}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-input">
                <option value="Rent">{t('expenses.cat_rent')}</option>
                <option value="Electricity">{t('expenses.cat_electricity')}</option>
                <option value="Salary">{t('expenses.cat_salary')}</option>
                <option value="Transport">{t('expenses.cat_transport')}</option>
                <option value="TeaSnacks">{t('expenses.cat_tea_snacks')}</option>
                <option value="Maintenance">{t('expenses.cat_maintenance')}</option>
                <option value="Other">{t('expenses.cat_other')}</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>{t('expenses.expense_amount')}</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₹ Amount" className="form-input" required />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>{t('expenses.expense_note')}</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Description" className="form-input" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
            {submitting ? t('common.processing') : t('common.save')}
          </button>
        </form>
      )}

      {/* Expense List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {expenses.map((exp) => (
          <div
            key={exp.id}
            style={{
              backgroundColor: 'var(--bg-card, var(--bg-surface))',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{exp.category}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{exp.notes || 'Expense entry'} • {new Date(exp.created_at).toLocaleDateString()}</div>
            </div>
            <div style={{ fontWeight: 800, color: '#ef4444', fontSize: '1rem' }}>- ₹{exp.amount}</div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};
export default ExpenseScreen;
