/**
 * Universal Enterprise PDF & Print Generator for ShopSilo
 * Produces ultra-fast, executive-grade Tax Invoices, Khata Passbooks, and Mandi Procurement Sheets
 */

// Helper to format currency
const formatInr = (amount) => {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * 1. Generate & Print Official POS Tax Invoice / Thermal Receipt
 */
export function printPOSInvoice({ bill, shop, format = 'standard' }) {
  const isThermal = format === 'thermal';
  const shopName = shop?.name || 'ShopSilo Retail Store';
  const shopAddress = shop?.address || 'Local Market';
  const shopCity = shop?.city || '';
  const shopPhone = shop?.phone || shop?.whatsapp_number || '';
  const shopGstin = shop?.gstin || shop?.gst_number || '';
  const upiId = shop?.upi_id || shop?.upi || '';

  const billNumber = bill?.bill_number || 'BILL-' + Date.now().toString().slice(-6);
  const billDate = bill?.created_at ? new Date(bill.created_at).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
  const customerName = bill?.customer_name || 'Walk-in Customer';
  const customerPhone = bill?.customer_phone || '';
  const items = Array.isArray(bill?.items) ? bill.items : [];
  const subtotal = Number(bill?.subtotal || bill?.total_amount || 0);
  const discount = Number(bill?.discount_amount || 0);
  const finalAmount = Number(bill?.final_amount || bill?.total_amount || subtotal - discount);
  const paymentMethod = (bill?.payment_method || 'cash').toUpperCase();

  const qrData = `INVOICE:${billNumber}|AMOUNT:${finalAmount}|SHOP:${shopName}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=1&data=${encodeURIComponent(qrData)}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${billNumber}</title>
  <style>
    @page {
      margin: ${isThermal ? '2mm' : '10mm'};
      size: ${isThermal ? '80mm auto' : 'A5 portrait'};
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
    }
    body {
      padding: ${isThermal ? '6px' : '16px'};
      background: #ffffff;
      font-size: ${isThermal ? '11px' : '12px'};
      line-height: 1.35;
    }
    .header {
      text-align: center;
      border-bottom: 1.5px dashed #cbd5e1;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .store-name {
      font-size: ${isThermal ? '16px' : '20px'};
      font-weight: 900;
      color: #1e1b4b;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }
    .store-tag {
      font-size: 9px;
      font-weight: 800;
      color: #4f46e5;
      letter-spacing: 0.8px;
      margin-top: 1px;
    }
    .store-sub {
      font-size: 10px;
      color: #64748b;
      margin-top: 3px;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
      margin-bottom: 12px;
      font-size: 10.5px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
    }
    .meta-item strong {
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    th {
      background: #4f46e5;
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 6px 8px;
      text-align: left;
    }
    th.num, td.num {
      text-align: right;
    }
    th.center, td.center {
      text-align: center;
    }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 11px;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .item-name {
      font-weight: 700;
      color: #0f172a;
    }
    .item-brand {
      font-size: 9.5px;
      color: #64748b;
    }
    .summary-section {
      border-top: 1.5px dashed #cbd5e1;
      padding-top: 8px;
      margin-bottom: 12px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
      font-size: 11px;
      color: #475569;
    }
    .summary-row.discount {
      color: #16a34a;
      font-weight: 700;
    }
    .grand-total-box {
      background: #eef2ff;
      border: 1.5px solid #c7d2fe;
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 6px;
    }
    .grand-total-box .label {
      font-size: 12px;
      font-weight: 900;
      color: #3730a3;
      text-transform: uppercase;
    }
    .grand-total-box .amount {
      font-size: 16px;
      font-weight: 900;
      color: #4338ca;
    }
    .qr-footer {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
    }
    .qr-img {
      width: 64px;
      height: 64px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 2px;
    }
    .footer-note {
      text-align: center;
      margin-top: 14px;
      font-size: 9.5px;
      color: #94a3b8;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="store-name">${shopName}</div>
    <div class="store-tag">OFFICIAL RETAIL TAX INVOICE</div>
    <div class="store-sub">${shopAddress}${shopCity ? ', ' + shopCity : ''} ${shopPhone ? '• Tel: ' + shopPhone : ''}</div>
    ${shopGstin ? `<div class="store-sub">GSTIN: ${shopGstin}</div>` : ''}
  </div>

  <div class="meta-box">
    <div class="meta-item"><strong>Invoice No:</strong> ${billNumber}</div>
    <div class="meta-item" style="text-align: right;"><strong>Date:</strong> ${billDate}</div>
    <div class="meta-item"><strong>Customer:</strong> ${customerName} ${customerPhone ? '(' + customerPhone + ')' : ''}</div>
    <div class="meta-item" style="text-align: right;"><strong>Payment:</strong> ${paymentMethod}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 24px;" class="center">#</th>
        <th>Item Description</th>
        <th class="center" style="width: 36px;">Qty</th>
        <th class="num" style="width: 55px;">Rate</th>
        <th class="num" style="width: 65px;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((it, idx) => `
        <tr>
          <td class="center">${idx + 1}</td>
          <td>
            <div class="item-name">${it.name || it.product_name || 'Item'}</div>
            ${it.brand ? `<div class="item-brand">${it.brand}</div>` : ''}
          </td>
          <td class="center">${it.quantity || 1}</td>
          <td class="num">${formatInr(it.unit_price || it.price || 0)}</td>
          <td class="num" style="font-weight: 700;">${formatInr(it.total_price || (it.price || it.unit_price || 0) * (it.quantity || 1))}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="summary-section">
    <div class="summary-row">
      <span>Subtotal Items (${items.length}):</span>
      <span>${formatInr(subtotal)}</span>
    </div>
    ${discount > 0 ? `
      <div class="summary-row discount">
        <span>Special Discount / Bargain Savings:</span>
        <span>- ${formatInr(discount)}</span>
      </div>
    ` : ''}

    <div class="grand-total-box">
      <span class="label">Grand Total Paid:</span>
      <span class="amount">${formatInr(finalAmount)}</span>
    </div>
  </div>

  <div class="qr-footer">
    <img src="${qrUrl}" class="qr-img" alt="Invoice QR" />
    <div style="flex: 1;">
      <div style="font-weight: 800; font-size: 10px; color: #0f172a;">Digital Verification & Support</div>
      <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Scan with any Camera or UPI app for e-receipt or customer service.</div>
    </div>
  </div>

  <div class="footer-note">
    Thank you for supporting your neighborhood local store! • Powered by ShopSilo Retail OS
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank', 'width=750,height=900');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    // Fallback if popup blocker is active
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.bottom = '0';
    iframe.style.right = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    setTimeout(() => document.body.removeChild(iframe), 60000);
  }
}

