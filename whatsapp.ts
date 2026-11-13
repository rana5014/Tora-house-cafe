import { Order } from '../types';

/**
 * Normalizes WhatsApp phone number according to international click-to-chat rules:
 * Removes non-digits, leading +, leading zeros, and spaces.
 * Official Tora House destination: 966579165664
 */
export function formatWhatsAppNumber(rawPhone: string): string {
  // strip all non-digits
  let cleaned = rawPhone.replace(/\D/g, '');
  // if starts with 00, remove
  if (cleaned.startsWith('00')) cleaned = cleaned.slice(2);
  // if starts with 05, prepend 966 and remove leading 0 -> 9665...
  if (cleaned.startsWith('05')) cleaned = '966' + cleaned.slice(1);
  return cleaned || '966579165664';
}

/**
 * Builds the official formatted WhatsApp message for Tora House orders
 */
export function generateWhatsAppMessage(order: Order, lang: 'en' | 'ar' = 'en'): string {
  const isAr = lang === 'ar';

  const itemsList = order.items
    .map((item) => {
      const name = isAr ? item.product.nameAr : item.product.nameEn;
      const sizeText = item.customization.selectedSize
        ? ` (${isAr ? item.customization.selectedSize.nameAr : item.customization.selectedSize.nameEn})`
        : '';
      
      const addOnsText =
        item.customization.addOns && item.customization.addOns.length > 0
          ? `\n    + ${item.customization.addOns.map((a) => (isAr ? a.nameAr : a.nameEn)).join(', ')}`
          : '';

      const notesText = item.customization.specialInstructions
        ? `\n    ℹ️ ${item.customization.specialInstructions}`
        : '';

      const sweetnessText = item.customization.sweetnessLevel
        ? ` [Sugar: ${item.customization.sweetnessLevel}]`
        : '';
      
      const iceText = item.customization.iceLevel
        ? ` [Ice: ${item.customization.iceLevel}]`
        : '';

      return `• ${item.quantity}x ${name}${sizeText}${sweetnessText}${iceText} — SAR ${item.subtotal}${addOnsText}${notesText}`;
    })
    .join('\n');

  const orderTypeStr =
    order.orderType === 'pickup'
      ? isAr
        ? 'استلام من الفرع (Pickup)'
        : 'In-Store Pickup'
      : isAr
        ? 'توصيل للموقع (Delivery)'
        : 'Doorstep Delivery';

  const addressBlock =
    order.orderType === 'delivery' && order.customer.address
      ? `\n📍 ${isAr ? 'عنوان التوصيل' : 'Delivery Address'}: ${order.customer.address} (${order.customer.city || 'Riyadh'})`
      : '';

  const notesBlock = order.customer.notes
    ? `\n📝 ${isAr ? 'ملاحظات العميل' : 'Order Notes'}: ${order.customer.notes}`
    : '';

  if (isAr) {
    return `مرحباً كافيه بيت تورا! أرغب في تأكيد طلبي الجديد ☕✨

🔖 *رقم الطلب:* ${order.orderNumber}
👤 *اسم العميل:* ${order.customer.name}
📱 *رقم الجوال:* ${order.customer.phone}

🛒 *الأصناف المطلوبة:*
${itemsList}

-------------------------
💰 *المجموع الفرعي:* SAR ${order.subtotal}
🛵 *رسوم التوصيل:* ${order.deliveryFee > 0 ? `SAR ${order.deliveryFee}` : 'مجاني (Free)'}
💳 *الإجمالي الكلي:* SAR ${order.total}
📦 *طريقة الطلب:* ${orderTypeStr}${addressBlock}${notesBlock}

يرجى تأكيد استلام الطلب والبدء في تجهيزه. شكراً لكم!`;
  }

  return `Hello Tora House! I would like to place an order ☕✨

🔖 *Order Number:* ${order.orderNumber}
👤 *Customer Name:* ${order.customer.name}
📱 *Phone:* ${order.customer.phone}

🛒 *Items Ordered:*
${itemsList}

-------------------------
💰 *Subtotal:* SAR ${order.subtotal}
🛵 *Delivery Fee:* ${order.deliveryFee > 0 ? `SAR ${order.deliveryFee}` : 'FREE'}
💳 *Total:* SAR ${order.total}
📦 *Order Type:* ${orderTypeStr}${addressBlock}${notesBlock}

Please confirm my order and start preparation. Thank you!`;
}

/**
 * Generates the direct WhatsApp click-to-chat URL
 */
export function getWhatsAppUrl(destinationNumber: string, message: string): string {
  const cleanPhone = formatWhatsAppNumber(destinationNumber);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}
