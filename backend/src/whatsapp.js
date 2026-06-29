const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const SUB_LABELS = {
  monthly: 'Monthly',
  quarterly: '3 Months',
  '6_months': '6 Months',
  yearly: 'Annual',
  annual: 'Annual',
};

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

async function sendTemplateMessage(phone, templateName, variables) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.log('[WhatsApp] Skipped — WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set');
    return { success: false, error: 'Not configured' };
  }

  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (!cleanPhone) return { success: false, error: 'No phone number' };

  const intlPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const body = {
    messaging_product: 'whatsapp',
    to: intlPhone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: variables.map(v => ({ type: 'text', text: String(v ?? '') })),
        },
      ],
    },
  };

  const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (response.ok) {
      console.log(`[WhatsApp] ${templateName} sent to ${intlPhone}`);
      return { success: true };
    }
    console.error(`[WhatsApp] Error sending ${templateName}:`, JSON.stringify(data));
    return { success: false, error: data };
  } catch (err) {
    console.error(`[WhatsApp] Network error sending ${templateName}:`, err.message);
    return { success: false, error: err.message };
  }
}

async function sendWelcomeMessage(member) {
  if (!member?.phone) return;
  return sendTemplateMessage(member.phone, 'welcome_new_member', [
    member.name,
    member.membership_id,
    SUB_LABELS[member.subscription_type] || member.subscription_type || '',
    fmtDate(member.due_date),
  ]);
}

async function sendPaymentReceipt(member, payment, receipt) {
  if (!member?.phone) return;
  return sendTemplateMessage(member.phone, 'payment_receipt', [
    member.name,
    receipt.id,
    payment.amount,
    payment.payment_method || payment.method || 'Cash',
    fmtDate(payment.paid_at || receipt.paid_date),
    fmtDate(member.due_date),
    `${process.env.FRONTEND_URL || ''}/receipt/${receipt.id}`,
  ]);
}

module.exports = { sendWelcomeMessage, sendPaymentReceipt, sendTemplateMessage };
