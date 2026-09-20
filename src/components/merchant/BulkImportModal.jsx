import React, { useState, useRef, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  FileCheck,
  PackagePlus,
  RefreshCw,
  Layers,
  Check,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { productApi } from '../../api/product.api';

// ==========================================
// ROBUST RFC-4180 CSV / TSV CLIENT PARSER
// ==========================================
function parseDelimitedText(text) {
  if (!text || !text.trim()) return [];

  // Strip UTF-8 BOM if present
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xFEFF) {
    cleanText = cleanText.slice(1);
  }

  // Detect delimiter: comma, semicolon, or tab
  const firstLine = cleanText.split(/\r?\n/)[0] || '';
  let delimiter = ',';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;

  if (tabCount > commaCount && tabCount > semiCount) {
    delimiter = '\t';
  } else if (semiCount > commaCount && semiCount > tabCount) {
    delimiter = ';';
  }

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        currentRow.push(currentField.trim());
        if (currentRow.some(c => c !== '')) rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(c => c !== '')) rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(c => c !== '')) rows.push(currentRow);
  }

  return rows;
}

// Clean numbers: strip currency symbols & commas, but PRESERVE decimal points (.)
function sanitizeNumber(val, defaultVal = 0) {
  if (val === undefined || val === null) return defaultVal;
  let str = String(val).trim();
  // Strip currency symbols (₹, Rs, INR) and thousands commas
  str = str.replace(/[₹RsINR,\s]/gi, '');
  if (!str) return defaultVal;
  const num = parseFloat(str);
  return isNaN(num) ? defaultVal : num;
}

function sanitizeCode(val) {
  if (!val) return '';
  let str = String(val).trim();
  // Handle Excel scientific notation: 8.90103E+12 -> 8901030000000
  if (/[0-9]+(\.[0-9]+)?[eE]\+[0-9]+/.test(str)) {
    try {
      const parsed = Number(str);
      if (!isNaN(parsed)) {
        str = parsed.toLocaleString('fullwide', { useGrouping: false });
      }
    } catch {
      // Keep original string if conversion fails
    }
  }
  return str;
}

