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
    throw new Error('Order emails cannot be sent because the mailer is not configured.');
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
      <td style="padding:10px;border-bottom:1px solid ${emailColors.divider};"><strong>${line.title || 'Item'}</strong></td>
      <td style="padding:10px;border-bottom:1px solid ${emailColors.divider};text-align:center;">${line.quantity || 1}</td>
      <td style="padding:10px;border-bottom:1px solid ${emailColors.divider};text-align:right;">${money(line.subtotal)}</td>
      <td style="padding:10px;border-bottom:1px solid ${emailColors.divider};text-align:right;">${money(line.lineTotal)}</td>
    </tr>
  `).join('');

  const adminHtml = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.6;color:#17212b;overflow-wrap:anywhere;word-break:break-word;background:${emailColors.pageSurface};padding:20px;">
      <div style="max-width:900px;margin:auto;background:${emailColors.cardSurface};padding:20px;border-radius:10px;">
        <h1 style="font-size:34px;line-height:1.3;margin:0;">New Clover Order Received</h1>
        <p style="color:${emailColors.secondaryText};">Order ${orderLabel}${paymentRef ? `<br>Payment reference: ${paymentRef}` : ''}</p>
        <hr>
        <h2 style="font-size:28px;line-height:1.35;">Customer</h2>
        <p><strong>Type:</strong> ${customer.type || ''}<br><strong>Email:</strong> ${customer.email || ''}<br><strong>Phone:</strong> ${customer.phone || ''}</p>
        <h2 style="font-size:28px;line-height:1.35;">Billing Address</h2>
        <p>${billingAddress.name || ''}<br>${billingAddress.address1 || ''}<br>${billingAddress.address2 || ''}<br>${billingAddress.city || ''}, ${billingAddress.state || ''} ${billingAddress.zip || ''}</p>
        <h2 style="font-size:28px;line-height:1.35;">Shipping Address</h2>
        <p>${shippingAddress.name || ''}<br>${shippingAddress.address1 || ''}<br>${shippingAddress.address2 || ''}<br>${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zip || ''}</p>
        ${order.discountCode ? `<p><b>Discount Code:</b> ${order.discountCode}</p>` : ''}
        <hr>
        <h2 style="font-size:28px;line-height:1.35;">Items</h2>
        <table aria-label="Order items" width="100%" cellpadding="0" cellspacing="0" style="font-size:22px;line-height:1.6;"><thead><tr><th scope="col" style="text-align:left;padding:8px;font-size:22px;">Item</th><th scope="col" style="text-align:left;padding:8px;font-size:22px;">Quantity</th><th scope="col" style="text-align:left;padding:8px;font-size:22px;">Subtotal</th><th scope="col" style="text-align:left;padding:8px;font-size:22px;">Total</th></tr></thead><tbody>${lineItemsHtml}</tbody></table>
        <hr>
        <h2 style="font-size:28px;line-height:1.35;">Summary</h2>
        <p><strong>Subtotal:</strong> <b>${money(summary.subtotal)}</b><br><strong>Discount:</strong> <b>-${money(summary.discount)}</b><br><strong>Shipping:</strong> <b>${money(summary.shipping)}</b><br><strong>Tax:</strong> <b>${money(summary.tax)}</b><br><b style="font-size:28px;">Final Total: ${money(summary.finalTotal)}</b></p>
      </div>
    </div>
  `;

  const customerReceiptHtml = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.6;color:#17212b;overflow-wrap:anywhere;word-break:break-word;background:${emailColors.pageSurface};padding:20px;">
      <div style="max-width:700px;margin:auto;background:${emailColors.cardSurface};padding:30px;border-radius:10px;">
        <h1 style="font-size:34px;line-height:1.3;margin-top:0;">Thank you for your order!</h1>
        <p>Hi ${shippingAddress.name || 'there'},</p>
        <p>Your payment has been successfully received. Below is your receipt.</p>
        <hr>
        <p><strong>Order:</strong> ${orderLabel}<br><strong>Email:</strong> ${customer.email || ''}</p>
        <h2 style="font-size:28px;line-height:1.35;">Items</h2>
        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:22px;line-height:1.6;" aria-label="Order items">
          <thead><tr><th scope="col" style="text-align:left;padding:8px;font-size:22px;">Item</th><th scope="col" style="text-align:left;padding:8px;font-size:22px;">Quantity</th><th scope="col" style="text-align:left;padding:8px;font-size:22px;">Total</th></tr></thead><tbody>
            ${lineItems.map((line) => `
              <tr>
                <td><strong>${line.title || 'Item'}</strong></td>
                <td align="center">${line.quantity || 1}</td>
                <td align="right">${money(line.lineTotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <hr>
        <h2 style="font-size:28px;line-height:1.35;">Summary</h2>
        <p><strong>Subtotal:</strong> ${money(summary.subtotal)}<br><strong>Discount:</strong> -${money(summary.discount)}<br><strong>Shipping:</strong> ${money(summary.shipping)}<br><strong>Tax:</strong> ${money(summary.tax)}<br><strong>Total Paid: ${money(summary.finalTotal)}</strong></p>
        <hr>
        <h2 style="font-size:28px;line-height:1.35;">Shipping Address</h2>
        <p>${shippingAddress.name || ''}<br>${shippingAddress.address1 || ''}<br>${shippingAddress.address2 || ''}<br>${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zip || ''}</p>
        <p style="margin-top:20px;">If you have any questions, call (315) 272-8928</p>
        <p>— Pine Needle Designs</p>
      </div>
    </div>
  `;

  const text = `NEW ORDER ${orderLabel}\nCustomer: ${customer.email || ''}\nTotal: ${money(summary.finalTotal)}`;

  const results = await Promise.allSettled([
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
  const [adminResult, customerResult] = results;
  if (adminResult.status === 'fulfilled' && adminResult.value?.messageId) console.log('Admin order email sent:', adminResult.value.messageId);
  if (customerResult.status === 'fulfilled' && customerResult.value?.messageId) console.log('Customer receipt sent:', customerResult.value.messageId);
  const failures = results.filter((result) => result.status === 'rejected');
  if (failures.length) {
    throw new AggregateError(failures.map((result) => result.reason), 'One or more order emails failed to send.');
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
    return {
      customerNotificationAttempted: Boolean(order.customer?.email),
      customerNotified: false,
    };
  }
  const label = order.orderNumber ? `#${order.orderNumber}` : String(order._id || '');
  const customerEmail = order.customer?.email || '';
  const names = {
    payment_required: 'Order change awaiting payment',
    payment_failed: 'Order change payment declined',
    changed: 'Order updated',
    canceled: 'Order canceled and refunded',
    refunded_only: 'Order payment refunded',
  };
  const title = names[kind] || 'Order update';
  const action = paymentUrl
    ? `<p><a href="${paymentUrl}" style="display:inline-block;padding:12px 18px;background:#166534;color:#fff;text-decoration:none;border-radius:8px;">Pay ${money(amount)} securely with Clover</a></p>`
    : '';
  const detail = kind === 'canceled'
    ? `The order was canceled. A refund of ${money(amount)} was submitted to the original payment method.`
    : kind === 'refunded_only'
      ? `A refund of ${money(amount)} was submitted to the original payment method. The order itself remains on file.`
    : kind === 'payment_failed'
      ? `The attempted additional payment of ${money(amount)} was declined. The original order was not changed.${reason ? ` Reason: ${reason}` : ''}`
      : kind === 'payment_required'
        ? `Pine Needle Designs proposed an update that adds ${money(amount)}. The original order will remain unchanged until payment succeeds.`
        : `The order was updated successfully.${amount ? ` Amount adjusted: ${money(Math.abs(amount))}.` : ''}`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.6;color:#17212b;overflow-wrap:anywhere;word-break:break-word;background:${emailColors.pageSurface};padding:20px"><div style="max-width:700px;margin:auto;background:${emailColors.cardSurface};padding:28px;border-radius:10px"><h1 style="font-size:34px;line-height:1.3;">${title}</h1><p><strong>Order ${label}</strong></p><p>${detail}</p>${action}<p>— Pine Needle Designs</p></div></div>`;
  const text = `${title}\nOrder ${label}\n${detail}${paymentUrl ? `\nPay securely: ${paymentUrl}` : ''}`;
  const results = await Promise.allSettled([
    sendEmail({ from: `"Pine Needle Designs" <${getEmailSender()}>`, to: getEmailRecipients(), subject: `${title}: ${label}`, html, text }),
    customerEmail ? sendEmail({ to: customerEmail, subject: `${title}: ${label}`, html, text }) : Promise.resolve(null),
  ]);
  const failures = results.filter((result) => result.status === 'rejected');
  if (failures.length) {
    const error = new AggregateError(failures.map((result) => result.reason), 'One or more order-event emails failed to send.');
    error.customerNotificationAttempted = Boolean(customerEmail);
    error.customerNotified = Boolean(customerEmail) && results[1].status === 'fulfilled';
    throw error;
  }
  return {
    customerNotificationAttempted: Boolean(customerEmail),
    customerNotified: Boolean(customerEmail),
  };
};
