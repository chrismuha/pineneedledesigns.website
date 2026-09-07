export const BOOKING_DEPOSITS = Object.freeze({
  fitting: {
    title: 'First Fitting Deposit',
    displayTitle: 'First Fitting',
    amount: '10.00',
    calendarUrl: 'https://calendar.app.google/NU1nzMP69Vjz7JU4A',
  },
  brides: {
    title: 'Bridal Appointment Deposit',
    displayTitle: 'Bridal Appointment',
    amount: '25.00',
    calendarUrl: 'https://calendar.app.google/EU8HAuemRhmr4zBY6',
  },
});

export const REPEAT_CUSTOMER_CALENDAR_URL = 'https://calendar.app.google/CJqD3qRvcjUuq2HB7';

export const getBookingDepositPublicConfig = (enabled) => ({
  enabled: Boolean(enabled),
  services: {
    fitting: { ...BOOKING_DEPOSITS.fitting },
    brides: { ...BOOKING_DEPOSITS.brides },
  },
  repeatCustomersCalendarUrl: REPEAT_CUSTOMER_CALENDAR_URL,
  calendars: {
    fitting: BOOKING_DEPOSITS.fitting.calendarUrl,
    brides: BOOKING_DEPOSITS.brides.calendarUrl,
    repeat: REPEAT_CUSTOMER_CALENDAR_URL,
  },
});