// Map CSV rows into structured Product objects
function mapRowsToProducts(rows) {
  if (!rows || rows.length < 2) return [];

  const header = rows[0].map(h => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));
  
  let nameCol = -1;
  let skuCol = -1;
  let barcodeCol = -1;
  let priceCol = -1;
  let costCol = -1;
  let mrpCol = -1;
  let stockCol = -1;
  let minStockCol = -1;
  let catCol = -1;
  let unitCol = -1;
  let descCol = -1;

  header.forEach((h, idx) => {
    if (h.includes('name') || h.includes('title') || h.includes('item') || h.includes('saman') || h.includes('product')) {
      if (nameCol === -1) nameCol = idx;
    } else if (h.includes('barcode') || h.includes('ean') || h.includes('upc')) {
      barcodeCol = idx;
    } else if (h.includes('sku') || h.includes('code') || h.includes('itemcode')) {
      skuCol = idx;
    } else if (h.includes('mrp') || h.includes('compare') || h.includes('originalprice') || h.includes('listprice')) {
      mrpCol = idx;
    } else if (h.includes('cost') || h.includes('purchase') || h.includes('buyprice') || h.includes('wholesale')) {
      costCol = idx;
    } else if (h.includes('price') || h.includes('rate') || h.includes('selling') || h.includes('saleprice')) {
      if (priceCol === -1) priceCol = idx;
    } else if (h.includes('stock') || h.includes('qty') || h.includes('quantity') || h.includes('units') || h.includes('inventory')) {
      stockCol = idx;
    } else if (h.includes('min') || h.includes('threshold') || h.includes('alert') || h.includes('lowstock')) {
      minStockCol = idx;
    } else if (h.includes('category') || h.includes('cat') || h.includes('group') || h.includes('department')) {
      catCol = idx;
    } else if (h.includes('unit') || h.includes('uom') || h.includes('pack')) {
      unitCol = idx;
    } else if (h.includes('desc') || h.includes('detail') || h.includes('info')) {
      descCol = idx;
    }
  });

  // Default fallback if headers weren't detected
  if (nameCol === -1) nameCol = 0;
  if (priceCol === -1) priceCol = header.length > 1 ? 1 : -1;

  const products = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0 || row.every(cell => !cell.trim())) continue;

    const rawName = nameCol !== -1 && nameCol < row.length ? row[nameCol].trim() : '';
    const rawPrice = priceCol !== -1 && priceCol < row.length ? row[priceCol].trim() : '';
    const rawSku = skuCol !== -1 && skuCol < row.length ? sanitizeCode(row[skuCol]) : '';
    const rawBarcode = barcodeCol !== -1 && barcodeCol < row.length ? sanitizeCode(row[barcodeCol]) : '';
    const rawCost = costCol !== -1 && costCol < row.length ? row[costCol].trim() : '';
    const rawMRP = mrpCol !== -1 && mrpCol < row.length ? row[mrpCol].trim() : '';
    const rawStock = stockCol !== -1 && stockCol < row.length ? row[stockCol].trim() : '';
    const rawMinStock = minStockCol !== -1 && minStockCol < row.length ? row[minStockCol].trim() : '';
    const rawCat = catCol !== -1 && catCol < row.length ? row[catCol].trim() : '';
    const rawUnit = unitCol !== -1 && unitCol < row.length ? row[unitCol].trim() : '';
    const rawDesc = descCol !== -1 && descCol < row.length ? row[descCol].trim() : '';

    const price = sanitizeNumber(rawPrice, 0);
    const costPrice = sanitizeNumber(rawCost, 0);
    const comparePrice = sanitizeNumber(rawMRP, 0);
    const stockQuantity = Math.max(0, Math.floor(sanitizeNumber(rawStock, 10)));
    const minStock = Math.max(1, Math.floor(sanitizeNumber(rawMinStock, 5)));

    // Validation status
    let status = 'valid';
    let statusReason = '';

    if (!rawName) {
      status = 'error';
      statusReason = 'Product name missing hai';
    } else if (price <= 0) {
      status = 'error';
      statusReason = 'Price ₹0 se zyada honi chahiye';
    } else if (!rawSku && !rawBarcode) {
      status = 'auto_sku';
      statusReason = 'SKU code auto-generate hoga';
    }

    products.push({
      _rowIdx: r + 1,
      name: rawName,
      sku: rawSku || (rawBarcode ? rawBarcode : ''),
      barcode: rawBarcode,
      price: price > 0 ? price : 10,
      cost_price: costPrice > 0 ? costPrice : undefined,
      compare_price: comparePrice > 0 ? comparePrice : undefined,
      stock_quantity: stockQuantity,
      min_stock: minStock,
      category_name: rawCat || undefined,
      unit: rawUnit || undefined,
      description: rawDesc || undefined,
      _status: status,
      _statusReason: statusReason,
    });
  }

  return products;
}

