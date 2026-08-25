import { config } from '../config/index.js';
import { isCloverConfigured } from '../config/clover.js';
import { BOOKING_DEPOSITS } from '../constants/index.js';
import { createHostedCheckoutSession, findSuccessfulPaymentForSession } from '../services/cloverService.js';
import { getEmailRecipients, mailerConfigured, sendEmail } from '../services/mailer.js';
import { sendPushNotification } from '../services/pushNotifications.js';

const bookingDepositMap = new Map();
const finalizedBookingDeposits = new Map();

const splitCustomerName = (fullName = '') => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: 'Customer', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
};

export const CLOVER_BOOKING_DEPOSITS_AVAILABLE = () => (
  config.clover.bookingDepositsEnabled && isCloverConfigured()
);

const buildBookingRedirectUrls = (service) => {
  const baseUrl = String(config.appBaseUrl || '').replace(/\/$/, '');
  if (baseUrl.startsWith('https://')) {
    return {
      success: `${baseUrl}/booking-payment-success?session_id={CHECKOUT_SESSION_ID}`,
      failure: `${baseUrl}/booking/${service}?cancelled=1`,
      cancel: `${baseUrl}/booking/${service}?cancelled=1`,
    };
  }
  if (!config.isProduction) {
    return undefined;
  }
  return null;
};

const finalizeBookingDeposit = async ({
  checkoutSessionId,
  cloverPaymentId,
  deposit,
  booking,
}) => {
  const existing = finalizedBookingDeposits.get(checkoutSessionId);
  if (existing) {
    return existing;
  }

  if (deposit && mailerConfigured) {
    const paymentReference = cloverPaymentId || checkoutSessionId;
    const details = [
      `${booking.title} paid: $${booking.amount}`,
      `Name: ${deposit.customer.name}`,
      `Email: ${deposit.customer.email}`,
      `Phone: ${deposit.customer.phone}`,
      `Clover payment: ${paymentReference}`,
    ].join('\n');
    const notifications = [
      sendEmail({
        to: getEmailRecipients(),
        subject: `${booking.title} paid by ${deposit.customer.name}`,
        text: details,
      }),
      deposit.customer.email ? sendEmail({
        to: deposit.customer.email,
        subject: `Booking deposit received: ${booking.title}`,
        text: [
          `Your ${booking.title.toLowerCase()} deposit of $${booking.amount} was received.`,
          `Payment reference: ${paymentReference}`,
          'Pine Needle Designs will follow up with booking details.',
        ].join('\n'),
      }) : Promise.resolve(null),
    ];
    Promise.allSettled(notifications).then((results) => {
      results.forEach((result) => {
        if (result.status === 'rejected') console.error('Booking deposit email failed:', result.reason);
      });
    });
  }

  if (deposit) {
    try {
      await sendPushNotification({
        title: `New ${booking.title}`,
        body: `${deposit.customer.name} paid $${booking.amount}. Tap for booking details.`,
        url: `/dashboard?notice=booking&service=${encodeURIComponent(deposit.service)}&payment=${encodeURIComponent(cloverPaymentId || checkoutSessionId)}`,
        tag: `booking-${checkoutSessionId}`,
        type: 'booking',
      });
    } catch (pushErr) {
      console.error('Booking push notification failed:', pushErr);
    }
  }

  const result = {
    success: true,
    service: deposit.service,
    title: booking.title,
    amount: booking.amount,
    bookingUrl: booking.calendarUrl,
    paymentId: cloverPaymentId || checkoutSessionId,
  };

  finalizedBookingDeposits.set(checkoutSessionId, result);
  bookingDepositMap.delete(checkoutSessionId);
  return result;
};

export const tryFinalizeBookingDepositFromWebhook = async (checkoutSessionId, cloverPaymentId) => {
  const deposit = bookingDepositMap.get(checkoutSessionId);
  if (!deposit) return null;

  const booking = BOOKING_DEPOSITS[deposit.service];
  if (!booking) return null;

  return finalizeBookingDeposit({
    checkoutSessionId,
    cloverPaymentId,
    deposit,
    booking,
  });
};

export const getBookingDepositConfig = (_req, res) => {
  res.json({ enabled: CLOVER_BOOKING_DEPOSITS_AVAILABLE() });
};

