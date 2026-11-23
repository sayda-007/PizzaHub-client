"use client";

import { useId, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MapPin,
  ShoppingBag,
} from "lucide-react";

import FormMessage from "@/components/auth/FormMessage";
import { TextField } from "@/components/auth/AuthFields";
import MenuImage from "@/components/menu/MenuImage";
import { Button } from "@/components/ui/button";
import { authClient, canPlaceCustomerOrder } from "@/lib/auth-client";
import { createOrder, OrderApiError } from "@/lib/order-client";
import {
  ORDER_FIELD_LIMITS,
  todayInputValue,
  validateOrderForm,
} from "@/lib/order-validation";
import { authHref } from "@/lib/safe-return";

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// The calendar date is read from the client only after hydration; this keeps
// the server-rendered HTML independent of the viewer's local date.
const subscribeToCalendarDate = () => () => {};

const labelClass =
  "block text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase";
const textareaClass =
  "mt-2 min-h-24 w-full resize-y rounded-sm border border-line bg-paper px-3 py-2.5 text-sm text-charcoal placeholder:text-ink-muted transition-colors focus-visible:border-tomato focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato/25";

function ItemGallery({ item }) {
  const images = Array.isArray(item.images) ? item.images : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const imageCount = images.length;

  function showImage(index) {
    if (imageCount === 0) {
      return;
    }

    setActiveIndex(((index % imageCount) + imageCount) % imageCount);
  }

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-line bg-muted">
        <MenuImage
          src={images[activeIndex]}
          alt={item.imageAlt}
          sizes="(max-width: 1023px) 100vw, 50vw"
        />

        {imageCount > 1 ? (
          <>
            <button
              type="button"
              onClick={() => showImage(activeIndex - 1)}
              aria-label="Previous image"
              className="absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-charcoal shadow-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato/40"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => showImage(activeIndex + 1)}
              aria-label="Next image"
              className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-charcoal shadow-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato/40"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
            <p
              className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-charcoal/80 px-3 py-1 text-xs font-medium text-paper"
              aria-live="polite"
            >
              Image {activeIndex + 1} of {imageCount}
            </p>
          </>
        ) : null}
      </div>

      {imageCount > 1 ? (
        <div
          className="mt-3 flex gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label="Item images"
        >
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => showImage(index)}
              aria-label={`Show image ${index + 1} of ${imageCount}`}
              aria-pressed={index === activeIndex}
              className={`relative size-20 shrink-0 overflow-hidden rounded-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato/40 ${
                index === activeIndex
                  ? "border-tomato"
                  : "border-line hover:border-orange/60"
              }`}
            >
              <MenuImage src={src} alt="" sizes="80px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function OrderConfirmation({ order, onReset }) {
  return (
    <div role="status" aria-live="polite" className="mt-6 space-y-4">
      <div className="rounded-sm border border-olive/30 bg-olive/10 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 text-olive" />
          <div>
            <h3 className="font-heading text-xl text-charcoal">
              Order placed successfully
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              Your order has been received. No payment is collected here.
            </p>
          </div>
        </div>

        <dl className="mt-4 space-y-2 border-t border-olive/20 pt-4 text-sm">
          {order.id ? (
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-ink-muted">Order ID:</dt>
              <dd className="font-medium text-charcoal">{order.id}</dd>
            </div>
          ) : null}
          {order.status ? (
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-ink-muted">Status:</dt>
              <dd className="font-medium text-charcoal">{order.status}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          className="h-11 border-line bg-paper px-4 text-charcoal hover:bg-muted"
        >
          Place another order
        </Button>
        <Button asChild className="h-11 bg-tomato px-4 text-paper hover:bg-tomato-deep hover:text-paper">
          <Link href="/menu">Back to menu</Link>
        </Button>
      </div>
    </div>
  );
}

function OrderForm({ item }) {
  const fieldId = useId();
  const dateId = `${fieldId}-date`;
  const addressId = `${fieldId}-address`;
  const messageId = `${fieldId}-message`;

  const [values, setValues] = useState({
    deliveryDate: "",
    deliveryAddress: "",
    additionalMessage: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const inFlight = useRef(false);
  const minDate = useSyncExternalStore(
    subscribeToCalendarDate,
    todayInputValue,
    () => "",
  );

  function updateField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (inFlight.current || confirmation) {
      return;
    }

    const { errors: nextErrors, payload } = validateOrderForm({
      itemId: item.id,
      ...values,
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormError("Check the highlighted fields and try again.");
      return;
    }

    setErrors({});
    setFormError("");
    inFlight.current = true;
    setSubmitting(true);

    try {
      const order = await createOrder(payload);
      setConfirmation(order);
    } catch (error) {
      if (error instanceof OrderApiError) {
        setErrors(error.fields ?? {});
        setFormError(error.message);
      } else {
        setFormError("We couldn't place your order. Please try again.");
      }
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  function resetForm() {
    setValues({ deliveryDate: "", deliveryAddress: "", additionalMessage: "" });
    setErrors({});
    setFormError("");
    setConfirmation(null);
  }

  if (confirmation) {
    return <OrderConfirmation order={confirmation} onReset={resetForm} />;
  }

  const messageErrorId = errors.additionalMessage
    ? `${messageId}-error`
    : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={submitting} className="mt-6">
      <div className="flex gap-4 rounded-sm border border-line bg-paper p-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-sm bg-muted">
          <MenuImage src={item.images[0]} alt={item.imageAlt} sizes="80px" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.14em] text-olive uppercase">
            Your order
          </p>
          <p className="mt-1 font-heading text-lg leading-tight text-charcoal">
            {item.itemName}
          </p>
          <p className="mt-1 text-sm font-medium text-charcoal">
            {priceFormatter.format(item.price)}
          </p>
          {item.location ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
              <MapPin aria-hidden="true" className="size-3" />
              {item.location}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5">
        <FormMessage>{formError}</FormMessage>
      </div>

      <div className="mt-5 space-y-5">
        <TextField
          id={dateId}
          label="Delivery Date"
          type="date"
          min={minDate}
          value={values.deliveryDate}
          onChange={(event) => updateField("deliveryDate", event.target.value)}
          error={errors.deliveryDate}
          hint="Choose today or later in YYYY-MM-DD format."
          disabled={submitting}
          required
        />

        <TextField
          id={addressId}
          label="Delivery Address"
          type="text"
          autoComplete="street-address"
          placeholder="123 Main Street"
          maxLength={ORDER_FIELD_LIMITS.address}
          value={values.deliveryAddress}
          onChange={(event) => updateField("deliveryAddress", event.target.value)}
          error={errors.deliveryAddress}
          disabled={submitting}
          required
        />

        <div>
          <label htmlFor={messageId} className={labelClass}>
            Additional Message (optional)
          </label>
          <textarea
            id={messageId}
            name="additionalMessage"
            rows={3}
            maxLength={ORDER_FIELD_LIMITS.message}
            placeholder="Special instructions for your order"
            aria-invalid={Boolean(errors.additionalMessage)}
            aria-describedby={messageErrorId}
            className={`${textareaClass} ${errors.additionalMessage ? "border-destructive" : ""}`}
            value={values.additionalMessage}
            onChange={(event) =>
              updateField("additionalMessage", event.target.value)
            }
            disabled={submitting}
          />
          {errors.additionalMessage ? (
            <p id={messageErrorId} className="mt-1.5 text-xs text-destructive">
              {errors.additionalMessage}
            </p>
          ) : null}
        </div>
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="mt-6 h-11 w-full bg-tomato px-4 text-paper hover:bg-tomato-deep hover:text-paper"
      >
        {submitting ? (
          <>
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            Placing order...
          </>
        ) : (
          "Place order"
        )}
      </Button>
    </form>
  );
}

function OrderPanel({ item }) {
  const { data: session, isPending, error } = authClient.useSession();
  const authStatus = isPending
    ? "loading"
    : error
      ? "error"
      : "ready";
  const signInHref = authHref("/sign-in", { returnTo: `/menu/${item.id}` });

  return (
    <aside className="rounded-sm border border-line bg-surface p-6 sm:p-7">
      <div className="flex items-center gap-2">
        <ShoppingBag aria-hidden="true" className="size-5 text-tomato" />
        <h2 className="font-heading text-2xl text-charcoal">Order this item</h2>
      </div>

      {authStatus === "loading" ? (
        <div
          className="mt-5 flex items-center gap-2 text-sm text-ink-muted"
          role="status"
          aria-live="polite"
        >
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          Checking your account...
        </div>
      ) : null}

      {authStatus === "error" ? (
        <div className="mt-5 space-y-3">
          <p className="text-sm leading-relaxed text-ink-muted">
            We couldn&apos;t check your account right now. Refresh the page or
            sign in again.
          </p>
          <Button asChild className="h-11 bg-tomato px-4 text-paper hover:bg-tomato-deep hover:text-paper">
            <Link href={signInHref}>Sign in to order</Link>
          </Button>
        </div>
      ) : null}

      {authStatus === "ready" && !session ? (
        <div className="mt-5 space-y-3">
          <p className="text-sm leading-relaxed text-ink-muted">
            Sign in with a customer account to choose a delivery date and place
            your order. We&apos;ll bring you back to this item afterwards.
          </p>
          <Button asChild className="h-11 bg-tomato px-4 text-paper hover:bg-tomato-deep hover:text-paper">
            <Link href={signInHref}>Sign in to order</Link>
          </Button>
        </div>
      ) : null}

      {authStatus === "ready" && session && !canPlaceCustomerOrder(session) ? (
        <p className="mt-5 text-sm leading-relaxed text-ink-muted">
          Ordering is available to customer accounts. You&apos;re signed in with
          a different account type, so this item can&apos;t be ordered here.
        </p>
      ) : null}

      {authStatus === "ready" && canPlaceCustomerOrder(session) ? (
        <OrderForm item={item} />
      ) : null}
    </aside>
  );
}

export default function MenuDetail({ item }) {
  return (
    <main className="bg-paper">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-medium text-ink-muted">
          <Link href="/menu" className="hover:text-tomato">
            Menu
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-charcoal">
            {item.itemName}
          </span>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-start">
          <div>
            <ItemGallery item={item} />

            <div className="mt-8 rounded-sm border border-line bg-surface p-6 sm:p-7">
              {item.category ? (
                <p className="text-xs font-semibold tracking-[0.18em] text-olive uppercase">
                  {item.category}
                </p>
              ) : null}

              <h1 className="mt-2 font-heading text-4xl leading-tight text-charcoal">
                {item.itemName}
              </h1>

              <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                {item.description || "No description has been provided for this item."}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-5 text-sm">
                <span className="text-lg font-medium text-charcoal">
                  {priceFormatter.format(item.price)}
                </span>
                {item.location ? (
                  <span className="flex items-center gap-1.5 text-ink-muted">
                    <MapPin aria-hidden="true" className="size-4" />
                    {item.location}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <OrderPanel item={item} />
        </div>
      </div>
    </main>
  );
}
