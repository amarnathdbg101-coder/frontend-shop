import { ALL_CATEGORIES } from '../../constants/categoryData';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  ArrowLeft,
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Plus,
  Trash2,
  Sliders,
  Check,
  Package,
  Layers,
  HelpCircle,
  Camera,
  Loader2,
  ChevronDown,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { productApi } from '../../api/product.api';
import { uploadApi } from '../../api/upload.api';
import { aiApi } from '../../api/ai.api';
import { generateSmartSKU } from '../../utils/sku';
import { getImageUrl } from '../../utils/imageUrl';

export const AddProductModal = ({
  isOpen,
  onClose,
  onSuccess,
  categories = [],
  initialProduct = null,
}) => {
  if (!isOpen) return null;

  const isEdit = Boolean(initialProduct?.id);
    const effectiveCategories = React.useMemo(() => {
    if (Array.isArray(categories) && categories.length > 0) {
      return categories.map((c) => ({
        id: c.id || c.slug,
        name: c.name || (c.nameEn ? `${c.icon || ''} ${c.nameEn} / ${c.nameHi || ''}`.trim() : c.slug),
        slug: c.slug || c.id,
      }));
    }
    return ALL_CATEGORIES.map((c) => ({
      id: c.slug || c.id,
      name: `${c.icon} ${c.nameEn} / ${c.nameHi}`,
      slug: c.slug || c.id,
    }));
  }, [categories]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    compare_price: '',
    cost_price: '',
    floor_price: '',
    allow_bargain: false,
    is_price_public: true,
    category_id: '',
    stock_quantity: '20',
    min_stock: '3',
    weight: '',
    description: '',
    tags: '',
    attributes: {
      brand: '',
      size_unit: '',
      color: '',
      flavor: '',
      material: '',
      warranty: '',
    },
  });

  const [customAttributes, setCustomAttributes] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [productImagePreviews, setProductImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [aiSuccessToast, setAiSuccessToast] = useState('');
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(false);

  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

  // Initialize form on open or initialProduct change
  useEffect(() => {
    if (initialProduct) {
      const p = initialProduct;
      const attr = p.attributes || {};
      
      const predefinedKeys = ['brand', 'size_unit', 'color', 'flavor', 'material', 'warranty', 'company', 'model', 'product_type', 'size', 'gender', 'season', 'age_group'];
      const customAttrs = [];
      Object.entries(attr).forEach(([k, v]) => {
        if (!predefinedKeys.includes(k.toLowerCase()) && v) {
          customAttrs.push({ key: k, value: String(v) });
        }
      });

      setFormData({
        name: p.name || '',
        sku: p.sku || '',
        price: p.price !== undefined ? String(p.price) : '',
        compare_price: p.compare_price !== undefined ? String(p.compare_price) : '',
        cost_price: p.cost_price !== undefined ? String(p.cost_price) : '',
        floor_price: p.floor_price !== undefined ? String(p.floor_price) : '',
        allow_bargain: Boolean(p.allow_bargain),
        is_price_public: p.is_price_public !== undefined ? Boolean(p.is_price_public) : true,
        category_id: p.category_id || p.category?.id || (effectiveCategories[0]?.id || ''),
        stock_quantity: String(p.stock_quantity ?? p.inventory?.available_quantity ?? p.available_quantity ?? '20'),
        min_stock: String(p.min_stock ?? p.low_stock_threshold ?? '3'),
        weight: p.weight !== undefined ? String(p.weight) : '',
        description: p.description || '',
        tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
        attributes: {
          brand: attr.brand || attr.company || '',
          size_unit: attr.size_unit || attr.size || attr.unit || '',
          color: attr.color || '',
          flavor: attr.flavor || '',
          material: attr.material || '',
          warranty: attr.warranty || '',
        },
      });

      setExistingImages(Array.isArray(p.images) ? p.images : []);
      setProductImages([]);
      setProductImagePreviews([]);
      setCustomAttributes(customAttrs);
    } else {
      // Default Add Form
      setFormData({
        name: '',
        sku: '',
        price: '',
        compare_price: '',
        cost_price: '',
        floor_price: '',
        allow_bargain: false,
        is_price_public: true,
        category_id: effectiveCategories[0]?.id || '',
        stock_quantity: '20',
        min_stock: '3',
        weight: '',
        description: '',
        tags: '',
        attributes: {
          brand: '',
          size_unit: '',
          color: '',
          flavor: '',
          material: '',
          warranty: '',
        },
      });
      setExistingImages([]);
      setProductImages([]);
      setProductImagePreviews([]);
      setCustomAttributes([]);
    }
    setError('');
    setAiSuccessToast('');
  }, [initialProduct, categories, isOpen]);

  // Dynamic Required Fields Calculation (0/4 complete)
  const requiredCount = useMemo(() => {
    let count = 0;
    if (formData.name && formData.name.trim().length > 0) count++;
    if (formData.sku && formData.sku.trim().length > 0) count++;
    if (formData.category_id && formData.category_id.length > 0) count++;
    if (formData.price && Number(formData.price) > 0) count++;
    return count;
  }, [formData.name, formData.sku, formData.category_id, formData.price]);

  // Handle Product Name Change & Auto SKU
  const handleNameChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: val,
      sku: (!isEdit && (!prev.sku || prev.sku === generateSmartSKU(prev.name)))
        ? generateSmartSKU(val)
        : prev.sku,
    }));
  };

  // Generate / Regenerate Smart SKU
  const handleRegenerateSKU = () => {
    const newSku = generateSmartSKU(formData.name || 'ITEM');
    setFormData((prev) => ({ ...prev, sku: newSku }));
  };

  // Handle AI Packet Auto-Scan
  const handleScanClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePacketFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanning(true);
      setError('');
      setAiSuccessToast('');

      // Add to previews so photo is captured immediately
      const previewUrl = URL.createObjectURL(file);
      setProductImagePreviews((prev) => [previewUrl, ...prev].slice(0, 4));
      setProductImages((prev) => [file, ...prev].slice(0, 4));

      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = event.target.result;
          const result = await aiApi.scanProduct(base64);

          if (result) {
            setFormData((prev) => {
              // Match category if hinted
              let matchedCatId = prev.category_id;
              if (result.category_hint && effectiveCategories.length > 0) {
                const hintLower = result.category_hint.toLowerCase();
                const found = effectiveCategories.find((c) =>
                  (c.name && c.name.toLowerCase().includes(hintLower)) ||
                  (c.slug && c.slug.toLowerCase().includes(hintLower))
                );
                if (found) matchedCatId = found.id;
              }

              return {
                ...prev,
                name: result.name || prev.name,
                sku: result.suggested_sku || result.barcode || prev.sku || generateSmartSKU(result.name || 'ITEM'),
                price: result.selling_price ? String(result.selling_price) : (result.mrp ? String(result.mrp) : prev.price),
                compare_price: result.mrp ? String(result.mrp) : prev.compare_price,
                cost_price: result.estimated_cost ? String(result.estimated_cost) : prev.cost_price,
                weight: result.weight ? String(result.weight) : prev.weight,
                min_stock: result.min_stock_alert ? String(result.min_stock_alert) : prev.min_stock,
                description: result.description || prev.description,
                tags: Array.isArray(result.tags) ? result.tags.join(', ') : prev.tags,
                category_id: matchedCatId,
                attributes: {
                  ...prev.attributes,
                  brand: result.brand || prev.attributes.brand,
                  size_unit: result.unit || prev.attributes.size_unit,
                  ...(result.attributes || {}),
                },
              };
            });
            setAiSuccessToast('✨ AI ne packet details auto-fill kar di!');
          }
        } catch (apiErr) {
          console.warn('AI Vision Scan error:', apiErr);
          setAiSuccessToast('📸 Photo upload ho gayi! Baki details check kar lein.');
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File read error:', err);
      setIsScanning(false);
    }
  };

  // Image Upload handler for manual photo additions
  const handleAddPhotoClick = () => {
    if (photoInputRef.current) {
      photoInputRef.current.click();
    }
  };

  const handlePhotosSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const totalAllowed = 4 - (existingImages.length + productImages.length);
    const validFiles = files.slice(0, Math.max(0, totalAllowed));

    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setProductImages((prev) => [...prev, ...validFiles]);
    setProductImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveNewPhoto = (index) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
    setProductImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingPhoto = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Specification Chips & Custom Key-Value
  const handleAddSpecificationChip = (keyName) => {
    const formattedKey = keyName.toLowerCase().replace(/\s+/g, '_');
    // Check if already in standard attributes
    if (formData.attributes.hasOwnProperty(formattedKey)) {
      const el = document.getElementById(`attr-input-${formattedKey}`);
      if (el) el.focus();
      return;
    }
    // Check if already in customAttributes
    if (!customAttributes.some((a) => a.key.toLowerCase() === keyName.toLowerCase())) {
      setCustomAttributes((prev) => [...prev, { key: keyName, value: '' }]);
    }
  };

  const handleCustomAttrChange = (idx, field, val) => {
    setCustomAttributes((prev) => {
      const copy = [...prev];
      copy[idx][field] = val;
      return copy;
    });
  };

  const handleRemoveCustomAttr = (idx) => {
    setCustomAttributes((prev) => prev.filter((_, i) => i !== idx));
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.name.trim()) {
      setError('Kripya product ka naam darj karein');
      return;
    }
    if (!formData.category_id) {
      setError('Kripya ek category select karein');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setError('Kripya valid Selling Price darj karein');
      return;
    }

    try {
      setLoading(true);

      // Upload newly added images if any
      let uploadedUrls = [];
      if (productImages.length > 0) {
        try {
          const uploadRes = await uploadApi.uploadProductImages(productImages, formData.sku);
          uploadedUrls = uploadRes.images || [];
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
          if (!window.confirm('Photo upload me samasya aayi. Kya bina photo ke save karna chahte hain?')) {
            setLoading(false);
            return;
          }
        }
      }

      const finalImages = [...existingImages, ...uploadedUrls].slice(0, 4);

      // Build attributes map
      const finalAttributes = {};
      Object.entries(formData.attributes || {}).forEach(([k, v]) => {
        if (v && String(v).trim()) {
          finalAttributes[k] = String(v).trim();
        }
      });
      customAttributes.forEach((item) => {
        if (item.key && item.key.trim() && item.value && item.value.trim()) {
          finalAttributes[item.key.trim().toLowerCase()] = item.value.trim();
        }
      });

      // Tags array
      const tagsArray = formData.tags
        ? formData.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim() || generateSmartSKU(formData.name),
        price: Number(formData.price),
        compare_price: formData.compare_price ? Number(formData.compare_price) : 0,
        mrp: formData.compare_price ? Number(formData.compare_price) : 0,
        cost_price: formData.cost_price ? Number(formData.cost_price) : 0,
        floor_price: formData.floor_price ? Number(formData.floor_price) : 0,
        allow_bargain: Boolean(formData.allow_bargain),
        is_price_public: Boolean(formData.is_price_public),
        category_id: formData.category_id,
        stock_quantity: Number(formData.stock_quantity) || 0,
        min_stock: Math.max(1, Number(formData.min_stock) || 1),
        weight: formData.weight ? Number(formData.weight) : 0,
        description: formData.description.trim(),
        tags: tagsArray,
        attributes: finalAttributes,
        images: finalImages,
      };

      if (isEdit) {
        await productApi.updateProduct(initialProduct.id, payload);
      } else {
        await productApi.createProduct(payload);
      }

      if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Save product error:', err);
      setError(err.response?.data?.error || err.message || 'Product save karne me samasya aayi');
    } finally {
      setLoading(false);
    }
  };

  const totalPhotosCount = existingImages.length + productImagePreviews.length;

  // Asli Munafa Calculation
  const sellingPriceNum = Number(formData.price) || 0;
  const costPriceNum = Number(formData.cost_price) || 0;
  const profitMargin = sellingPriceNum > 0 && costPriceNum > 0 ? sellingPriceNum - costPriceNum : null;
  const marginPercent = profitMargin && sellingPriceNum > 0 ? Math.round((profitMargin / sellingPriceNum) * 100) : null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 0,
      }}
    >
      <div
        className="add-product-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '92vh',
          height: '100%',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Hidden Inputs for Photo / AI Capture */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handlePacketFileSelect}
        />
        <input
          type="file"
          accept="image/*"
          multiple
          ref={photoInputRef}
          style={{ display: 'none' }}
          onChange={handlePhotosSelected}
        />

        {/* Top Sticky Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
            backgroundColor: 'var(--bg-surface, #ffffff)',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                border: 'none',
                background: 'var(--bg-surface-subtle, #f1f5f9)',
                color: 'var(--text-primary, #0f172a)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--text-primary, #0f172a)',
                margin: 0,
              }}
            >
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 18px 90px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Error Banner */}
          {error && (
            <div
              style={{
                backgroundColor: 'var(--color-danger-light, #fef2f2)',
                color: 'var(--color-danger, #ef4444)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          {/* AI Success Toast */}
          {aiSuccessToast && (
            <div
              style={{
                backgroundColor: 'var(--color-primary-light, #eef2ff)',
                color: 'var(--color-primary, #4f46e5)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Sparkles size={16} />
              {aiSuccessToast}
            </div>
          )}

          {/* Catalog Setup Header Block */}
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: 'var(--color-primary, #4f46e5)',
                textTransform: 'uppercase',
                marginBottom: '2px',
              }}
            >
              CATALOG SETUP
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h1
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  color: 'var(--text-primary, #0f172a)',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                {isEdit ? 'Update product' : 'Add product'}
              </h1>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: 'rgba(79, 70, 229, 0.08)',
                  color: 'var(--color-primary, #4f46e5)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                }}
              >
                <Package size={15} />
                <span>{requiredCount}/4</span>
              </div>
            </div>
            <p
              style={{
                fontSize: '0.86rem',
                color: 'var(--text-secondary, #475569)',
                margin: '4px 0 0 0',
              }}
            >
              {isEdit ? 'Edit catalog specifications and stock limits.' : 'Create a sell-ready catalog item.'}
            </p>
          </div>

          {/* 1-Tap AI Packet Auto-Scan Banner */}
          {!isEdit && (
            <div
              onClick={handleScanClick}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 55%, #8b5cf6 100%)',
                borderRadius: '16px',
                padding: '14px 16px',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 6px 18px rgba(99, 102, 241, 0.28)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isScanning ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <Sparkles size={24} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '0.98rem',
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  📸 1-Tap AI Packet Auto-Scan
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    opacity: 0.94,
                    marginTop: '2px',
                    lineHeight: '1.25',
                  }}
                >
                  {isScanning
                    ? 'AI Packet scan kar raha hai...'
                    : 'Snap packet photo to autofill MRP, brand, weight & title instantly'}
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Basic product details */}
          <div
            style={{
              backgroundColor: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <h3
              style={{
                fontSize: '0.98rem',
                fontWeight: 700,
                color: 'var(--text-primary, #0f172a)',
                margin: 0,
              }}
            >
              Basic product details
            </h3>

            {/* Product Name */}
            <div>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Product Name (e.g. Tata Salt 1kg) *"
                value={formData.name}
                onChange={handleNameChange}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  fontSize: '0.92rem',
                  border: '1.5px solid var(--border-subtle, #e2e8f0)',
                  backgroundColor: 'var(--bg-surface, #ffffff)',
                  color: 'var(--text-primary, #0f172a)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Barcode / SKU + Auto Button */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Barcode / SKU *"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: '12px',
                  fontSize: '0.92rem',
                  border: '1.5px solid var(--border-subtle, #e2e8f0)',
                  backgroundColor: 'var(--bg-surface, #ffffff)',
                  color: 'var(--text-primary, #0f172a)',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleRegenerateSKU}
                style={{
                  border: '1.5px solid var(--border-subtle, #e2e8f0)',
                  backgroundColor: 'var(--bg-surface-subtle, #f8fafc)',
                  color: 'var(--color-primary, #4f46e5)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Wand2 size={16} /> Auto
              </button>
            </div>
          </div>

          {/* Section 2: Category */}
          <div
            style={{
              backgroundColor: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3
                style={{
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  color: 'var(--text-primary, #0f172a)',
                  margin: 0,
                }}
              >
                Category
              </h3>
              <span
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted, #94a3b8)',
                  fontWeight: 600,
                }}
              >
                {effectiveCategories.length} categories available
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 36px 12px 14px',
                  borderRadius: '12px',
                  fontSize: '0.92rem',
                  border: '1.5px solid var(--border-subtle, #e2e8f0)',
                  backgroundColor: 'var(--bg-surface, #ffffff)',
                  color: 'var(--text-primary, #0f172a)',
                  outline: 'none',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select a category</option>
                {effectiveCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'var(--text-muted, #94a3b8)',
                }}
              />
            </div>
          </div>

          {/* Section 3: Pricing & Asli Munafa */}
          <div
            style={{
              backgroundColor: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3
                style={{
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  color: 'var(--text-primary, #0f172a)',
                  margin: 0,
                }}
              >
                Pricing & Asli Munafa
              </h3>
              {profitMargin !== null && (
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: profitMargin >= 0 ? 'var(--color-success, #10b981)' : 'var(--color-danger, #ef4444)',
                    backgroundColor: profitMargin >= 0 ? 'var(--color-success-light, #ecfdf5)' : 'var(--color-danger-light, #fef2f2)',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <TrendingUp size={12} />
                  +₹{profitMargin.toFixed(0)} ({marginPercent}% Margin)
                </span>
              )}
            </div>

            {/* 3 Column Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary, #475569)',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 150"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    border: '1.5px solid var(--border-subtle, #e2e8f0)',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    color: 'var(--text-primary, #0f172a)',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary, #475569)',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  MRP (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 180"
                  value={formData.compare_price}
                  onChange={(e) => setFormData({ ...formData, compare_price: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    border: '1.5px solid var(--border-subtle, #e2e8f0)',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    color: 'var(--text-primary, #0f172a)',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary, #475569)',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Cost / Kharid (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 120"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    border: '1.5px solid var(--border-subtle, #e2e8f0)',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    color: 'var(--text-primary, #0f172a)',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Smart Pricing: Floor Price, Bargain & Visibility */}
            <div
              style={{
                marginTop: '4px',
                paddingTop: '10px',
                borderTop: '1px dashed var(--border-subtle, #e2e8f0)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
                onClick={() => setShowAdvancedPricing(!showAdvancedPricing)}
              >
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--color-primary, #4f46e5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Sliders size={14} /> Min Floor Price & Bargain Settings
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                  {showAdvancedPricing ? 'Hide' : 'Options Dekhein'}
                </span>
              </div>

              {showAdvancedPricing && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    marginTop: '4px',
                    backgroundColor: 'var(--bg-surface-subtle, #f8fafc)',
                    padding: '12px',
                    borderRadius: '12px',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--text-secondary, #475569)',
                          display: 'block',
                          marginBottom: '4px',
                        }}
                      >
                        Min Floor Price (Nyunatam ₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 130"
                        value={formData.floor_price}
                        onChange={(e) => setFormData({ ...formData, floor_price: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          border: '1px solid var(--border-subtle, #e2e8f0)',
                          backgroundColor: 'var(--bg-surface, #ffffff)',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <label
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--text-secondary, #475569)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.allow_bargain}
                          onChange={(e) => setFormData({ ...formData, allow_bargain: e.target.checked })}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary, #4f46e5)' }}
                        />
                        Allow Customer Bargain
                      </label>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)', marginLeft: '22px' }}>
                        Customer rate par mol-bhav kar sakein
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="price-public-toggle"
                      checked={formData.is_price_public}
                      onChange={(e) => setFormData({ ...formData, is_price_public: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary, #4f46e5)' }}
                    />
                    <label
                      htmlFor="price-public-toggle"
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary, #475569)',
                        cursor: 'pointer',
                      }}
                    >
                      {formData.is_price_public ? '✅ Rate & MRP online public dikhega' : '🔒 Price chupa rahega ("मूल्य पूछताछ पर")'}
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Product Photos (Max 4) */}
          <div
            style={{
              backgroundColor: 'var(--bg-card, #ffffff)',
              border: '1px solid rgba(79, 70, 229, 0.15)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-primary-light, #eef2ff)',
                    color: 'var(--color-primary, #4f46e5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ImageIcon size={16} />
                </div>
                <h3
                  style={{
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    color: 'var(--text-primary, #0f172a)',
                    margin: 0,
                  }}
                >
                  Product Photos (Max 4)
                </h3>
              </div>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: totalPhotosCount >= 4 ? 'var(--color-primary, #4f46e5)' : 'var(--text-muted, #94a3b8)',
                }}
              >
                {totalPhotosCount}/4
              </span>
            </div>

            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary, #475569)',
                margin: 0,
              }}
            >
              Tap "Add Photo" to upload product images
            </p>

            {/* Photo Grid */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
              {/* Existing Images */}
              {existingImages.map((url, idx) => (
                <div
                  key={`exist-${idx}`}
                  style={{
                    position: 'relative',
                    width: '74px',
                    height: '74px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1.5px solid var(--border-subtle, #e2e8f0)',
                  }}
                >
                  <img loading="lazy" decoding="async" 
                    src={getImageUrl(url)}
                    alt={`Product ${idx}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingPhoto(idx)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 0, 0, 0.65)',
                      color: '#ffffff',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* Newly added previews */}
              {productImagePreviews.map((url, idx) => (
                <div
                  key={`new-${idx}`}
                  style={{
                    position: 'relative',
                    width: '74px',
                    height: '74px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1.5px solid var(--color-primary, #4f46e5)',
                  }}
                >
                  <img loading="lazy" decoding="async" 
                    src={url}
                    alt={`Preview ${idx}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewPhoto(idx)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(239, 68, 68, 0.85)',
                      color: '#ffffff',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* Add Photo Button */}
              {totalPhotosCount < 4 && (
                <button
                  type="button"
                  onClick={handleAddPhotoClick}
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '12px',
                    border: '2px dashed var(--color-primary, #4f46e5)',
                    backgroundColor: 'rgba(79, 70, 229, 0.03)',
                    color: 'var(--color-primary, #4f46e5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  <Plus size={20} />
                  <span>Add Photo</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 5: Stock & Inventory Limits */}
          <div
            style={{
              backgroundColor: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <h3
              style={{
                fontSize: '0.98rem',
                fontWeight: 700,
                color: 'var(--text-primary, #0f172a)',
                margin: 0,
              }}
            >
              Stock & Inventory Limits
            </h3>

            {/* 3 Column Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary, #475569)',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Initial Stock *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="e.g. 20"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    border: '1.5px solid var(--border-subtle, #e2e8f0)',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    color: 'var(--text-primary, #0f172a)',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary, #475569)',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Alert Min Stock
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="3"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    border: '1.5px solid var(--border-subtle, #e2e8f0)',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    color: 'var(--text-primary, #0f172a)',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary, #475569)',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1.0"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    border: '1.5px solid var(--border-subtle, #e2e8f0)',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    color: 'var(--text-primary, #0f172a)',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 6: Flexible Specifications (JSONB / NoSQL) */}
          <div
            style={{
              backgroundColor: 'var(--bg-card, #ffffff)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} color="var(--color-primary, #4f46e5)" />
                <h3
                  style={{
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    color: 'var(--text-primary, #0f172a)',
                    margin: 0,
                  }}
                >
                  Flexible Specifications (JSONB / NoSQL)
                </h3>
              </div>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary, #475569)',
                  margin: '4px 0 0 0',
                }}
              >
                Add custom key-values like Brand, Unit, Color, Material, etc.
              </p>
            </div>

            {/* Quick Add Chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['Brand', 'Size / Unit', 'Color', 'Flavor', 'Material', 'Warranty'].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleAddSpecificationChip(chip)}
                  style={{
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    backgroundColor: 'var(--bg-surface-subtle, #f8fafc)',
                    borderRadius: '20px',
                    padding: '5px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-primary, #0f172a)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={12} /> {chip}
                </button>
              ))}
            </div>

            {/* Standard Key-Values */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                type="text"
                id="attr-input-brand"
                placeholder="Brand (e.g. Tata, Amul)"
                value={formData.attributes.brand}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    attributes: { ...formData.attributes, brand: e.target.value },
                  })
                }
                style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  backgroundColor: 'var(--bg-surface, #ffffff)',
                  outline: 'none',
                }}
              />
              <input
                type="text"
                id="attr-input-size_unit"
                placeholder="Size / Unit (e.g. 1kg, 500ml, XL)"
                value={formData.attributes.size_unit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    attributes: { ...formData.attributes, size_unit: e.target.value },
                  })
                }
                style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  backgroundColor: 'var(--bg-surface, #ffffff)',
                  outline: 'none',
                }}
              />
              <input
                type="text"
                id="attr-input-color"
                placeholder="Color (e.g. Red, Blue)"
                value={formData.attributes.color}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    attributes: { ...formData.attributes, color: e.target.value },
                  })
                }
                style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  backgroundColor: 'var(--bg-surface, #ffffff)',
                  outline: 'none',
                }}
              />
              <input
                type="text"
                id="attr-input-flavor"
                placeholder="Flavor (e.g. Mango, Masala)"
                value={formData.attributes.flavor}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    attributes: { ...formData.attributes, flavor: e.target.value },
                  })
                }
                style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  backgroundColor: 'var(--bg-surface, #ffffff)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Custom Attributes List */}
            {customAttributes.map((attr, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Key (e.g. Material)"
                  value={attr.key}
                  onChange={(e) => handleCustomAttrChange(idx, 'key', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    outline: 'none',
                  }}
                />
                <input
                  type="text"
                  placeholder="Value (e.g. Pure Cotton)"
                  value={attr.value}
                  onChange={(e) => handleCustomAttrChange(idx, 'value', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCustomAttr(idx)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-danger, #ef4444)',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            {/* Search Tags */}
            <div>
              <label
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary, #475569)',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Search Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. fresh, dairy, milk, breakfast"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  border: '1.5px solid var(--border-subtle, #e2e8f0)',
                  backgroundColor: 'var(--bg-surface, #ffffff)',
                  color: 'var(--text-primary, #0f172a)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Section 7: Product Description (optional) */}
          <div
            style={{
              backgroundColor: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              borderRadius: '16px',
              padding: '16px',
            }}
          >
            <textarea
              rows={3}
              placeholder="Product Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '12px',
                fontSize: '0.88rem',
                border: '1.5px solid var(--border-subtle, #e2e8f0)',
                backgroundColor: 'var(--bg-surface, #ffffff)',
                color: 'var(--text-primary, #0f172a)',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>
        </form>

        {/* Fixed Sticky Bottom Action Bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-surface, #ffffff)',
            borderTop: '1px solid var(--border-subtle, #e2e8f0)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.06)',
            zIndex: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--text-muted, #94a3b8)',
              }}
            >
              Required fields
            </div>
            <div
              style={{
                fontSize: '0.9rem',
                fontWeight: 800,
                color: requiredCount === 4 ? 'var(--color-success, #10b981)' : 'var(--text-primary, #0f172a)',
              }}
            >
              {requiredCount}/4 complete
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 28px',
              fontSize: '0.98rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'opacity 0.15s ease',
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            <span>{loading ? 'Saving product...' : isEdit ? 'Update product' : 'Save product'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
