import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  PackagePlus,
  ClipboardList,
  Sparkles,
  Info,
  RefreshCw,
} from 'lucide-react';
import { productApi } from '../../api/product.api';

export const BulkImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('file'); // 'file' | 'paste'
  const [selectedFile, setSelectedFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // 1. Download Sample CSV Import Template
  const handleDownloadTemplate = () => {
    try {
      const templateURL = productApi.getImportTemplateUrl();
      window.open(templateURL, '_blank');
    } catch {
      // Fallback: Generate template client-side
      const csvHeader = 'Name,SKU,Price,CostPrice,StockQuantity,MinStock,Description\n' +
        'Fortune Sunflower Oil 1L,OIL-FS-1L,145,130,50,10,Refined Cooking Oil\n' +
        'Tata Salt 1kg,SALT-TATA-1K,28,24,100,20,Iodized Table Salt\n' +
        'Aashirvaad Atta 5kg,ATTA-AASH-5K,240,215,30,5,Whole Wheat Flour\n' +
        'Parle-G Biscuit 100g,PARLE-G-100G,10,8.5,150,25,Glucose Biscuits\n' +
        'Maggi 2-Minute Noodles 70g,MAGGI-70G,14,12,80,15,Instant Masala Noodles\n';
      
      const blob = new Blob([csvHeader], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'shopsilo_products_import_template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Robust CSV line tokenizer that handles quotes, commas inside strings, and escapes
  const parseCSVLine = (line, delimiter = ',') => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map((c) => c.replace(/^["']|["']$/g, '').trim());
  };

  // 2. Parse CSV text into items
  const parseCSVContent = (content, fileName = '') => {
    try {
      setErrorMessage('');
      
      // Strip UTF-8 BOM if present
      if (content.charCodeAt(0) === 0xfeff) {
        content = content.slice(1);
      }

      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

      if (lines.length === 0) {
        setErrorMessage('CSV file khali hai, koi product rows nahi mili.');
        setParsedItems([]);
        return;
      }

      // Detect separator: comma (,), semicolon (;), or tab (\t)
      const firstLine = lines[0];
      let delimiter = ',';
      if (firstLine.includes('\t')) {
        delimiter = '\t';
      } else if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) {
        delimiter = ';';
      }

      // Check if line 0 is a header
      const firstLineLower = firstLine.toLowerCase();
      const hasHeader =
        firstLineLower.includes('name') ||
        firstLineLower.includes('price') ||
        firstLineLower.includes('mrp') ||
        firstLineLower.includes('sku') ||
        firstLineLower.includes('rate') ||
        firstLineLower.includes('stock') ||
        firstLineLower.includes('title');

      let startIndex = 0;
      let nameIdx = 0;
      let skuIdx = -1;
      let priceIdx = 1;
      let costIdx = -1;
      let stockIdx = 2;
      let minIdx = -1;
      let descIdx = -1;

      if (hasHeader) {
        startIndex = 1;
        const header = parseCSVLine(lines[0], delimiter).map((h) => h.toLowerCase());

        nameIdx = header.findIndex((h) => h.includes('name') || h.includes('item') || h.includes('title'));
        skuIdx = header.findIndex((h) => h.includes('sku') || h.includes('code') || h.includes('barcode'));
        priceIdx = header.findIndex((h) => h.includes('price') || h.includes('mrp') || h.includes('rate'));
        costIdx = header.findIndex((h) => h.includes('cost') || h.includes('buy') || h.includes('wholesale'));
        stockIdx = header.findIndex((h) => h.includes('stock') || h.includes('qty') || h.includes('quantity'));
        minIdx = header.findIndex((h) => h.includes('min') || h.includes('threshold'));
        descIdx = header.findIndex((h) => h.includes('desc') || h.includes('detail'));

        if (nameIdx === -1) nameIdx = 0;
        if (priceIdx === -1) priceIdx = 1;
      }

      const items = [];

      for (let i = startIndex; i < lines.length; i++) {
        const row = parseCSVLine(lines[i], delimiter);
        if (row.length === 0) continue;

        const name = nameIdx < row.length ? row[nameIdx] : '';
        if (!name) continue;

        const priceStr = priceIdx < row.length ? row[priceIdx] : '0';
        const price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));

        const sku = skuIdx !== -1 && skuIdx < row.length ? row[skuIdx] : undefined;
        const costStr = costIdx !== -1 && costIdx < row.length ? row[costIdx] : '';
        const costPrice = costStr ? parseFloat(costStr.replace(/[^0-9.]/g, '')) : undefined;

        const stockStr = stockIdx !== -1 && stockIdx < row.length ? row[stockIdx] : '10';
        const stockQty = parseInt(stockStr.replace(/[^0-9]/g, ''), 10);

        const minStr = minIdx !== -1 && minIdx < row.length ? row[minIdx] : '5';
        const minStock = parseInt(minStr.replace(/[^0-9]/g, ''), 10);

        const desc = descIdx !== -1 && descIdx < row.length ? row[descIdx] : undefined;

        items.push({
          name,
          sku: sku || undefined,
          price: isNaN(price) || price <= 0 ? 10 : price,
          cost_price: isNaN(costPrice) ? undefined : costPrice,
          stock_quantity: isNaN(stockQty) ? 10 : stockQty,
          min_stock: isNaN(minStock) ? 5 : minStock,
          description: desc || undefined,
        });
      }

      if (items.length === 0) {
        setErrorMessage('Data me se koi valid product parse nahi ho paya.');
        setParsedItems([]);
        return;
      }

      setParsedItems(items);
    } catch (err) {
      console.error('CSV Parsing Error:', err);
      setErrorMessage('CSV format padhne me dikkat aayi. Kripya template check karein.');
    }
  };

  // 3. File upload handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.type.includes('csv') && !file.type.includes('text')) {
      setErrorMessage('Kripya sirf .csv file chunein');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        parseCSVContent(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => {
    setDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result;
        if (typeof content === 'string') {
          parseCSVContent(content, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  // 4. Handle Pasted Text Change
  const handlePastedTextChange = (text) => {
    setPastedText(text);
    if (text.trim()) {
      parseCSVContent(text, 'Pasted Data');
    } else {
      setParsedItems([]);
    }
  };

  // 5. Submit bulk import to backend API
  const handleImportSubmit = async () => {
    if (parsedItems.length === 0 && !selectedFile) {
      setErrorMessage('Import karne ke liye pehle CSV file upload karein ya data paste karein.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      let res;
      if (selectedFile) {
        res = await productApi.bulkImportCSV(selectedFile);
      } else {
        res = await productApi.bulkImportJSON(parsedItems);
      }

      setImportResult(res.data || res || { total_imported: parsedItems.length, message: 'All items imported' });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Bulk Import Error:', err);
      setErrorMessage(err.message || err.response?.data?.message || 'Bulk import karne me error aaya');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPastedText('');
    setParsedItems([]);
    setErrorMessage('');
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '740px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-floating)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(124, 58, 237, 0.06) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(79, 70, 229, 0.12)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Bulk CSV / Excel Saman Import
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                Ek sath 500+ products direct CSV ya Excel sheet se dukan me jodein
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-outline btn-sm"
            style={{ padding: '6px', borderRadius: '50%', border: 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {importResult ? (
            /* Success Summary View */
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-success-light)',
                  color: 'var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}
              >
                <CheckCircle2 size={38} />
              </div>

              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Products Safaltapoorvak Import Ho Gaye!
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px auto' }}>
                {importResult.total_imported || importResult.imported_count || parsedItems.length} naye items aapke
                inventory catalog me update kar diye gaye hain.
              </p>

              <div
                style={{
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  maxWidth: '380px',
                  margin: '0 auto 24px auto',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Imported:</span>
                  <strong style={{ color: 'var(--color-success)' }}>
                    {importResult.total_imported || importResult.imported_count || parsedItems.length} Products
                  </strong>
                </div>
                {importResult.skipped_count > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Skipped / Duplicates:</span>
                    <strong>{importResult.skipped_count}</strong>
                  </div>
                )}
                {importResult.failed_count > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Errors:</span>
                    <strong style={{ color: 'var(--color-danger)' }}>{importResult.failed_count}</strong>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-secondary"
                  style={{ padding: '10px 18px' }}
                >
                  <RefreshCw size={15} /> Aur Import Karein
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-primary"
                  style={{ padding: '10px 22px' }}
                >
                  Inventory Dekhein
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Selector */}
              <div className="tab-pills" style={{ marginBottom: '16px' }}>
                <button
                  type="button"
                  className={`tab-pill ${activeTab === 'file' ? 'active' : ''}`}
                  onClick={() => setActiveTab('file')}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Upload size={15} /> <span>CSV File Upload Karein</span>
                </button>
                <button
                  type="button"
                  className={`tab-pill ${activeTab === 'paste' ? 'active' : ''}`}
                  onClick={() => setActiveTab('paste')}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <ClipboardList size={15} /> <span>Excel / Text Paste Karein</span>
                </button>
              </div>

              {/* Sample Template Download Hint Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: 'rgba(79, 70, 229, 0.06)',
                  border: '1px solid rgba(79, 70, 229, 0.18)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Info size={18} color="var(--color-primary)" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    Sahi column format ke liye hamara sample CSV template download karein
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="btn btn-secondary btn-sm"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--color-primary)',
                    color: 'var(--color-primary)',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    gap: '4px',
                  }}
                >
                  <Download size={14} />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {errorMessage && (
                <div
                  style={{
                    backgroundColor: 'var(--color-danger-light)',
                    color: 'var(--color-danger)',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.84rem',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* TAB 1: CSV FILE UPLOAD */}
              {activeTab === 'file' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--border-strong)'}`,
                      borderRadius: 'var(--radius-lg)',
                      padding: '36px 20px',
                      textAlign: 'center',
                      backgroundColor: dragOver ? 'var(--color-primary-light)' : 'var(--bg-surface-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      marginBottom: '16px',
                    }}
                  >
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px auto',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <Upload size={24} />
                    </div>

                    <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {selectedFile ? selectedFile.name : 'CSV file yahan drag & drop karein ya Click karein'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {selectedFile
                        ? `${(selectedFile.size / 1024).toFixed(1)} KB — ${parsedItems.length} products detect hue`
                        : 'Supported formats: .CSV (Comma-separated values), Max 10MB'}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PASTE EXCEL / CSV TEXT */}
              {activeTab === 'paste' && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    Excel sheet se rows copy karke yahan paste karein:
                  </label>
                  <textarea
                    className="form-input"
                    rows={5}
                    placeholder={`Name, SKU, Price, CostPrice, Stock\nFortune Oil 1L, OIL-FS-1L, 145, 130, 50\nTata Salt 1kg, SALT-1K, 28, 24, 100\nAashirvaad Atta 5kg, ATTA-5K, 240, 215, 30`}
                    value={pastedText}
                    onChange={(e) => handlePastedTextChange(e.target.value)}
                    style={{
                      fontFamily: 'var(--font-family-mono)',
                      fontSize: '0.82rem',
                      lineHeight: '1.5',
                      whiteSpace: 'pre',
                    }}
                  />
                  <div className="form-hint">
                    Hint: Excel ya Google Sheets se seedha copy-paste kar sakte hain. Columns: Naam, SKU, Price, Cost Price, Stock.
                  </div>
                </div>
              )}

              {/* LIVE PARSED PRODUCTS PREVIEW TABLE */}
              {parsedItems.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      🔍 Live Preview ({parsedItems.length} Products Tayyar)
                    </span>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.74rem', padding: '3px 8px', color: 'var(--color-danger)' }}
                    >
                      Clear All
                    </button>
                  </div>

                  <div
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      backgroundColor: 'var(--bg-surface)',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--bg-surface-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                          <th style={{ padding: '8px 10px', fontWeight: 700 }}>#</th>
                          <th style={{ padding: '8px 10px', fontWeight: 700 }}>Product Naam</th>
                          <th style={{ padding: '8px 10px', fontWeight: 700 }}>SKU Code</th>
                          <th style={{ padding: '8px 10px', fontWeight: 700 }}>Selling Price</th>
                          <th style={{ padding: '8px 10px', fontWeight: 700 }}>Cost Price</th>
                          <th style={{ padding: '8px 10px', fontWeight: 700 }}>Stock Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedItems.slice(0, 50).map((item, idx) => (
                          <tr
                            key={idx}
                            style={{
                              borderBottom: '1px solid var(--border-subtle)',
                              backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)',
                            }}
                          >
                            <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{idx + 1}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {item.name}
                            </td>
                            <td style={{ padding: '8px 10px', fontFamily: 'var(--font-family-mono)', color: 'var(--text-secondary)' }}>
                              {item.sku || '—'}
                            </td>
                            <td style={{ padding: '8px 10px', fontWeight: 800, color: 'var(--color-primary)' }}>
                              ₹{item.price}
                            </td>
                            <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                              {item.cost_price ? `₹${item.cost_price}` : '—'}
                            </td>
                            <td style={{ padding: '8px 10px', fontWeight: 700 }}>
                              {item.stock_quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {parsedItems.length > 50 && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px', textAlign: 'right' }}>
                      ...aur {parsedItems.length - 50} products (Total: {parsedItems.length})
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!importResult && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-surface-subtle)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={loading || parsedItems.length === 0}
              className="btn btn-primary"
              style={{
                padding: '10px 24px',
                fontWeight: 800,
                opacity: parsedItems.length === 0 ? 0.6 : 1,
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Import Ho Raha Hai...</span>
                </>
              ) : (
                <>
                  <PackagePlus size={16} />
                  <span>
                    {parsedItems.length > 0
                      ? `${parsedItems.length} Products Import Karein`
                      : 'File Chunein'}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
