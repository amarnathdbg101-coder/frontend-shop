import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { inventoryApi } from '../../api/inventory.api';
import { productApi } from '../../api/product.api';
import { useLanguage } from '../../context/LanguageContext';
import { AppLayout } from '../../components/layout/AppLayout';
import { BulkImportModal } from '../../components/merchant/BulkImportModal';
import { ProductDetailModal } from '../../components/common/ProductDetailModal';

export const InventoryScreen = () => {
  const { t, isHindi } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await productApi.listMyProducts({ search: searchTerm });
      const list = Array.isArray(res?.products) ? res.products : (Array.isArray(res) ? res : []);
      setProducts(list);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [searchTerm]);

  const handleBulkRestock = async (productId) => {
    try {
      await inventoryApi.adjustStock(productId, { adjustment: 10, reason: 'BulkRestock' });
      fetchInventory();
    } catch (err) {
      alert(isHindi ? 'रीस्टॉक विफल रहा' : 'Restock failed');
    }
  };

  const filteredProducts = products.filter((p) => {
    const stock = p.stock_quantity ?? p.available_quantity ?? 0;
    if (lowStockOnly && stock > 5) return false;
    return true;
  });

  return (
    <AppLayout title={t('nav.inventory')} subtitle={t('inventory.subtitle')}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <div className="search-input-wrapper" style={{ flex: 1, minWidth: '220px' }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={isHindi ? 'उत्पाद अथवा बारकोड खोजें...' : 'Search products or SKU...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`btn btn-sm ${lowStockOnly ? 'btn-danger' : 'btn-secondary'}`}
          >
            <AlertTriangle size={14} />
            <span>{t('inventory.low_stock_only')}</span>
          </button>

          <button onClick={() => setShowBulkImport(true)} className="btn btn-secondary btn-sm">
            <FileSpreadsheet size={14} />
            <span>{t('inventory.bulk_import')}</span>
          </button>
        </div>
      </div>

      {/* Inventory Table / Cards */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('common.loading')}</div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '14px' }}>
          <Package size={48} color="var(--text-muted)" style={{ opacity: 0.4 }} />
          <p style={{ marginTop: '10px' }}>{t('common.no_results')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredProducts.map((p) => {
            const stock = p.stock_quantity ?? p.available_quantity ?? 0;
            const isLow = stock <= 5;
            return (
              <div
                key={p.id}
                style={{
                  backgroundColor: 'var(--bg-card, var(--bg-surface))',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  padding: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>{p.name}</h4>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {p.category || (isHindi ? 'सामान्य' : 'General')} • SKU: {p.sku || p.barcode || 'N/A'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-primary)' }}>₹{p.price}</div>
                    <div style={{ fontSize: '0.75rem', color: isLow ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                      {stock} {t('inventory.stock_qty')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleBulkRestock(p.id)}
                      className="btn btn-secondary btn-sm"
                      title={t('inventory.bulk_restock')}
                    >
                      +10
                    </button>
                    <button
                      onClick={() => setSelectedProduct(p)}
                      className="btn btn-secondary btn-sm"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showBulkImport && (
        <BulkImportModal
          isOpen={showBulkImport}
          onClose={() => setShowBulkImport(false)}
          onSuccess={fetchInventory}
        />
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isMerchant={true}
          onClose={() => setSelectedProduct(null)}
          onAdjustStock={() => fetchInventory()}
        />
      )}
    </AppLayout>
  );
};
export default InventoryScreen;
