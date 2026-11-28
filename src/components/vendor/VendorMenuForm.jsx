"use client";

import { useId, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { revalidatePublicMenu } from "@/app/actions";
import FormMessage from "@/components/auth/FormMessage";
import { Button } from "@/components/ui/button";
import { friendlyApiError } from "@/lib/api-client";
import { createVendorMenu, updateVendorMenu } from "@/lib/dashboard-client";
import { isValidMenuId, validateMenuFields, validateMenuImages } from "@/lib/menu-form-validation";
import { MENU_CATEGORIES } from "@/lib/menu-query";

const labelClass =
  "block text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase";
const controlClass =
  "mt-2 h-11 w-full rounded-sm border border-line bg-paper px-3 text-sm text-charcoal placeholder:text-ink-muted transition-colors focus-visible:border-tomato focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato/25 disabled:opacity-60";
const textareaClass =
  "mt-2 min-h-28 w-full rounded-sm border border-line bg-paper px-3 py-2.5 text-sm leading-relaxed text-charcoal placeholder:text-ink-muted transition-colors focus-visible:border-tomato focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato/25 disabled:opacity-60";
const errorClass = "mt-1.5 text-xs leading-relaxed text-destructive";
const hintClass = "mt-1.5 text-xs leading-relaxed text-ink-muted";

function FieldError({ id, message }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className={errorClass}>
      {message}
    </p>
  );
}

function initialValues(item) {
  if (!item) {
    return { itemName: "", category: "", description: "", price: "", location: "" };
  }

  return {
    itemName: item.itemName ?? "",
    category: item.category ?? "",
    description: item.description ?? "",
    price: item.price === null || item.price === undefined ? "" : String(item.price),
    location: item.location ?? "",
  };
}

