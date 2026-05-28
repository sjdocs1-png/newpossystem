import React from 'react';
import { getStoreConfig } from '@/lib/billTemplate';

interface ReceiptData {
  billNumber: string;
  orderId: string;
  amount: number;
  paymentMode: string | null;
  customerName?: string;
  customerPhone?: string;
  items?: { name: string; quantity: number; price: number }[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  createdAt: string;
  providerOrderId?: string;
  providerPaymentId?: string;
}

/**
 * Generate a professional payment receipt HTML for printing
 */
export const generatePaymentReceipt = (data: ReceiptData): string => {
  const store = getStoreConfig();
  const storeName = store.businessName || 'Store';
  const storeAddress = store.address || '';
  const storePhone = store.phone || '';
  const date = new Date(data.createdAt).toLocaleString('en-IN');

  let itemsHtml = '';
  if (data.items && data.items.length > 0) {
    itemsHtml = `
      <table style="width:100%;border-collapse:collapse;margin:8px 0;">
        <thead>
          <tr style="border-bottom:1px dashed #666;">
            <th style="text-align:left;font-size:11px;padding:2px 0;">Item</th>
            <th style="text-align:center;font-size:11px;padding:2px 0;">Qty</th>
            <th style="text-align:right;font-size:11px;padding:2px 0;">Amt</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td style="font-size:11px;padding:2px 0;">${item.name}</td>
              <td style="text-align:center;font-size:11px;padding:2px 0;">${item.quantity}</td>
              <td style="text-align:right;font-size:11px;padding:2px 0;">₹${(item.price * item.quantity).toFixed(0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  return `
    <div style="width:280px;font-family:monospace;padding:10px;color:#000;">
      <div style="text-align:center;margin-bottom:8px;">
        <h2 style="margin:0;font-size:16px;">${storeName}</h2>
        ${storeAddress ? `<p style="margin:2px 0;font-size:10px;">${storeAddress}</p>` : ''}
        ${storePhone ? `<p style="margin:2px 0;font-size:10px;">Ph: ${storePhone}</p>` : ''}
      </div>
      <div style="text-align:center;border:1px solid #000;padding:4px;margin:8px 0;background:#f0f0f0;">
        <p style="margin:0;font-size:12px;font-weight:bold;">✅ PAYMENT RECEIPT</p>
      </div>
      <div style="font-size:11px;margin:6px 0;">
        <p style="margin:2px 0;">Bill No: <strong>#${data.billNumber}</strong></p>
        <p style="margin:2px 0;">Date: ${date}</p>
        ${data.customerName ? `<p style="margin:2px 0;">Customer: ${data.customerName}</p>` : ''}
        ${data.customerPhone ? `<p style="margin:2px 0;">Phone: ${data.customerPhone}</p>` : ''}
      </div>
      <div style="border-top:1px dashed #666;border-bottom:1px dashed #666;padding:4px 0;margin:6px 0;">
        ${itemsHtml}
      </div>
      <div style="font-size:11px;">
        ${data.subtotal ? `<p style="margin:2px 0;display:flex;justify-content:space-between;"><span>Subtotal:</span><span>₹${data.subtotal.toFixed(0)}</span></p>` : ''}
        ${data.tax && data.tax > 0 ? `<p style="margin:2px 0;display:flex;justify-content:space-between;"><span>Tax:</span><span>₹${data.tax.toFixed(0)}</span></p>` : ''}
        ${data.discount && data.discount > 0 ? `<p style="margin:2px 0;display:flex;justify-content:space-between;"><span>Discount:</span><span>-₹${data.discount.toFixed(0)}</span></p>` : ''}
      </div>
      <div style="border-top:2px solid #000;margin:6px 0;padding-top:4px;">
        <p style="margin:0;font-size:16px;font-weight:bold;display:flex;justify-content:space-between;">
          <span>TOTAL PAID:</span>
          <span>₹${data.amount.toFixed(0)}</span>
        </p>
      </div>
      <div style="font-size:10px;margin:8px 0;padding:4px;border:1px dashed #666;">
        <p style="margin:2px 0;">Payment Mode: <strong>${(data.paymentMode || 'UPI').toUpperCase()}</strong></p>
        ${data.providerOrderId ? `<p style="margin:2px 0;">Ref: ${data.providerOrderId}</p>` : ''}
        <p style="margin:2px 0;">Status: <strong>✅ PAID</strong></p>
      </div>
      <div style="text-align:center;margin-top:10px;font-size:10px;">
        <p style="margin:2px 0;">Thank you for your payment!</p>
        <p style="margin:2px 0;">🙏 Visit Again 🙏</p>
      </div>
    </div>
  `;
};

/**
 * Generate WhatsApp receipt message for payment
 */
export const generateWhatsAppReceipt = (data: ReceiptData): string => {
  const store = getStoreConfig();
  const storeName = store.businessName || 'Store';
  const date = new Date(data.createdAt).toLocaleString('en-IN');

  const lines = [
    `✅ *Payment Receipt*`,
    `🏪 *${storeName}*`,
    `Bill: #${data.billNumber}`,
    `Date: ${date}`,
    '',
  ];

  if (data.items && data.items.length > 0) {
    lines.push('📋 *Items:*');
    data.items.forEach(item => {
      lines.push(`  ${item.name} x${item.quantity} = ₹${(item.price * item.quantity).toFixed(0)}`);
    });
    lines.push('');
  }

  if (data.subtotal) lines.push(`Subtotal: ₹${data.subtotal.toFixed(0)}`);
  if (data.tax && data.tax > 0) lines.push(`Tax: ₹${data.tax.toFixed(0)}`);
  if (data.discount && data.discount > 0) lines.push(`Discount: -₹${data.discount.toFixed(0)}`);
  
  lines.push(`💰 *Total Paid: ₹${data.amount.toFixed(0)}*`);
  lines.push(`💳 Mode: ${(data.paymentMode || 'UPI').toUpperCase()}`);
  if (data.providerOrderId) lines.push(`Ref: ${data.providerOrderId}`);
  lines.push('');
  lines.push(`Thank you${data.customerName ? `, ${data.customerName}` : ''}! 🙏`);
  if (store.phone) lines.push(`📞 ${store.phone}`);

  return lines.join('\n');
};

/**
 * Auto-send payment receipt via WhatsApp after payment success
 */
export const autoSendPaymentReceipt = (data: ReceiptData) => {
  if (!data.customerPhone) return;

  setTimeout(() => {
    try {
      let phone = data.customerPhone!.replace(/[\s()-]/g, '');
      if (!phone.startsWith('+')) {
        if (phone.startsWith('0')) phone = phone.substring(1);
        phone = '91' + phone;
      } else {
        phone = phone.substring(1);
      }
      const message = encodeURIComponent(generateWhatsAppReceipt(data));
      const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('WhatsApp receipt send failed:', error);
    }
  }, 1500);
};
