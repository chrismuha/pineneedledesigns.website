import { getEmailRecipients, getEmailSender, mailerConfigured, sendEmail } from './mailer.js';

const emailColors = Object.freeze({
  pageSurface: '#f7f7f7',
  cardSurface: '#ffffff',
  divider: '#eeeeee',
  secondaryText: '#666666',
});

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

export const sendOrderConfirmationEmails = async (order, { transactionId = '' } = {}) => {
  if (!mailerConfigured) {
    console.warn('Order emails skipped: mailer is not configured.');
    return;
  }

  const customer = order.customer || {};
  const billingAddress = order.billingAddress || {};
  const shippingAddress = order.shippingAddress || {};
  const summary = order.summary || {};
  const lineItems = Array.isArray(order.lineItems) ? order.lineItems : [];
  const orderLabel = order.orderNumber ? `#${order.orderNumber}` : String(order._id || '');
  const paymentRef = transactionId || order.gatewayOrderId || '';

  const lineItemsHtml = lineItems.map((line) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid ${emailColors.divider};">${line.title || 'Item'}</td>
      <td style="padding:10px;border-bottom:1px solid ${emailColors.divider};text-align:center;">${line.quantity || 1}</td>
      <td style="padding:10px;border-bottom:1px solid ${emailColors.divider};text-align:right;">${money(line.subtotal)}</td>
      <td style="padding:10px;border-bottom:1px solid ${emailColors.divider};text-align:right;">${money(line.lineTotal)}</td>
    </tr>
  `).join('');

  const adminHtml = `
    <div style="font-family:Arial,sans-serif;background:${emailColors.pageSurface};padding:20px;">
      <div style="max-width:900px;margin:auto;background:${emailColors.cardSurface};padding:20px;border-radius:10px;">
        <h2 style="margin:0;">New Clover Order Received</h2>
        <p style="color:${emailColors.secondaryText};">Order ${orderLabel}${paymentRef ? `<br>Payment reference: ${paymentRef}` : ''}</p>
        <hr>
        <h3>Customer</h3>
        <p>Type: ${customer.type || ''}<br>Email: ${customer.email || ''}<br>Phone: ${customer.phone || ''}</p>
        <h3>Billing Address</h3>
        <p>${billingAddress.name || ''}<br>${billingAddress.address1 || ''}<br>${billingAddress.address2 || ''}<br>${billingAddress.city || ''}, ${billingAddress.state || ''} ${billingAddress.zip || ''}</p>
        <h3>Shipping Address</h3>
        <p>${shippingAddress.name || ''}<br>${shippingAddress.address1 || ''}<br>${shippingAddress.address2 || ''}<br>${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zip || ''}</p>
        ${order.discountCode ? `<p><b>Discount Code:</b> ${order.discountCode}</p>` : ''}
        <hr>
        <h3>Items</h3>
        <table width="100%" cellpadding="0" cellspacing="0"><tbody>${lineItemsHtml}</tbody></table>
        <hr>
        <h3>Summary</h3>
        <p>Subtotal: <b>${money(summary.subtotal)}</b><br>Discount: <b>-${money(summary.discount)}</b><br>Shipping: <b>${money(summary.shipping)}</b><br>Tax: <b>${money(summary.tax)}</b><br><b style="font-size:16px;">Final Total: ${money(summary.finalTotal)}</b></p>
      </div>
    </div>
  `;

  const customerReceiptHtml = `
    <div style="font-family:Arial,sans-serif;background:${emailColors.pageSurface};padding:20px;">
      <div style="max-width:700px;margin:auto;background:${emailColors.cardSurface};padding:30px;border-radius:10px;">
        <h2 style="margin-top:0;">Thank you for your order!</h2>
        <p>Hi ${shippingAddress.name || 'there'},</p>
        <p>Your payment has been successfully received. Below is your receipt.</p>
        <hr>
        <p><strong>Order:</strong> ${orderLabel}<br><strong>Email:</strong> ${customer.email || ''}</p>
        <h3>Items</h3>
        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
          <tbody>
            ${lineItems.map((line) => `
              <tr>
                <td>${line.title || 'Item'}</td>
                <td align="center">${line.quantity || 1}</td>
                <td align="right">${money(line.lineTotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <hr>
        <h3>Summary</h3>
        <p>Subtotal: ${money(summary.subtotal)}<br>Discount: -${money(summary.discount)}<br>Shipping: ${money(summary.shipping)}<br>Tax: ${money(summary.tax)}<br><strong>Total Paid: ${money(summary.finalTotal)}</strong></p>
        <hr>
        <h3>Shipping Address</h3>
        <p>${shippingAddress.name || ''}<br>${shippingAddress.address1 || ''}<br>${shippingAddress.address2 || ''}<br>${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zip || ''}</p>
        <p style="margin-top:20px;">If you have any questions, call (315) 272-8928</p>
        <p>— Pine Needle Designs</p>
      </div>
    </div>
  `;

  const text = `NEW ORDER ${orderLabel}\nCustomer: ${customer.email || ''}\nTotal: ${money(summary.finalTotal)}`;

  try {
    const [adminInfo, customerInfo] = await Promise.all([
      sendEmail({
        from: `"Pine Needle Designs" <${getEmailSender()}>`,
        to: getEmailRecipients(),
        subject: `Order ${orderLabel}`,
        html: adminHtml,
        text,
      }),
      customer.email ? sendEmail({
        to: customer.email,
        subject: `Receipt for Order ${orderLabel}`,
        html: customerReceiptHtml,
        text: `Receipt for Order ${orderLabel} - Total: ${money(summary.finalTotal)}`,
      }) : Promise.resolve(null),
    ]);

    if (adminInfo?.messageId) console.log('Admin order email sent:', adminInfo.messageId);
    if (customerInfo?.messageId) console.log('Customer receipt sent:', customerInfo.messageId);
  } catch (mailErr) {
    console.error('Order email sending failed:', mailErr);
  }
};

export const sendOrderEventEmails = async (order, {
  kind,
  amount = 0,
  paymentUrl = '',
  reason = '',
} = {}) => {
  if (!mailerConfigured) {
    console.warn('Order event emails skipped: mailer is not configured.');
    return;
  }
  const label = order.orderNumber ? `#${order.orderNumber}` : String(order._id || '');
  const customerEmail = order.customer?.email || '';
  const names = {
    payment_required: 'Order change awaiting payment',
    payment_failed: 'Order change payment declined',
    changed: 'Order updated',
    canceled: 'Order canceled and refunded',
  };
  const title = names[kind] || 'Order update';
  const action = paymentUrl
    ? `<p><a href="${paymentUrl}" style="display:inline-block;padding:12px 18px;background:#166534;color:#fff;text-decoration:none;border-radius:8px;">Pay ${money(amount)} securely with Clover</a></p>`
    : '';
  const detail = kind === 'canceled'
    ? `The order was canceled. A refund of ${money(amount)} was submitted to the original payment method.`
    : kind === 'payment_failed'
      ? `The attempted additional payment of ${money(amount)} was declined. The original order was not changed.${reason ? ` Reason: ${reason}` : ''}`
      : kind === 'payment_required'
        ? `Pine Needle Designs proposed an update that adds ${money(amount)}. The original order will remain unchanged until payment succeeds.`
        : `The order was updated successfully.${amount ? ` Amount adjusted: ${money(Math.abs(amount))}.` : ''}`;
  const html = `<div style="font-family:Arial,sans-serif;background:${emailColors.pageSurface};padding:20px"><div style="max-width:700px;margin:auto;background:${emailColors.cardSurface};padding:28px;border-radius:10px"><h2>${title}</h2><p><strong>Order ${label}</strong></p><p>${detail}</p>${action}<p>— Pine Needle Designs</p></div></div>`;
  const text = `${title}\nOrder ${label}\n${detail}${paymentUrl ? `\nPay securely: ${paymentUrl}` : ''}`;
  await Promise.all([
    sendEmail({ from: `"Pine Needle Designs" <${getEmailSender()}>`, to: getEmailRecipients(), subject: `${title}: ${label}`, html, text }),
    customerEmail ? sendEmail({ to: customerEmail, subject: `${title}: ${label}`, html, text }) : Promise.resolve(null),
  ]);
};
