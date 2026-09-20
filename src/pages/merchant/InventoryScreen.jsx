/**
 * Inventory & Stock Management Screen (Enhanced Super-App Version)
 * Inspired by: Blinkit, Zepto, Shopify
 * 
 * Features:
 * - Ultra-Modern Add/Edit Product Modal with 1-Tap AI Packet Auto-Scan & Flexible Specifications
 * - Visual Category Selector & Smart SKU Generation
 * - Real-time Stock Adjust & Low-stock Alerts
 * - 1-Click Wholesale Reorder PDF Sheet & CSV/Excel Bulk Import
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Package,
  AlertTriangle,
  FileDown,
  Plus,
  Search,
  CheckCircle,
  RefreshCw,
  Boxes,
  Check,
  Sliders,
  X,
  Upload,
  Edit3,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { productApi } from '../../api/product.api';
import { inventoryApi } from '../../api/inventory.api';
import { AppLayout } from '../../components/layout/AppLayout';
import { ProductDetailModal } from '../../components/common/ProductDetailModal';
import { BulkImportModal } from '../../components/merchant/BulkImportModal';
import { AddProductModal } from '../../components/merchant/AddProductModal';
import { getImageUrl } from '../../utils/imageUrl';
import { useDebounce } from '../../hooks/useDebounce';
import { SkeletonRow } from '../../components/ui/Skeleton';

export const InventoryScreen = () => {
  const { shop } = useAuth();

  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'low_stock'
  const [products, setProducts] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected product for full detail view modal
  const [inspectedProduct, setInspectedProduct] = useState(null);

  // Stock Adjust Modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentQty, setAdjustmentQty] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Product Modals
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Universal Safe Stock Helper
  const getProductStock = (p) => {
    if (!p) return 0;
    return Number(
      p.available_quantity ??
      p.stock_quantity ??
      p.inventory?.available_quantity ??
      p.inventory?.quantity ??
      p.stock ??
      0
    );
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Kya aap sach me iss product ko catalog se delete karna chahte hain?')) {
      return;
    }
    try {
      await productApi.deleteProduct(id);
      setEditingProduct(null);
      setInspectedProduct(null);
      await loadData();
    } catch (err) {
      alert('Delete asafal: ' + err.message);
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, , catRes] = await Promise.allSettled([
        shop?.slug ? productApi.listByShopSlug(shop.slug) : Promise.resolve([]),
        inventoryApi.getLowStockAlerts(),
        productApi.getCategories(),
      ]);

      let productList = [];
      if (prodRes.status === 'fulfilled') {
        const d = prodRes.value;
        productList = Array.isArray(d) ? d : d?.products || d?.data || [];
      }
      setProducts(productList);

      // Extract low stock directly using safe threshold
      const lowStockList = productList.filter((p) => {
        const stock = getProductStock(p);
        const threshold = Number(p.min_stock ?? p.low_stock_threshold ?? p.inventory?.low_stock_threshold ?? 1);
        return stock <= threshold;
      });
      setLowStockItems(lowStockList);

      let catList = [];
      if (catRes.status === 'fulfilled') {
        const d = catRes.value;
        catList = Array.isArray(d) ? d : d?.categories || d?.data || [];
      }
      setCategories(catList);
    } catch (err) {
      console.error('Inventory load error:', err);
    } finally {
      setLoading(false);
    }
  }, [shop?.slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Debounced search term for smooth typing
  const debouncedSearchTerm = useDebounce(searchTerm, 250);

  // Filter products by search
  const filteredProducts = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    if (!debouncedSearchTerm) return list;
    const term = debouncedSearchTerm.toLowerCase().trim();
    return list.filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(term);
      const skuMatch = p.sku?.toLowerCase().includes(term);
      const brandMatch = p.attributes?.brand?.toLowerCase().includes(term) || p.attributes?.company?.toLowerCase().includes(term);
      const sizeMatch = p.attributes?.size_unit?.toLowerCase().includes(term) || p.attributes?.size?.toLowerCase().includes(term);
      const tagMatch = Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(term));
      return nameMatch || skuMatch || brandMatch || sizeMatch || tagMatch;
    });
  }, [products, debouncedSearchTerm]);

  // Stock Adjustment Submission
  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !adjustmentQty) return;

    try {
      setAdjustLoading(true);
      await inventoryApi.adjustStock({
        product_id: selectedProduct.id,
        adjustment: Number(adjustmentQty),
        notes: adjustNotes || 'Manual stock update',
      });
      setSelectedProduct(null);
      setAdjustmentQty('');
      setAdjustNotes('');
      await loadData();
    } catch (err) {
      alert('Stock update asafal: ' + err.message);
    } finally {
      setAdjustLoading(false);
    }
  };

  const [bulkRestocking, setBulkRestocking] = useState(false);

  // Bulk Restock Helper
  const handleBulkRestock = async (qty = 10) => {
    const targets = (Array.isArray(products) ? products : []).filter(
      (p) => getProductStock(p) <= 5
    );
    if (targets.length === 0) {
      alert('Sabhi products ka stock theek hai. Minimum stock limit se upar hain.');
      return;
    }
    if (!window.confirm(`Bulk Restock: ${targets.length} low-stock products me +${qty} units jodein?`)) {
      return;
    }

    setBulkRestocking(true);
    try {
      await Promise.all(
        targets.map((p) =>
          inventoryApi.adjustStock({
            product_id: p.id,
            adjustment: qty,
            notes: `Bulk restock (+${qty})`,
          })
        )
      );
      await loadData();
      alert(`Badhai! ${targets.length} products me +${qty} stock units jod diye gaye hain.`);
    } catch (err) {
      alert('Bulk restock me samasya: ' + err.message);
    } finally {
      setBulkRestocking(false);
    }
  };

  const totalStockValue = (Array.isArray(products) ? products : []).reduce(
    (acc, p) => acc + (Number(p.price) || 0) * getProductStock(p),
    0
  );

  return (
    <AppLayout title="Inventory & Stock">
      <div className="tab-nav mb-3">
        <button
          className={`tab-item ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          <Boxes size={18} />
          <span>Full Catalog ({products.length})</span>
        </button>
        <button
          className={`tab-item ${activeTab === 'low_stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('low_stock')}
          style={{ position: 'relative' }}
        >
          <AlertTriangle size={18} color={lowStockItems.length > 0 ? '#f59e0b' : 'inherit'} />
          <span>Kam Stock ({lowStockItems.length})</span>
          {lowStockItems.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '6px',
                right: '8px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
              }}
            />
          )}
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <div>
          {/* Inventory Valuation Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-card)',
              padding: '10px 14px',
              borderRadius: '12px',
              marginBottom: '12px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Stock Retail Value</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                ₹{totalStockValue.toLocaleString('en-IN')}
              </div>
            </div>

            <button
              onClick={() => handleBulkRestock(10)}
              disabled={bulkRestocking}
              style={{
                background: '#10b981',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RefreshCw size={13} className={bulkRestocking ? 'spin' : ''} />
              {bulkRestocking ? 'Restocking...' : 'Bulk Restock (+10)'}
            </button>
          </div>

          {/* Top Actions: Search + CSV Import + Naya Product */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <div className="search-box" style={{ flex: 1, minWidth: '220px', margin: 0 }}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Product, SKU, Brand ya Size khojein..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button
              type="button"
              onClick={() => setShowBulkImportModal(true)}
              className="btn btn-secondary btn-sm"
              style={{
                flexShrink: 0,
                gap: '6px',
                backgroundColor: 'rgba(79, 70, 229, 0.08)',
                borderColor: 'rgba(79, 70, 229, 0.25)',
                color: 'var(--color-primary)',
                fontWeight: 700,
                padding: '8px 12px',
              }}
              title="CSV ya Excel se bulk import karein"
            >
              <FileSpreadsheet size={16} /> <span>CSV Import</span>
            </button>

            <button
              onClick={() => setShowAddProductModal(true)}
              className="btn btn-primary btn-sm"
              style={{ flexShrink: 0, gap: '4px', padding: '8px 14px' }}
            >
              <Plus size={16} /> Naya Saman
            </button>
          </div>

          {/* Product Items List */}
          <div className="card" style={{ padding: '8px 12px' }}>
            {loading ? (
              <div style={{ padding: '12px 0' }}>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                <Package size={36} style={{ margin: '0 auto 8px auto', opacity: 0.6 }} />
                <div style={{ fontWeight: 700 }}>Koi product nahi mila</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Upar "+ Naya Saman" button dabakar product jodein.
                </p>
              </div>
            ) : (
              filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="list-item card-clickable"
                  onClick={() => setInspectedProduct(p)}
                  style={{ padding: '12px 0', alignItems: 'center', display: 'flex', gap: '12px', cursor: 'pointer' }}
                >
                  {/* Product Thumbnail */}
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface-subtle, #f8fafc)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {p.images && p.images.length > 0 ? (
                      <img
                        src={getImageUrl(p.images[0])}
                        alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Package size={22} color="var(--text-muted)" style={{ opacity: 0.6 }} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      SKU: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.sku || 'N/A'}</span> • Price: <strong>₹{p.price}</strong>
                    </div>

                    {/* Attributes Badges */}
                    {p.attributes && Object.keys(p.attributes).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                        {(p.attributes.brand || p.attributes.company) && (
                          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                            🏷️ {p.attributes.brand || p.attributes.company}
                          </span>
                        )}
                        {(p.attributes.size_unit || p.attributes.size) && (
                          <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>
                            Size: {p.attributes.size_unit || p.attributes.size}
                          </span>
                        )}
                        {p.attributes.color && (
                          <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>
                            🎨 {p.attributes.color}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                    {(() => {
                      const stockVal = getProductStock(p);
                      const minVal = Number(p.min_stock ?? p.low_stock_threshold ?? p.inventory?.low_stock_threshold ?? 1);
                      const isLow = stockVal <= minVal;
                      return (
                        <div style={{ textAlign: 'right' }}>
                          <span
                            className={`badge ${stockVal <= 0 ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`}
                            style={{ fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            {stockVal <= 0 ? 'Out of Stock' : `${stockVal} in stock`}
                          </span>
                        </div>
                      );
                    })()}

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProduct(p);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Edit Details"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(p);
                          setAdjustmentQty('');
                          setAdjustNotes('');
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        Adjust
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Low Stock Items Tab */
        <div>
          <div
            style={{
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              border: '1px solid #fcd34d',
              padding: '12px 14px',
              borderRadius: '12px',
              marginBottom: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 800, color: '#92400e', fontSize: '0.9rem' }}>
                ⚠️ Low Stock Alert ({lowStockItems.length} Products)
              </div>
              <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '2px' }}>
                Ye items dukan me jaldi khatam ho sakte hain.
              </div>
            </div>

            <button
              onClick={() => handleBulkRestock(10)}
              disabled={bulkRestocking || lowStockItems.length === 0}
              style={{
                background: '#d97706',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Sabhi me +10 dalein
            </button>
          </div>

          <div className="card" style={{ padding: '8px 12px' }}>
            {lowStockItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Stock Ekdam Sahi Hai!</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Koi bhi product minimum alert level se niche nahi hai.
                </p>
              </div>
            ) : (
              lowStockItems.map((p) => {
                const stockVal = getProductStock(p);
                return (
                  <div
                    key={p.id}
                    className="list-item"
                    style={{ padding: '12px 0', alignItems: 'center', display: 'flex', gap: '12px' }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#fef2f2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <AlertTriangle size={20} color="#ef4444" />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        SKU: {p.sku || 'N/A'} • Selling: ₹{p.price}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-danger" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                        {stockVal} bache hain
                      </span>
                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setAdjustmentQty('');
                          setAdjustNotes('');
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        Restock
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Stock Adjustment Bottom Sheet */}
      {selectedProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px' }}>
              Stock Update: {selectedProduct.name}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Abhi dukan me stock: <strong>{getProductStock(selectedProduct)}</strong> units hain.
            </p>

            <form onSubmit={handleStockAdjustment}>
              <div className="form-group">
                <label className="form-label">Stock me badlaav (+ jodne ke liye, - ghatane ke liye)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    required
                    className="form-input"
                    placeholder="e.g. +10 ya -2"
                    value={adjustmentQty}
                    onChange={(e) => setAdjustmentQty(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setAdjustmentQty('10')}
                  >
                    +10
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setAdjustmentQty('25')}
                  >
                    +25
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setAdjustmentQty('50')}
                  >
                    +50
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Wajah / Reason (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Supplier se stock aaya ya Kharab saman"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary btn-block" disabled={adjustLoading}>
                  {adjustLoading ? 'Updating Stock...' : 'Save Stock Adjustment'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedProduct(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Product Detail View Modal */}
      {inspectedProduct && (
        <ProductDetailModal
          product={inspectedProduct}
          onClose={() => setInspectedProduct(null)}
          onEditProduct={(p) => {
            setInspectedProduct(null);
            setEditingProduct(p);
          }}
          onAdjustStock={(p) => {
            setSelectedProduct(p);
            setAdjustmentQty('');
            setAdjustNotes('');
          }}
          isMerchant={true}
        />
      )}

      {/* Ultra-Modern Add Product Modal */}
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        onSuccess={loadData}
        categories={categories}
        initialProduct={null}
      />

      {/* Ultra-Modern Edit Product Modal */}
      <AddProductModal
        isOpen={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        onSuccess={loadData}
        categories={categories}
        initialProduct={editingProduct}
      />

      {/* Bulk CSV / Excel Import Modal */}
      <BulkImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onSuccess={loadData}
      />
    </AppLayout>
  );
};
