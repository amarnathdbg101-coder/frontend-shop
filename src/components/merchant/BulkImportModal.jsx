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
  Sparkles,
  Info,
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

// Clean numbers (strip currency symbols, commas, scientific notation)
function sanitizeNumber(val, defaultVal = 0) {
  if (val === undefined || val === null) return defaultVal;
  let str = String(val).trim();
  str = str.replace(/[₹Rs\.INR,\s]/gi, '');
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

  // 5. Chunked Batch Submit (Safe against timeouts and 100% reliable)
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

    // Strip client-only fields before API dispatch
    const cleanPayload = validItems.map(({ _rowIdx, _status, _statusReason, ...rest }) => rest);

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
        return matchesName || matchesSku || matchesCat;
      }
      return true;
    });
  }, [parsedItems, previewFilter, searchQuery]);

  const validCount = useMemo(() => parsedItems.filter(i => i._status !== 'error').length, [parsedItems]);
  const errorCount = useMemo(() => parsedItems.filter(i => i._status === 'error').length, [parsedItems]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface, #ffffff)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-subtle, rgba(226, 232, 240, 0.8))',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, rgba(99, 102, 241, 0.04), rgba(236, 72, 153, 0.04))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                color: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                Bulk Product Import (CSV / Excel)
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>
                Apni dukan ke 500+ products 1-click me catalog me add ya update karein
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="btn btn-outline btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: '10px',
                padding: '6px 12px',
              }}
            >
              <Download size={15} />
              <span>Sample Template (.CSV)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              style={{
                background: 'none',
                border: 'none',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                color: 'var(--text-secondary, #64748b)',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* ERROR NOTIFICATION BANNER */}
          {errorMessage && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.85rem',
                marginBottom: '16px',
                fontWeight: 600,
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>{errorMessage}</div>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* SCREEN 1: SUCCESS RESULT VIEW */}
          {importResult ? (
            <div style={{ padding: '10px 0', animation: 'fadeIn 0.25s ease' }}>
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px 16px',
                  backgroundColor: 'rgba(34, 197, 94, 0.05)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: '16px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                  }}
                >
                  <CheckCircle2 size={32} />
                </div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                  Bulk Import Safaltapoorvak Pura Hua!
                </h4>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary, #64748b)' }}>
                  Aapke products catalog me successfully sync ho chuke hain.
                </p>
              </div>

              {/* STATS METRIC GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'var(--bg-surface-subtle, #f8fafc)', border: '1px solid var(--border-subtle, #e2e8f0)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase' }}>Total Parsed</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary, #0f172a)', marginTop: '4px' }}>{importResult.total_rows}</div>
                </div>

                <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>Naye Added</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#16a34a', marginTop: '4px' }}>{importResult.imported_count}</div>
                </div>

                <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4338ca', textTransform: 'uppercase' }}>Updated Existing</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#6366f1', marginTop: '4px' }}>{importResult.updated_count || 0}</div>
                </div>

                <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a16207', textTransform: 'uppercase' }}>Skipped / Errors</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ca8a04', marginTop: '4px' }}>{importResult.skipped_count || 0}</div>
                </div>
              </div>

              {/* ERROR / SKIPPED DETAILS LIST */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#b45309', marginBottom: '8px' }}>
                    <AlertTriangle size={16} />
                    <span>Skipped Rows & Diagnostics ({importResult.errors.length}):</span>
                  </div>
                  <div
                    style={{
                      maxHeight: '140px',
                      overflowY: 'auto',
                      backgroundColor: 'rgba(254, 243, 199, 0.4)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      fontSize: '0.78rem',
                      fontFamily: 'var(--font-family-mono, monospace)',
                      color: '#92400e',
                    }}
                  >
                    {importResult.errors.map((msg, i) => (
                      <div key={i} style={{ marginBottom: '4px' }}>• {msg}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-outline"
                  style={{ borderRadius: '10px', padding: '10px 18px', fontWeight: 700, fontSize: '0.88rem' }}
                >
                  Ek Aur File Import Karein
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-primary"
                  style={{ borderRadius: '10px', padding: '10px 24px', fontWeight: 800, fontSize: '0.88rem' }}
                >
                  Ho Gaya (Catalog Dekhein)
                </button>
              </div>
            </div>
          ) : isUploading ? (
            /* SCREEN 2: LIVE UPLOADING CHUNKS & PROGRESS BAR */
            <div style={{ padding: '36px 16px', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  color: '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}
              >
                <RefreshCw size={30} className="animate-spin" />
              </div>

              <h4 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 800 }}>
                Products Catalog Me Import Ho Rahe Hain...
              </h4>
              <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {uploadStatusText || 'Kripya intezaar karein, products database me save ho rahe hain.'}
              </p>

              {/* Animated Progress Bar */}
              <div
                style={{
                  maxWidth: '480px',
                  margin: '0 auto 12px auto',
                  height: '10px',
                  backgroundColor: 'var(--bg-surface-subtle, #f1f5f9)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${uploadProgress}%`,
                    backgroundColor: '#6366f1',
                    borderRadius: '10px',
                    transition: 'width 0.3s ease-in-out',
                    background: 'linear-gradient(90deg, #6366f1, #ec4899)',
                  }}
                />
              </div>

              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#6366f1' }}>
                {uploadProgress}% Complete
              </div>
            </div>
          ) : (
            /* SCREEN 3: IMPORT WIZARD (FILE / PASTE & LIVE PREVIEW) */
            <>
              {/* TABS */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
                  marginBottom: '16px',
                  paddingBottom: '2px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderBottom: activeTab === 'file' ? '2px solid #6366f1' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    color: activeTab === 'file' ? '#6366f1' : 'var(--text-secondary, #64748b)',
                    fontWeight: activeTab === 'file' ? 800 : 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Upload size={16} />
                  <span>Upload .CSV File</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderBottom: activeTab === 'paste' ? '2px solid #6366f1' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    color: activeTab === 'paste' ? '#6366f1' : 'var(--text-secondary, #64748b)',
                    fontWeight: activeTab === 'paste' ? 800 : 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <FileText size={16} />
                  <span>Excel Sheet Rows Paste Karein</span>
                </button>
              </div>

              {/* TAB 1: FILE DRAG & DROP */}
              {activeTab === 'file' && (
                <div style={{ marginBottom: '16px' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,.tsv,.txt"
                    onChange={(e) => handleFileChange(e.target.files[0])}
                    style={{ display: 'none' }}
                  />

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
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
                      border: dragOver ? '2px dashed #6366f1' : '2px dashed var(--border-subtle, #cbd5e1)',
                      borderRadius: '16px',
                      padding: '24px 20px',
                      textAlign: 'center',
                      backgroundColor: dragOver ? 'rgba(99, 102, 241, 0.04)' : 'var(--bg-surface-subtle, #f8fafc)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: selectedFile ? 'rgba(34, 197, 94, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                        color: selectedFile ? '#16a34a' : '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 10px auto',
                      }}
                    >
                      {selectedFile ? <FileCheck size={26} /> : <Upload size={24} />}
                    </div>

                    <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {selectedFile ? selectedFile.name : 'CSV file yahan Drag & Drop karein ya Browse karein'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {selectedFile
                        ? `${(selectedFile.size / 1024).toFixed(1)} KB • ${parsedItems.length} products detect hue`
                        : 'Supported formats: .CSV (Comma Separated) ya .TSV (Tab Separated)'}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PASTE RAW TEXT */}
              {activeTab === 'paste' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                    Excel sheet se rows copy karke yahan paste karein:
                  </label>
                  <textarea
                    rows={4}
                    placeholder={`Name, SKU, Price, CostPrice, Stock, Category\nFortune Oil 1L, OIL-FS-1L, 145, 130, 50, Edible Oils\nTata Salt 1kg, SALT-1K, 28, 24, 100, Spices & Salt\nAashirvaad Atta 5kg, ATTA-5K, 240, 215, 30, Atta & Flour`}
                    value={pastedText}
                    onChange={(e) => handlePastedTextChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle, #cbd5e1)',
                      backgroundColor: 'var(--bg-surface, #ffffff)',
                      color: 'var(--text-primary, #0f172a)',
                      fontFamily: 'var(--font-family-mono, monospace)',
                      fontSize: '0.82rem',
                      lineHeight: '1.5',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Tip: Excel ya Google Sheets se multiple rows copy (Ctrl+C) karke yahan paste (Ctrl+V) karein.
                  </div>
                </div>
              )}

              {/* ADVANCED SETTINGS / UPSERT TOGGLE */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-surface-subtle, #f8fafc)',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      color: '#6366f1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Update Existing Products (Upsert)
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      Agar SKU / Barcode pehle se catalog me hai, to uska Price, MRP aur Stock update kar diya jayega.
                    </div>
                  </div>
                </div>

                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      inset: 0,
                      backgroundColor: updateExisting ? '#6366f1' : '#cbd5e1',
                      borderRadius: '24px',
                      transition: '0.2s',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        content: '""',
                        height: '18px',
                        width: '18px',
                        left: updateExisting ? '22px' : '3px',
                        bottom: '3px',
                        backgroundColor: '#ffffff',
                        borderRadius: '50%',
                        transition: '0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                    />
                  </span>
                </label>
              </div>

              {/* LIVE PARSED PRODUCTS PREVIEW TABLE */}
              {parsedItems.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  {/* PREVIEW TOOLBAR & FILTERS */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Live Preview ({parsedItems.length} Products)
                      </span>

                      {/* Filter Chips */}
                      <button
                        type="button"
                        onClick={() => setPreviewFilter('all')}
                        style={{
                          border: 'none',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor: previewFilter === 'all' ? '#0f172a' : '#f1f5f9',
                          color: previewFilter === 'all' ? '#ffffff' : '#64748b',
                        }}
                      >
                        All ({parsedItems.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewFilter('valid')}
                        style={{
                          border: 'none',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor: previewFilter === 'valid' ? '#16a34a' : 'rgba(34, 197, 94, 0.1)',
                          color: previewFilter === 'valid' ? '#ffffff' : '#15803d',
                        }}
                      >
                        ✓ Ready ({validCount})
                      </button>

                      {errorCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setPreviewFilter('errors')}
                          style={{
                            border: 'none',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            backgroundColor: previewFilter === 'errors' ? '#dc2626' : 'rgba(239, 68, 68, 0.1)',
                            color: previewFilter === 'errors' ? '#ffffff' : '#dc2626',
                          }}
                        >
                          ⚠ Needs Fix ({errorCount})
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Search in preview */}
                      <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                          type="text"
                          placeholder="Filter preview..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{
                            padding: '4px 8px 4px 28px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-subtle, #cbd5e1)',
                            fontSize: '0.76rem',
                            width: '130px',
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleReset}
                        style={{
                          border: 'none',
                          background: 'none',
                          color: '#ef4444',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: '4px 6px',
                        }}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* PREVIEW TABLE */}
                  <div
                    style={{
                      border: '1px solid var(--border-subtle, #e2e8f0)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      backgroundColor: 'var(--bg-surface, #ffffff)',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--bg-surface-subtle, #f8fafc)', borderBottom: '1px solid var(--border-subtle, #e2e8f0)' }}>
                          <th style={{ padding: '8px 10px', fontWeight: 700, width: '40px' }}>#</th>
                          <th style={{ padding: '8px 10px', fontWeight: 700, width: '70px' }}>Status</th>
                          <th style={{ padding: '8px 10px', fontWeight: 700 }}>Product Naam</th>
                          <th style={{ padding: '8px 10px', fontWeight: 700 }}>SKU / Barcode</th>
                          <th style={{ padding: '8px 10px', fontWeight: 700 }}>Price</th>
                          <th style={{ padding: '8px 10px', fontWeight: 700 }}>Cost</th>
                          <th style={{ padding: '8px 10px', fontWeight: 700 }}>MRP</th>
                          <th style={{ padding: '8px 10px', fontWeight: 700 }}>Stock</th>
                          <th style={{ padding: '8px 10px', fontWeight: 700 }}>Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.slice(0, 100).map((item, idx) => (
                          <tr
                            key={idx}
                            style={{
                              borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
                              backgroundColor: item._status === 'error' ? 'rgba(239, 68, 68, 0.04)' : idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)',
                            }}
                          >
                            <td style={{ padding: '8px 10px', color: 'var(--text-secondary, #64748b)' }}>{item._rowIdx}</td>
                            <td style={{ padding: '8px 10px' }}>
                              {item._status === 'valid' ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#16a34a', fontWeight: 700, fontSize: '0.72rem' }}>
                                  <Check size={12} /> Ready
                                </span>
                              ) : item._status === 'auto_sku' ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#6366f1', fontWeight: 700, fontSize: '0.72rem' }}>
                                  <Sparkles size={12} /> Auto
                                </span>
                              ) : (
                                <span title={item._statusReason} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#dc2626', fontWeight: 700, fontSize: '0.72rem' }}>
                                  <AlertCircle size={12} /> Fix
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {item.name || <span style={{ color: '#ef4444' }}>[Missing Name]</span>}
                            </td>
                            <td style={{ padding: '8px 10px', fontFamily: 'var(--font-family-mono, monospace)', color: 'var(--text-secondary)' }}>
                              {item.sku || item.barcode || <span style={{ color: '#6366f1' }}>[Auto-Gen]</span>}
                            </td>
                            <td style={{ padding: '8px 10px', fontWeight: 800, color: '#16a34a' }}>
                              ₹{item.price}
                            </td>
                            <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                              {item.cost_price ? `₹${item.cost_price}` : '—'}
                            </td>
                            <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                              {item.compare_price ? `₹${item.compare_price}` : '—'}
                            </td>
                            <td style={{ padding: '8px 10px', fontWeight: 700 }}>
                              {item.stock_quantity}
                            </td>
                            <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                              {item.category_name || 'General Store'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredItems.length > 100 && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px', textAlign: 'right' }}>
                      ...aur {filteredItems.length - 100} products (Total preview: {filteredItems.length})
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!importResult && !isUploading && (
          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--border-subtle, #f1f5f9)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-surface-subtle, #f8fafc)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ borderRadius: '10px', padding: '8px 18px', fontWeight: 700 }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={validCount === 0}
              className="btn btn-primary"
              style={{
                borderRadius: '10px',
                padding: '10px 24px',
                fontWeight: 800,
                opacity: validCount === 0 ? 0.6 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              }}
            >
              <PackagePlus size={18} />
              <span>
                {validCount > 0
                  ? `Import ${validCount} Products Now`
                  : 'File Select Karein'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
