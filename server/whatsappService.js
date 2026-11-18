// Native Node 18+ global fetch used

/**
 * Meta WhatsApp Business Cloud API Integration
 * Official Graph API v21.0
 * Sends order notifications ONLY to the Tora House Owner's WhatsApp (+966579165664).
 */

const DEFAULT_OWNER_PHONE = '966579165664';

export function formatOwnerWhatsAppMessage(order) {
  const itemsText = order.items
    .map((item) => {
      const sizeText = item.customization?.selectedSize
        ? ` (${item.customization.selectedSize.nameEn})`
        : '';
      const addOns = item.customization?.addOns?.length
        ? ` + ${item.customization.addOns.map((a) => a.nameEn).join(', ')}`
        : '';
      return `${item.quantity}x ${item.product.nameEn}${sizeText} – SAR ${item.subtotal}${addOns}`;
    })
    .join('\n');

  const instructions = order.items
    .map((item) => item.customization?.specialInstructions)
    .filter(Boolean)
    .concat(order.customer?.notes ? [order.customer.notes] : [])
    .join('; ');

  const orderTypeDisplay =
    order.orderType === 'pickup'
      ? 'Pickup'
      : `Delivery (Address: ${order.customer.address || 'Not specified'}, ${order.customer.city || 'Riyadh'})`;

  return `TORA HOUSE – NEW ORDER!

Order Number: ${order.orderNumber}

Customer: ${order.customer.name}
Customer Phone: ${order.customer.phone}

ORDER DETAILS:

${itemsText}

Subtotal: SAR ${order.subtotal}
Delivery Fee: SAR ${order.deliveryFee}
TOTAL: SAR ${order.total}

Order Type: ${orderTypeDisplay}

Special Instructions: ${instructions || 'None'}

Order Status: NEW ORDER – PENDING

Please prepare this order.`;
}

export async function sendWhatsAppOrderNotification(order) {
  const token = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_API_TOKEN || '';
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  const ownerDestination = process.env.OWNER_WHATSAPP_DESTINATION || DEFAULT_OWNER_PHONE;

  // Clean destination phone (digits only, e.g. 966579165664)
  const cleanRecipient = ownerDestination.replace(/\D/g, '');

  if (!token || !phoneNumberId) {
    return {
      success: false,
      status: 'credentials_missing',
      error: 'Meta WhatsApp Cloud API credentials not configured in .env (META_WHATSAPP_TOKEN and META_PHONE_NUMBER_ID required).',
    };
  }

  const messageBody = formatOwnerWhatsAppMessage(order);

  try {
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanRecipient,
        type: 'text',
        text: {
          preview_url: false,
          body: messageBody,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const errMsg = data.error?.message || `HTTP ${response.status} from Meta WhatsApp API`;
      console.error('[WhatsApp Service] Meta Cloud API Error:', data.error || data);
      return {
        success: false,
        status: 'failed',
        error: errMsg,
        details: data.error,
      };
    }

    const messageId = data.messages && data.messages[0] ? data.messages[0].id : 'sent_ok';
    console.log(`[WhatsApp Service] Successfully dispatched order ${order.orderNumber} to owner WhatsApp ${cleanRecipient} (MsgID: ${messageId})`);

    return {
      success: true,
      status: 'sent',
      messageId,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[WhatsApp Service] Network exception sending WhatsApp:', err);
    return {
      success: false,
      status: 'failed',
      error: err.message || 'Network exception communicating with Meta WhatsApp API',
    };
  }
}