/**
 * 2. Generate & Print Official Customer Khata Account Statement
 */
export function printKhataStatement({ customer, transactions = [], shop }) {
  const shopName = shop?.name || 'ShopSilo Retail Store';
  const shopAddress = shop?.address || 'Local Market';
  const shopPhone = shop?.phone || shop?.whatsapp_number || '';
  const customerName = customer?.name || customer?.customer_name || 'Khata Customer';
  const customerPhone = customer?.phone || customer?.customer_mobile || '';
  const totalCredit = Number(customer?.total_credit || 0);
  const totalPaid = Number(customer?.total_paid || 0);
  const netDue = Number(customer?.current_balance ?? customer?.balance ?? (totalCredit - totalPaid));
  const upiId = shop?.upi_id || shop?.upi || '';

  const upiPayUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${netDue}&cu=INR&tn=Khata-Clearance`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=1&data=${encodeURIComponent(upiPayUri)}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Khata Statement - ${customerName}</title>
  <style>
    @page { margin: 12mm; size: A4 portrait; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; }
    body { padding: 20px; background: #ffffff; font-size: 12px; line-height: 1.4; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 16px; }
    .store-title { font-size: 22px; font-weight: 900; color: #1e1b4b; text-transform: uppercase; }
    .store-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .badge { background: #e0e7ff; color: #4338ca; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 12px; display: inline-block; margin-top: 4px; }
    .statement-title { font-size: 16px; font-weight: 800; color: #0f172a; text-align: right; }
    .date-str { font-size: 11px; color: #64748b; margin-top: 2px; text-align: right; }
    .customer-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .stat-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .stat-val { font-size: 16px; font-weight: 900; color: #0f172a; margin-top: 2px; }
    .stat-val.due { color: #dc2626; }
    .stat-val.paid { color: #16a34a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #4f46e5; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 8px 10px; text-align: left; }
    th.num, td.num { text-align: right; }
    th.center, td.center { text-align: center; }
    td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11.5px; }
    tr:nth-child(even) td { background: #f8fafc; }
    .credit-badge { color: #dc2626; font-weight: 800; }
    .payment-badge { color: #16a34a; font-weight: 800; }
    .footer-upi-box { background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; margin-top: 20px; }
    .upi-qr { width: 80px; height: 80px; border-radius: 8px; border: 1px solid #cbd5e1; background: #ffffff; padding: 2px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="store-title">${shopName}</div>
      <div class="store-sub">${shopAddress} • Tel: ${shopPhone}</div>
      <div class="badge">OFFICIAL DIGITAL KHATA PASSBOOK</div>
    </div>
    <div>
      <div class="statement-title">ACCOUNT STATEMENT</div>
      <div class="date-str">Generated on: ${new Date().toLocaleDateString('en-IN')}</div>
    </div>
  </div>

  <div class="customer-card">
    <div>
      <div class="stat-label">Customer Name & Phone</div>
      <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px;">${customerName}</div>
      <div style="font-size: 11px; color: #64748b;">📞 +91 ${customerPhone}</div>
    </div>
    <div>
      <div class="stat-label">Total Credit (Jama)</div>
      <div class="stat-val">${formatInr(totalCredit)}</div>
      <div style="font-size: 10px; color: #16a34a;">Total Paid: ${formatInr(totalPaid)}</div>
    </div>
    <div>
      <div class="stat-label">Current Net Due (Baki)</div>
      <div class="stat-val due">${formatInr(netDue)}</div>
      <div style="font-size: 10px; color: #dc2626; font-weight: 700;">Status: ${netDue > 0 ? 'Payment Pending' : 'All Clear'}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 30px;" class="center">#</th>
        <th style="width: 90px;">Date & Time</th>
        <th>Description / Bill Details</th>
        <th style="width: 80px;" class="center">Type</th>
        <th class="num" style="width: 90px;">Credit (+)</th>
        <th class="num" style="width: 90px;">Payment (-)</th>
      </tr>
    </thead>
    <tbody>
      ${transactions.length === 0 ? `
        <tr>
          <td colspan="6" class="center" style="padding: 24px; color: #94a3b8;">No transaction history found for this account.</td>
        </tr>
      ` : transactions.map((t, idx) => {
        const isCredit = t.type === 'credit' || t.transaction_type === 'credit';
        const amt = Number(t.amount || 0);
        const tDate = t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN') : '-';
        return `
          <tr>
            <td class="center">${idx + 1}</td>
            <td>${tDate}</td>
            <td>
              <div style="font-weight: 700;">${t.notes || t.description || (isCredit ? 'Groceries & Staples Credit' : 'Payment Received')}</div>
              ${t.bill_number ? `<div style="font-size: 9.5px; color: #4f46e5;">Bill Ref: ${t.bill_number}</div>` : ''}
            </td>
            <td class="center">
              <span class="${isCredit ? 'credit-badge' : 'payment-badge'}">${isCredit ? 'CREDIT' : 'PAYMENT'}</span>
            </td>
            <td class="num" style="color: #dc2626; font-weight: ${isCredit ? '800' : '500'};">${isCredit ? '-' + formatInr(amt) : '-'}</td>
            <td class="num" style="color: #16a34a; font-weight: ${!isCredit ? '800' : '500'};">${!isCredit ? '+' + formatInr(amt) : '-'}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  ${netDue > 0 && upiId ? `
    <div class="footer-upi-box">
      <div>
        <div style="font-weight: 900; font-size: 13px; color: #166534;">Pay Outstanding Balance via UPI</div>
        <div style="font-size: 11px; color: #15803d; margin-top: 2px;">Scan with PhonePe, Google Pay, Paytm or BHIM to settle directly.</div>
        <div style="font-size: 11px; font-weight: 700; color: #166534; margin-top: 4px;">UPI ID: ${upiId}</div>
      </div>
      <img src="${qrUrl}" class="upi-qr" alt="UPI QR" />
    </div>
  ` : ''}

  <div style="text-align: center; margin-top: 24px; font-size: 10px; color: #94a3b8;">
    Verified Customer Statement • Powered by ShopSilo Retail OS
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  </script>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank', 'width=800,height=950');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

/**
 * 3. Generate & Print Mandi Wholesale Procurement Order Sheet
 */
export function printProcurementSheet({ items = [], shop, filterName = 'All Procurement' }) {
  const shopName = shop?.name || 'ShopSilo Retail Store';
  const totalEstimatedCost = items.reduce((acc, it) => acc + (Number(it.suggested_buy_price || it.buy_price || it.cost_price || 0) * (Number(it.reorder_quantity || it.shortage_qty || 1))), 0);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mandi Procurement List - ${shopName}</title>
  <style>
    @page { margin: 10mm; size: A4 portrait; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; }
    body { padding: 16px; background: #ffffff; font-size: 11.5px; line-height: 1.4; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px; }
    .title { font-size: 18px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
    .subtitle { font-size: 10.5px; color: #64748b; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #1e293b; color: #ffffff; font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 7px 8px; text-align: left; }
    th.num, td.num { text-align: right; }
    th.center, td.center { text-align: center; }
    td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
    tr:nth-child(even) td { background: #f8fafc; }
    .check-box { width: 14px; height: 14px; border: 1.5px solid #64748b; border-radius: 3px; display: inline-block; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">${shopName} - Mandi Procurement Sheet</div>
      <div class="subtitle">Filter: ${filterName} • Total Items to Buy: ${items.length}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-weight: 800; font-size: 12px;">Date: ${new Date().toLocaleDateString('en-IN')}</div>
      <div style="font-size: 11px; color: #4338ca; font-weight: 800;">Est. Cost: ${formatInr(totalEstimatedCost)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 24px;" class="center">Done</th>
        <th style="width: 24px;" class="center">#</th>
        <th>Item Name & Specifications</th>
        <th style="width: 70px;">Category</th>
        <th class="center" style="width: 60px;">Cur. Stock</th>
        <th class="center" style="width: 70px;">Buy Qty</th>
        <th class="num" style="width: 75px;">Est. Rate</th>
        <th class="num" style="width: 85px;">Est. Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((it, idx) => {
        const buyQty = Number(it.reorder_quantity || it.shortage_qty || it.procurement_quantity || 1);
        const rate = Number(it.suggested_buy_price || it.buy_price || it.cost_price || 0);
        return `
          <tr>
            <td class="center"><span class="check-box"></span></td>
            <td class="center">${idx + 1}</td>
            <td>
              <div style="font-weight: 700; color: #0f172a;">${it.name || it.product_name}</div>
              ${it.brand ? `<div style="font-size: 9.5px; color: #64748b;">Brand: ${it.brand}</div>` : ''}
            </td>
            <td>${it.category_name || it.category || 'General'}</td>
            <td class="center" style="color: ${Number(it.stock_quantity || 0) <= Number(it.min_stock_alert || 5) ? '#dc2626' : '#475569'}; font-weight: 700;">
              ${it.stock_quantity ?? 0}
            </td>
            <td class="center" style="font-weight: 800; color: #4338ca;">${buyQty} ${it.unit || 'pcs'}</td>
            <td class="num">${formatInr(rate)}</td>
            <td class="num" style="font-weight: 700;">${formatInr(rate * buyQty)}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  </script>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank', 'width=800,height=950');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