export default function VendorMenuForm({ item, onDone, onCancel }) {
  const isEdit = Boolean(item);
  const fieldId = useId();
  const [values, setValues] = useState(() => initialValues(item));
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  function updateField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setFormError("");
  }

  function selectFiles(event) {
    setFiles(Array.from(event.target.files ?? []));
    setErrors((current) => ({ ...current, images: "" }));
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (busy) {
      return;
    }

    setFormError("");

    const nextErrors = validateMenuFields(values);

    if (!isEdit) {
      Object.assign(nextErrors, validateMenuImages(files, { required: true }));
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setFormError("Check the highlighted fields and try again.");
      return;
    }

    if (isEdit && !isValidMenuId(item.id)) {
      setFormError("This item has an invalid identifier and cannot be updated.");
      return;
    }

    setBusy(true);

    const payload = {
      itemName: values.itemName.trim(),
      category: values.category,
      description: values.description.trim(),
      price: Number(values.price),
      location: values.location.trim(),
    };

    try {
      if (isEdit) {
        await updateVendorMenu(item.id, payload);
        await revalidatePublicMenu();
        onDone("Menu item updated.");
        return;
      }

      const formData = new FormData();

      for (const [key, value] of Object.entries(payload)) {
        formData.append(key, String(value));
      }

      for (const file of files) {
        formData.append("images", file);
      }

      await createVendorMenu(formData);
      await revalidatePublicMenu();
      onDone("Menu item submitted for review.");
    } catch (error) {
      setFormError(
        friendlyApiError(
          error,
          isEdit ? "We couldn't update that menu item." : "We couldn't add that menu item.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  const imageHintId = `${fieldId}-images-hint`;
  const imageErrorId = `${fieldId}-images-error`;

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={busy} className="mt-5 space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor={`${fieldId}-name`}>
            Item name
          </label>
          <input
            id={`${fieldId}-name`}
            className={controlClass}
            type="text"
            value={values.itemName}
            onChange={(event) => updateField("itemName", event.target.value)}
            placeholder="e.g. Margherita"
            maxLength={120}
            autoComplete="off"
            required
            disabled={busy}
            aria-invalid={Boolean(errors.itemName)}
            aria-describedby={errors.itemName ? `${fieldId}-name-error` : undefined}
          />
          <FieldError id={`${fieldId}-name-error`} message={errors.itemName} />
        </div>

        <div>
          <label className={labelClass} htmlFor={`${fieldId}-category`}>
            Category
          </label>
          <select
            id={`${fieldId}-category`}
            className={controlClass}
            value={values.category}
            onChange={(event) => updateField("category", event.target.value)}
            required
            disabled={busy}
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? `${fieldId}-category-error` : undefined}
          >
            <option value="">Choose a category</option>
            {MENU_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <FieldError id={`${fieldId}-category-error`} message={errors.category} />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor={`${fieldId}-description`}>
          Description
        </label>
        <textarea
          id={`${fieldId}-description`}
          className={textareaClass}
          value={values.description}
          onChange={(event) => updateField("description", event.target.value)}
          placeholder="Tell customers what makes this item special."
          maxLength={1000}
          required
          disabled={busy}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? `${fieldId}-description-error` : undefined}
        />
        <FieldError id={`${fieldId}-description-error`} message={errors.description} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor={`${fieldId}-price`}>
            Price (USD)
          </label>
          <input
            id={`${fieldId}-price`}
            className={controlClass}
            type="text"
            inputMode="decimal"
            value={values.price}
            onChange={(event) => updateField("price", event.target.value)}
            placeholder="12.99"
            autoComplete="off"
            required
            disabled={busy}
            aria-invalid={Boolean(errors.price)}
            aria-describedby={errors.price ? `${fieldId}-price-error` : undefined}
          />
          <FieldError id={`${fieldId}-price-error`} message={errors.price} />
        </div>

        <div>
          <label className={labelClass} htmlFor={`${fieldId}-location`}>
            Kitchen location
          </label>
          <input
            id={`${fieldId}-location`}
            className={controlClass}
            type="text"
            value={values.location}
            onChange={(event) => updateField("location", event.target.value)}
            placeholder="e.g. Downtown"
            maxLength={120}
            autoComplete="off"
            required
            disabled={busy}
            aria-invalid={Boolean(errors.location)}
            aria-describedby={errors.location ? `${fieldId}-location-error` : undefined}
          />
          <FieldError id={`${fieldId}-location-error`} message={errors.location} />
        </div>
      </div>

      {isEdit ? (
        <p className={hintClass}>
          Images are uploaded when an item is created. To change photos, delete this item and add it
          again.
        </p>
      ) : (
        <div>
          <label className={labelClass} htmlFor={`${fieldId}-images`}>
            Images
          </label>
          <input
            id={`${fieldId}-images`}
            className={`mt-2 block w-full text-sm text-ink-muted file:mr-3 file:rounded-sm file:border file:border-line file:bg-paper file:px-3 file:py-2 file:text-sm file:font-semibold file:text-charcoal hover:file:bg-muted disabled:opacity-60`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={selectFiles}
            disabled={busy}
            aria-invalid={Boolean(errors.images)}
            aria-describedby={
              errors.images ? `${imageHintId} ${imageErrorId}` : imageHintId
            }
          />
          <p id={imageHintId} className={hintClass}>
            Upload 1–3 images. JPEG, PNG, WebP or GIF, up to 3 MB each and 3.5 MB total.
          </p>
          <FieldError id={imageErrorId} message={errors.images} />
          {files.length > 0 ? (
            <p className="mt-2 break-words text-xs text-charcoal">
              Selected: {files.map((file) => file.name).join(", ")}
            </p>
          ) : null}
        </div>
      )}

      <FormMessage>{formError}</FormMessage>

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={busy}
          className="h-10 bg-tomato px-4 text-paper hover:bg-tomato-deep hover:text-paper"
        >
          {busy ? (
            <>
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              Saving...
            </>
          ) : isEdit ? (
            "Save changes"
          ) : (
            "Submit item"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={busy}
          className="h-10 border-line bg-paper px-4 text-charcoal hover:bg-muted"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