export const BulkImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('file'); // 'file' | 'paste'
  const [selectedFile, setSelectedFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  
  // Options
  const [updateExisting, setUpdateExisting] = useState(true);
  
  // Filtering preview table
  const [previewFilter, setPreviewFilter] = useState('all'); // 'all' | 'valid' | 'errors'
  const [searchQuery, setSearchQuery] = useState('');

  // Upload Progress & State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // 1. Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const csvContent = "\uFEFF" + // UTF-8 BOM for Excel Hindi/English compatibility
      "Name,SKU,Barcode,Price,CostPrice,MRP,StockQuantity,MinStock,Category,Unit,Description\n" +
      "Aashirvaad Shuddh Chakki Atta 5kg,ATT-5KG,8901030001010,245.00,210.00,260.00,50,5,Atta & Flour,kg,5kg Whole Wheat Flour Pack\n" +
      "Fortune Sunlite Refined Oil 1L,OIL-1L,8901030001027,135.00,115.00,150.00,40,5,Edible Oils,L,1 Liter Pouch\n" +
      "Tata Salt Iodized 1kg,SALT-1KG,8901030001034,28.00,22.00,30.00,100,10,Spices & Salt,kg,1kg Vacuum Evaporated Iodized Salt\n" +
      "Dettol Original Soap 125g,DET-125G,8901030001041,55.00,45.00,60.00,60,8,Personal Care,pcs,Antiseptic Bathing Bar\n" +
      "Maggi 2-Minute Masala Noodles 70g,MAG-70G,8901030001058,14.00,11.50,15.00,120,15,Snacks & Instant Food,pcs,Instant Noodles Pack\n" +
      "Amul Butter 100g,BUTTER-100G,8901030001065,58.00,50.00,60.00,30,5,Dairy & Eggs,pcs,Pasteurized Butter\n";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'shopsilo_products_bulk_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. Handle File Selection & Parse
  const handleFileChange = (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.tsv') && !file.name.toLowerCase().endsWith('.txt')) {
      setErrorMessage('Kripya valid .CSV ya .TSV format ki spreadsheet file select karein.');
      return;
    }

    setErrorMessage('');
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const rows = parseDelimitedText(content);
      const items = mapRowsToProducts(rows);
      if (items.length === 0) {
        setErrorMessage('File me koi valid data rows nahi mili. Kripya template check karein.');
      }
      setParsedItems(items);
    };
    reader.onerror = () => {
      setErrorMessage('File read karne me error aayi.');
    };
    reader.readAsText(file);
  };

  // 3. Handle Pasted Text Change & Parse
  const handlePastedTextChange = (text) => {
    setPastedText(text);
    setErrorMessage('');
    if (!text.trim()) {
      setParsedItems([]);
      return;
    }
    const rows = parseDelimitedText(text);
    const items = mapRowsToProducts(rows);
    setParsedItems(items);
  };

  // 4. Reset Import Modal
  const handleReset = () => {
    setSelectedFile(null);
    setPastedText('');
    setParsedItems([]);
    setErrorMessage('');
    setImportResult(null);
    setUploadProgress(0);
    setUploadStatusText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 5. Chunked Batch Submit (100% reliable with clean number coercion)
  const handleImportSubmit = async () => {
    const validItems = parsedItems.filter(item => item._status !== 'error');
    if (validItems.length === 0) {
      setErrorMessage('Import karne ke liye koi valid products nahi hain.');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');
    setUploadProgress(0);

    const CHUNK_SIZE = 75; // Safe batch size
    const totalChunks = Math.ceil(validItems.length / CHUNK_SIZE);

    let totalImported = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    const accumulatedErrors = [];

    // Format clean JSON items strictly typed
    const cleanPayload = validItems.map((item) => ({
      name: String(item.name || '').trim(),
      sku: String(item.sku || '').trim(),
      barcode: item.barcode ? String(item.barcode).trim() : undefined,
      price: Number(item.price) || 0,
      cost_price: item.cost_price ? Number(item.cost_price) : undefined,
      compare_price: item.compare_price ? Number(item.compare_price) : undefined,
      stock_quantity: Math.max(0, Math.floor(Number(item.stock_quantity) || 0)),
      min_stock: Math.max(1, Math.floor(Number(item.min_stock) || 5)),
      category_name: item.category_name ? String(item.category_name).trim() : undefined,
      unit: item.unit ? String(item.unit).trim() : undefined,
      description: item.description ? String(item.description).trim() : undefined,
    }));

    try {
      for (let i = 0; i < totalChunks; i++) {
        const chunkStart = i * CHUNK_SIZE;
        const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, cleanPayload.length);
        const chunkItems = cleanPayload.slice(chunkStart, chunkEnd);

        setUploadStatusText(
          `Batch ${i + 1} of ${totalChunks} upload ho raha hai (${chunkStart + 1}-${chunkEnd} of ${cleanPayload.length} items)...`
        );

        const res = await productApi.bulkImportJSON(chunkItems, { updateExisting });
        const data = res?.data || res || {};

        totalImported += data.imported_count || 0;
        totalUpdated += data.updated_count || 0;
        totalSkipped += data.skipped_count || 0;

        if (Array.isArray(data.errors) && data.errors.length > 0) {
          accumulatedErrors.push(...data.errors);
        }

        const percent = Math.round(((i + 1) / totalChunks) * 100);
        setUploadProgress(percent);
      }

      // Collect any skipped rows from client-side invalid items
      const invalidClientItems = parsedItems.filter(item => item._status === 'error');
      if (invalidClientItems.length > 0) {
        totalSkipped += invalidClientItems.length;
        invalidClientItems.forEach(item => {
          accumulatedErrors.push(`Row ${item._rowIdx} ('${item.name || 'Unnamed'}'): ${item._statusReason}`);
        });
      }

      setImportResult({
        total_rows: parsedItems.length,
        imported_count: totalImported,
        updated_count: totalUpdated,
        skipped_count: totalSkipped,
        errors: accumulatedErrors,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Bulk import error:', err);
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Bulk import ke dauran server error aayi. Kripya dobara try karein.'
      );
    } finally {
      setIsUploading(false);
      setUploadStatusText('');
    }
  };

  // Preview filtering & search
  const filteredItems = useMemo(() => {
    return parsedItems.filter(item => {
      if (previewFilter === 'valid' && item._status === 'error') return false;
      if (previewFilter === 'errors' && item._status !== 'error') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (item.name || '').toLowerCase().includes(q);
        const matchesSku = (item.sku || '').toLowerCase().includes(q);
        const matchesCat = (item.category_name || '').toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesCat) return false;
      }
      return true;
    });
  }, [parsedItems, previewFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = parsedItems.length;
    const valid = parsedItems.filter(i => i._status !== 'error').length;
    const errors = parsedItems.filter(i => i._status === 'error').length;
    const autoSku = parsedItems.filter(i => i._status === 'auto_sku').length;
    return { total, valid, errors, autoSku };
  }, [parsedItems]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
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
          backgroundColor: 'var(--bg-surface, #ffffff)',
          borderRadius: '24px',
          border: '1px solid var(--border-subtle, #cbd5e1)',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, rgba(16, 185, 129, 0.06) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              }}
            >
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary, #0f172a)' }}>
                Bulk Product Import (CSV / Excel)
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', marginTop: '2px' }}>
                500+ items ek click me upload karein — Smart Category & Upsert Support
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                color: '#4f46e5',
                border: '1px solid rgba(79, 70, 229, 0.2)',
                borderRadius: '12px',
                padding: '8px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Download Sample CSV Template"
            >
              <Download size={15} />
              <span>Sample CSV Template</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--bg-surface-subtle, #f1f5f9)',
                border: 'none',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted, #64748b)',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* Result Banner after upload */}
          {importResult ? (
            <div
              style={{
                backgroundColor: 'var(--bg-surface-subtle, #f8fafc)',
                border: '1px solid var(--border-subtle, #e2e8f0)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#ecfdf5',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: '0 0 8px 0' }}>
                Bulk Import Successfully Completed!
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary, #64748b)', margin: 0 }}>
                Aapke store catalog me products add & update kar diye gaye hain.
              </p>

              {/* Stats Summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px',
                  margin: '20px 0',
                }}
              >
                <div style={{ padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '12px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>{importResult.total_rows}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Total Rows</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '12px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#059669' }}>+{importResult.imported_count}</div>
                  <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 700 }}>Newly Added</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '12px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#2563eb' }}>{importResult.updated_count}</div>
                  <div style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 700 }}>Stock Updated</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderRadius: '12px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#dc2626' }}>{importResult.skipped_count}</div>
                  <div style={{ fontSize: '0.72rem', color: '#b91c1c', fontWeight: 700 }}>Skipped / Errors</div>
                </div>
              </div>

              {/* Errors List */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div style={{ textAlign: 'left', marginTop: '16px', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '12px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#9f1239', marginBottom: '6px' }}>
                    Issues / Warnings ({importResult.errors.length}):
                  </div>
                  <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '0.75rem', color: '#881337', lineHeight: 1.5 }}>
                    {importResult.errors.map((err, idx) => (
                      <div key={idx}>• {err}</div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', fontWeight: 700, borderRadius: '12px' }}
                >
                  Doosri File Import Karein
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-primary"
                  style={{ padding: '10px 24px', fontWeight: 800, borderRadius: '12px' }}
                >
                  Done (Close)
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs: Upload File vs Paste Data */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  backgroundColor: 'var(--bg-surface-subtle, #f1f5f9)',
                  padding: '4px',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  maxWidth: '360px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: activeTab === 'file' ? 'var(--bg-surface, #ffffff)' : 'transparent',
                    color: activeTab === 'file' ? 'var(--color-primary, #4f46e5)' : 'var(--text-secondary, #64748b)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'file' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  📁 CSV File Upload
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: activeTab === 'paste' ? 'var(--bg-surface, #ffffff)' : 'transparent',
                    color: activeTab === 'paste' ? 'var(--color-primary, #4f46e5)' : 'var(--text-secondary, #64748b)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'paste' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  📋 Copy-Paste Table
                </button>
              </div>

              {/* Upload Dropzone */}
              {activeTab === 'file' ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileChange(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: dragOver ? '2px dashed #4f46e5' : '2px dashed var(--border-subtle, #cbd5e1)',
                    backgroundColor: dragOver ? 'rgba(79, 70, 229, 0.05)' : 'var(--bg-surface-subtle, #f8fafc)',
                    borderRadius: '16px',
                    padding: '30px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    marginBottom: '16px',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.tsv,.txt"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                  />
                  <Upload size={36} color="var(--color-primary, #4f46e5)" style={{ margin: '0 auto 10px auto' }} />
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary, #0f172a)' }}>
                    {selectedFile ? selectedFile.name : 'CSV ya Excel spreadsheet yahan drop karein'}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary, #64748b)', marginTop: '4px' }}>
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB • File Loaded` : 'ya browse karne ke liye click karein (.CSV / .TSV format)'}
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '16px' }}>
                  <textarea
                    rows={5}
                    placeholder="Excel ya Google Sheets se rows copy karke yahan paste karein (Name, Price, SKU, Stock...)"
                    value={pastedText}
                    onChange={(e) => handlePastedTextChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle, #cbd5e1)',
                      fontSize: '0.82rem',
                      fontFamily: 'monospace',
                      outline: 'none',
                      backgroundColor: 'var(--bg-surface, #ffffff)',
                      color: 'var(--text-primary, #0f172a)',
                    }}
                  />
                </div>
              )}

              {/* Error Alert */}
              {errorMessage && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecdd3',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#991b1b',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Data Preview Table */}
              {parsedItems.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                        Parsed Preview ({stats.total} products)
                      </span>
                      <span style={{ fontSize: '0.72rem', backgroundColor: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                        ✓ {stats.valid} Valid
                      </span>
                      {stats.errors > 0 && (
                        <span style={{ fontSize: '0.72rem', backgroundColor: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                          ⚠️ {stats.errors} Errors
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="search"
                        placeholder="Search preview..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle, #cbd5e1)',
                          fontSize: '0.76rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Scrollable table */}
                  <div
                    style={{
                      maxHeight: '260px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-subtle, #e2e8f0)',
                      borderRadius: '12px',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', textAlign: 'left' }}>
                      <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-surface-subtle, #f8fafc)', borderBottom: '1px solid var(--border-subtle, #e2e8f0)', zIndex: 2 }}>
                        <tr>
                          <th style={{ padding: '8px 12px', fontWeight: 800 }}>#</th>
                          <th style={{ padding: '8px 12px', fontWeight: 800 }}>Product Name</th>
                          <th style={{ padding: '8px 12px', fontWeight: 800 }}>SKU / Barcode</th>
                          <th style={{ padding: '8px 12px', fontWeight: 800 }}>Price</th>
                          <th style={{ padding: '8px 12px', fontWeight: 800 }}>Cost</th>
                          <th style={{ padding: '8px 12px', fontWeight: 800 }}>MRP</th>
                          <th style={{ padding: '8px 12px', fontWeight: 800 }}>Stock</th>
                          <th style={{ padding: '8px 12px', fontWeight: 800 }}>Category</th>
                          <th style={{ padding: '8px 12px', fontWeight: 800 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.map((item, idx) => (
                          <tr
                            key={idx}
                            style={{
                              borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
                              backgroundColor: item._status === 'error' ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                            }}
                          >
                            <td style={{ padding: '8px 12px', color: 'var(--text-muted, #94a3b8)' }}>{item._rowIdx}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text-primary, #0f172a)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.name || <span style={{ color: '#ef4444' }}>[Missing Name]</span>}
                            </td>
                            <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>
                              {item.sku || item.barcode || <span style={{ color: '#d97706', fontSize: '0.7rem' }}>Auto SKU</span>}
                            </td>
                            <td style={{ padding: '8px 12px', fontWeight: 800, color: '#2563eb' }}>₹{item.price}</td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-secondary, #64748b)' }}>{item.cost_price ? `₹${item.cost_price}` : '-'}</td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-muted, #94a3b8)' }}>{item.compare_price ? `₹${item.compare_price}` : '-'}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 700 }}>{item.stock_quantity}</td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-secondary, #64748b)' }}>{item.category_name || 'General'}</td>
                            <td style={{ padding: '8px 12px' }}>
                              {item._status === 'valid' ? (
                                <span style={{ color: '#059669', fontWeight: 700 }}>✓ Valid</span>
                              ) : item._status === 'auto_sku' ? (
                                <span style={{ color: '#d97706', fontWeight: 700 }}>⚡ Auto-SKU</span>
                              ) : (
                                <span style={{ color: '#dc2626', fontWeight: 700 }}>⚠️ {item._statusReason}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Options & Settings */}
              {parsedItems.length > 0 && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface-subtle, #f8fafc)',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                    <input
                      type="checkbox"
                      checked={updateExisting}
                      onChange={(e) => setUpdateExisting(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#4f46e5' }}
                    />
                    <span>Agar SKU/Barcode pehle se dukan me hai, toh Price & Stock update (Upsert) karein</span>
                  </label>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!importResult && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-subtle, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-surface, #ffffff)',
            }}
          >
            <div>
              {isUploading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <RefreshCw size={16} color="#4f46e5" className="spin" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4f46e5' }}>
                    {uploadStatusText || 'Uploading products...'} ({uploadProgress}%)
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="btn btn-secondary"
                style={{ padding: '10px 18px', fontWeight: 700, borderRadius: '12px' }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={isUploading || parsedItems.length === 0 || stats.valid === 0}
                className="btn btn-primary"
                style={{
                  padding: '10px 24px',
                  fontWeight: 800,
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: (isUploading || parsedItems.length === 0 || stats.valid === 0) ? 0.6 : 1,
                }}
              >
                {isUploading ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Importing ({uploadProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <PackagePlus size={16} />
                    <span>Start Import ({stats.valid} items)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkImportModal;
