/**
 * Thermal Printer Utility (58mm / 80mm ESC/POS Layout & Browser Print Formatter)
 */

export function formatThermalReceipt({
  shopName = 'ShopSilo Store',
  shopAddress = 'Local Market, Darbhanga',
  shopPhone = '9876543210',
  billNumber = 'BILL-' + Date.now().toString().slice(-6),
  date = new Date().toLocaleString(),
  customerName = 'Cash Customer',
  customerPhone = '',
  items = [],
  subtotal = 0,
  discount = 0,
  tax = 0,
  total = 0,
  paymentMode = 'CASH',
  upiId = '',
}) {
  const lineDivider = '--------------------------------';
  const doubleDivider = '================================';

  let text = '';
  text += `${centerText(shopName.toUpperCase())}\n`;
  text += `${centerText(shopAddress)}\n`;
  text += `${centerText('Tel: ' + shopPhone)}\n`;
  text += `${doubleDivider}\n`;
  text += `Bill No: ${billNumber}\n`;
  text += `Date: ${date}\n`;
  text += `Customer: ${customerName} ${customerPhone ? '(' + customerPhone + ')' : ''}\n`;
  text += `${lineDivider}\n`;
  text += `Item             Qty  Rate   Amt\n`;
  text += `${lineDivider}\n`;

  items.forEach((item) => {
    const name = (item.name || 'Item').slice(0, 15).padEnd(16);
    const qty = String(item.quantity || 1).padStart(3);
    const rate = String(item.price || item.unit_price || 0).padStart(5);
    const amt = String((item.price || item.unit_price || 0) * (item.quantity || 1)).padStart(6);
    text += `${name}${qty} ${rate} ${amt}\n`;
  });

  text += `${lineDivider}\n`;
  text += `Subtotal:                 ₹${subtotal.toFixed(2)}\n`;
  if (discount > 0) {
    text += `Discount:                -₹${discount.toFixed(2)}\n`;
  }
  if (tax > 0) {
    text += `GST / Tax:               +₹${tax.toFixed(2)}\n`;
  }
  text += `${doubleDivider}\n`;
  text += `GRAND TOTAL:              ₹${total.toFixed(2)}\n`;
  text += `Payment Mode:             ${paymentMode.toUpperCase()}\n`;
  text += `${doubleDivider}\n`;
  text += `${centerText('Thank You! Visit Again.')}\n`;
  text += `${centerText('Powered by ShopSilo Dukandar OS')}\n`;

  return text;
}

function centerText(str, width = 32) {
  if (str.length >= width) return str.slice(0, width);
  const leftPad = Math.floor((width - str.length) / 2);
  return ' '.repeat(leftPad) + str;
}

export function printReceiptWindow(receiptData) {
  const receiptText = formatThermalReceipt(receiptData);
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    alert('Please allow popups to print thermal receipt.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${receiptData.billNumber || 'ShopSilo'}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            width: 72mm;
            margin: 0 auto;
            padding: 10px 5px;
            color: black;
            background: white;
            white-space: pre-wrap;
          }
          .btn-print {
            display: block;
            width: 100%;
            padding: 8px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: bold;
            margin-bottom: 12px;
            cursor: pointer;
          }
          @media print {
            .btn-print { display: none; }
          }
        </style>
      </head>
      <body>
        <button class="btn-print" onclick="window.print()">Print Thermal Bill (ESC/POS)</button>
        <div>${receiptText}</div>
        <script>
          setTimeout(() => {
            window.print();
          }, 300);
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
