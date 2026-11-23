import { MENU_CATEGORIES } from "@/lib/menu-query";

const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
// The backend limits the whole multipart request to 4 MB. Leave room for text
// fields and boundaries so three individually valid files cannot fail upload.
const MAX_TOTAL_IMAGE_BYTES = 3.5 * 1024 * 1024;
const MAX_IMAGES = 3;

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function isValidMenuId(value) {
  return OBJECT_ID_PATTERN.test(clean(value));
}

/** Mirror the backend's strict text and price rules so users get instant feedback. */
export function validateMenuFields(values) {
  const errors = {};
  const itemName = clean(values.itemName);
  const description = clean(values.description);
  const location = clean(values.location);
  const price = clean(values.price);

  if (itemName.length < 2 || itemName.length > 120) {
    errors.itemName = "Item name must be 2–120 characters.";
  }

  if (!MENU_CATEGORIES.includes(values.category)) {
    errors.category = "Choose one of the listed categories.";
  }

  if (!description || description.length > 1000) {
    errors.description = "Description is required and must be at most 1000 characters.";
  }

  if (!/^\d+(?:\.\d{1,2})?$/.test(price) || Number(price) <= 0 || Number(price) > 10_000) {
    errors.price = "Enter a price greater than 0 with at most two decimals.";
  }

  if (!location || location.length > 120) {
    errors.location = "Location is required and must be at most 120 characters.";
  }

  return errors;
}

export function validateMenuImages(files, { required = true } = {}) {
  const list = Array.from(files ?? []);
  const errors = {};

  if (required && list.length === 0) {
    errors.images = "Add at least one image.";
    return errors;
  }

  if (list.length > MAX_IMAGES) {
    errors.images = `You can upload at most ${MAX_IMAGES} images.`;
    return errors;
  }

  const invalidType = list.find((file) => !ALLOWED_IMAGE_TYPES.has(file.type));

  if (invalidType) {
    errors.images = "Use JPEG, PNG, WebP or GIF images only.";
    return errors;
  }

  const oversized = list.find((file) => file.size > MAX_IMAGE_BYTES);

  if (oversized) {
    errors.images = "Each image must be smaller than 3 MB.";
    return errors;
  }

  const totalBytes = list.reduce((sum, file) => sum + file.size, 0);

  if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
    errors.images = "All images together must be smaller than 3.5 MB.";
  }

  return errors;
}