export const createBookingDeposit = async (req, res) => {
  try {
    if (!CLOVER_BOOKING_DEPOSITS_AVAILABLE()) {
      return res.status(503).json({
        error: 'Online deposit checkout is temporarily unavailable. Please refresh the page or try again in a few minutes. You have not been charged.',
      });
    }

    const { service, customer } = req.body || {};
    const booking = BOOKING_DEPOSITS[service];

    if (!booking) {
      return res.status(400).json({ error: 'We could not find that appointment type. Please return to the booking menu and choose an appointment again.' });
    }

    if (!customer?.name?.trim() || !customer?.email?.trim() || !customer?.phone?.trim()) {
      return res.status(400).json({ error: 'Please enter your name, email address, and phone number before continuing to payment.' });
    }

    const redirectUrls = buildBookingRedirectUrls(service);
    if (redirectUrls === null) {
      return res.status(422).json({
        error: 'Deposit checkout requires HTTPS. Please contact the store for assistance.',
      });
    }

    const amountCents = Math.round(Number(booking.amount) * 100);
    const { firstName, lastName } = splitCustomerName(customer.name);
    const phoneDigits = String(customer.phone || '').replace(/\D/g, '').slice(-10);

    const checkoutSession = await createHostedCheckoutSession({
      lineItems: [{
        name: booking.title,
        price: amountCents,
        unitQty: 1,
      }],
      customer: {
        firstName,
        lastName,
        email: customer.email.trim(),
        phoneNumber: phoneDigits,
      },
      redirectUrls,
      idempotencyKey: `booking-${service}-${Date.now()}`,
    });

    const checkoutSessionId = String(checkoutSession?.checkoutSessionId || '');
    const checkoutUrl = String(checkoutSession?.href || '');
    if (!checkoutSessionId || !checkoutUrl) {
      return res.status(502).json({ error: 'Payment checkout could not be started. Please try again.' });
    }

    bookingDepositMap.set(checkoutSessionId, {
      service,
      customer: {
        name: customer.name.trim(),
        email: customer.email.trim(),
        phone: customer.phone.trim(),
      },
      amountCents,
      createdAt: new Date(),
    });

    res.json({ url: checkoutUrl, redirectUrl: checkoutUrl, sessionId: checkoutSessionId });
  } catch (err) {
    console.error('Error creating booking deposit checkout:', err);
    res.status(502).json({
      error: 'We could not connect to the payment service right now. Please wait a moment and try again. You have not been charged.',
    });
  }
};

export const confirmBookingDeposit = async (req, res) => {
  try {
    if (!CLOVER_BOOKING_DEPOSITS_AVAILABLE()) {
      return res.status(503).json({
        error: 'We cannot confirm your deposit right now. Please do not submit another payment. Check your receipt, then contact Pine Needle Designs for help.',
      });
    }

    const sessionId = String(req.params.sessionId || '').trim();
    if (!sessionId) {
      return res.status(400).json({
        error: 'This confirmation link is incomplete. If you paid, please check your receipt and contact Pine Needle Designs for help.',
      });
    }

    const cached = finalizedBookingDeposits.get(sessionId);
    if (cached) {
      return res.json(cached);
    }

    const deposit = bookingDepositMap.get(sessionId);
    if (!deposit) {
      return res.status(404).json({
        error: 'We could not find this deposit session. If you were charged, please contact Pine Needle Designs for help.',
      });
    }

    const booking = BOOKING_DEPOSITS[deposit.service];
    if (!booking) {
      return res.status(400).json({ error: 'Invalid booking deposit type.' });
    }

    const cloverPayment = await findSuccessfulPaymentForSession({
      checkoutSessionId: sessionId,
      amountCents: deposit.amountCents,
      createdAfter: deposit.createdAt,
    });

    if (!cloverPayment) {
      return res.status(202).json({
        success: false,
        message: 'Your deposit is still being confirmed. Please wait a moment and refresh.',
        code: 'PAYMENT_PENDING',
      });
    }

    const result = await finalizeBookingDeposit({
      checkoutSessionId: sessionId,
      cloverPaymentId: String(cloverPayment.id || ''),
      deposit,
      booking,
    });

    return res.json(result);
  } catch (err) {
    console.error('Error confirming booking deposit:', err);
    res.status(502).json({
      error: 'We cannot confirm your deposit right now. Please do not submit another payment. Check your receipt, then contact Pine Needle Designs for help.',
    });
  }
};

export const captureBookingDeposit = async (_req, res) => {
  res.status(410).json({
    success: false,
    error: 'Legacy PayPal deposit confirmation is no longer supported. If you completed a Clover payment, return to the booking success page from your payment confirmation email or contact support.',
    code: 'PAYPAL_BOOKING_CAPTURE_DISABLED',
  });
};
