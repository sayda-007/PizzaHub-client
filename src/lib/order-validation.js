const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;
const MAX_ADDRESS_LENGTH = 300;
const MAX_MESSAGE_LENGTH = 500;

/** Match the backend's real-calendar-date rule, not Date's lenient rollover. */
function isCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateOrderForm({ itemId, deliveryDate, deliveryAddress, additionalMessage }) {
  const errors = {};
  const address = cleanText(deliveryAddress);
  const message = cleanText(additionalMessage);

  if (typeof itemId !== "string" || !OBJECT_ID_PATTERN.test(itemId.trim())) {
    errors.itemId = "This menu item is no longer available.";
  }

  if (!isCalendarDate(cleanText(deliveryDate))) {
    errors.deliveryDate = "Choose a real delivery date in YYYY-MM-DD format.";
  }

  if (!address) {
    errors.deliveryAddress = "Delivery address is required.";
  } else if (address.length > MAX_ADDRESS_LENGTH) {
    errors.deliveryAddress = `Delivery address must be at most ${MAX_ADDRESS_LENGTH} characters.`;
  } else if (CONTROL_CHARACTERS.test(address)) {
    errors.deliveryAddress = "Delivery address contains unsupported characters.";
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    errors.additionalMessage = `Additional message must be at most ${MAX_MESSAGE_LENGTH} characters.`;
  } else if (message && CONTROL_CHARACTERS.test(message)) {
    errors.additionalMessage = "Additional message contains unsupported characters.";
  }

  const payload = {
    itemId: cleanText(itemId).toLowerCase(),
    deliveryDate: cleanText(deliveryDate),
    deliveryAddress: address,
  };

  // The backend rejects an empty optional message, so omit it entirely.
  if (message) {
    payload.additionalMessage = message;
  }

  return { errors, payload };
}

export const ORDER_FIELD_LIMITS = Object.freeze({
  address: MAX_ADDRESS_LENGTH,
  message: MAX_MESSAGE_LENGTH,
});
