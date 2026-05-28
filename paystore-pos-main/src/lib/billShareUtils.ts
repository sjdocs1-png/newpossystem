/**
 * Utility to auto-share bill via WhatsApp and Email after printing
 * No preview, no extra buttons - fully automatic
 */

import { toast } from 'sonner';
import { getStoreConfig } from '@/lib/billTemplate';

interface BillShareData {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  billNumber: string;
  total: number;
  storeName?: string;
  items?: { name: string; quantity: number; price: number }[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  date?: string;
}

/**
 * Generate a plain-text bill summary for WhatsApp
 */
const generateWhatsAppMessage = (data: BillShareData): string => {
  const store = getStoreConfig();
  const storeName = data.storeName || store.businessName || 'Our Store';
  const date = data.date || new Date().toLocaleString();
  
  const lines = [
    `🧾 *Bill from ${storeName}*`,
    `Bill No: #${data.billNumber}`,
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
  lines.push(`*Total: ₹${data.total}*`);
  lines.push('');
  lines.push(`Thank you${data.customerName ? `, ${data.customerName}` : ''}! 🙏`);
  if (store.phone) lines.push(`📞 ${store.phone}`);

  return lines.join('\n');
};

/**
 * Generate email body (plain text, no HTML)
 */
const generateEmailBody = (data: BillShareData): string => {
  const store = getStoreConfig();
  const storeName = data.storeName || store.businessName || 'Our Store';
  const date = data.date || new Date().toLocaleString();
  
  const lines = [
    `Bill from ${storeName}`,
    `Bill No: #${data.billNumber}`,
    `Date: ${date}`,
    '',
  ];

  if (data.items && data.items.length > 0) {
    lines.push('Items:');
    data.items.forEach(item => {
      lines.push(`  ${item.name} x${item.quantity} = ₹${(item.price * item.quantity).toFixed(0)}`);
    });
    lines.push('');
  }

  if (data.subtotal) lines.push(`Subtotal: ₹${data.subtotal.toFixed(0)}`);
  if (data.tax && data.tax > 0) lines.push(`Tax: ₹${data.tax.toFixed(0)}`);
  if (data.discount && data.discount > 0) lines.push(`Discount: -₹${data.discount.toFixed(0)}`);
  lines.push(`Total: ₹${data.total}`);
  lines.push('');
  lines.push(`Thank you${data.customerName ? `, ${data.customerName}` : ''}!`);
  if (store.address) lines.push(`Address: ${store.address}`);
  if (store.phone) lines.push(`Phone: ${store.phone}`);

  return lines.join('\n');
};

/**
 * Auto-send bill via WhatsApp (opens WhatsApp with pre-filled message)
 */
export const sendBillViaWhatsApp = (data: BillShareData) => {
  if (!data.customerPhone) return;

  try {
    let phone = data.customerPhone.replace(/[\s()-]/g, '');
    if (!phone.startsWith('+')) {
      if (phone.startsWith('0')) phone = phone.substring(1);
      phone = '91' + phone;
    } else {
      phone = phone.substring(1);
    }

    const message = encodeURIComponent(generateWhatsAppMessage(data));
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  } catch (error) {
    console.error('WhatsApp share failed:', error);
  }
};

/**
 * Auto-send bill via Email (opens default mail client)
 */
export const sendBillViaEmail = (data: BillShareData) => {
  if (!data.customerEmail) return;

  try {
    const store = getStoreConfig();
    const storeName = store.businessName || 'Our Store';
    const subject = encodeURIComponent(`Bill #${data.billNumber} from ${storeName}`);
    const body = encodeURIComponent(generateEmailBody(data));
    
    const mailtoUrl = `mailto:${data.customerEmail}?subject=${subject}&body=${body}`;
    window.open(mailtoUrl, '_self');
  } catch (error) {
    console.error('Email share failed:', error);
  }
};

/**
 * Auto-share bill after print - sends via WhatsApp and/or email
 * Called automatically after print completes - NO user interaction
 */
export const autoShareBillAfterPrint = (data: BillShareData) => {
  setTimeout(() => {
    if (data.customerPhone) {
      sendBillViaWhatsApp(data);
      toast.success(`Bill sent to WhatsApp: ${data.customerPhone}`);
    }
    if (data.customerEmail) {
      sendBillViaEmail(data);
      if (!data.customerPhone) {
        toast.success(`Bill sent to email: ${data.customerEmail}`);
      }
    }
  }, 1000);
};
