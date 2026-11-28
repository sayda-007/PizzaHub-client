"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";

import FormMessage from "@/components/auth/FormMessage";
import {
  DashboardError,
  DashboardLoading,
} from "@/components/dashboard/DashboardStates";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import {
  ACCOUNT_ROLES,
  ROLE_LABELS,
  authClient,
  isValidImageUrl,
  useAuthorizedSession,
  validateName,
} from "@/lib/auth-client";
import { getProfile, updateProfile } from "@/lib/dashboard-client";
import { formatDate } from "@/lib/format";
import { subscriptionStatusMeta } from "@/lib/status";

const labelClass =
  "block text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase";
const controlClass =
  "mt-2 h-11 w-full rounded-sm border border-line bg-paper px-3 text-sm text-charcoal placeholder:text-ink-muted transition-colors focus-visible:border-tomato focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato/25";

function validateProfile(values, isVendor) {
  const errors = {};
  const nameError = validateName(values.name);

  if (nameError) {
    errors.name = nameError;
  }

  if (!isValidImageUrl(values.image)) {
    errors.image = "Enter a valid http or https image URL.";
  }

  if (isVendor && values.businessName.trim()) {
    const businessName = values.businessName.trim();

    if (businessName.length < 2 || businessName.length > 120) {
      errors.businessName = "Business name must be 2–120 characters.";
    } else if (!/^[\p{L}\p{N}\s.,&'()\-]+$/u.test(businessName)) {
      errors.businessName = "Business name contains unsupported characters.";
    }
  }

  return errors;
}

export default function ProfileForm() {
  const { canLoad } = useAuthorizedSession();
  const [profile, setProfile] = useState(null);
  const [values, setValues] = useState({ name: "", image: "", businessName: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getProfile();
      const user = result?.user ?? null;

      setProfile(user);
      setValues({
        name: user?.name ?? "",
        image: user?.image ?? "",
        businessName: user?.businessName ?? "",
      });
    } catch (loadError) {
      setError(loadError?.message ?? "We couldn't load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canLoad) {
      return undefined;
    }

    // Async data load: state updates happen after the request, not during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [canLoad, load]);

  const isVendor = profile?.role === ACCOUNT_ROLES.VENDOR;

  async function handleSubmit(event) {
    event.preventDefault();
    setSuccess("");

    const errors = validateProfile(values, isVendor);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload = {};
    const cleanName = values.name.trim();
    const cleanImage = values.image.trim();
    const cleanBusinessName = values.businessName.trim();

    if (cleanName !== (profile?.name ?? "")) {
      payload.name = cleanName;
    }

    if (cleanImage !== (profile?.image ?? "")) {
      payload.image = cleanImage || null;
    }

    if (isVendor && cleanBusinessName !== (profile?.businessName ?? "")) {
      payload.businessName = cleanBusinessName || null;
    }

    if (Object.keys(payload).length === 0) {
      setSuccess("Nothing to save — your details are already up to date.");
      return;
    }

    setSaving(true);

    try {
      const result = await updateProfile(payload);
      const updated = result?.user ?? null;

      setProfile(updated);
      setValues({
        name: updated?.name ?? "",
        image: updated?.image ?? "",
        businessName: updated?.businessName ?? "",
      });
      setSuccess("Your profile has been updated.");
      await authClient.getSession();
    } catch (saveError) {
      setError(saveError?.message ?? "We couldn't save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardShell
      title="Profile settings"
      description="Keep the details on your PizzaHub account accurate. Roles, blocking and subscription state are managed by the server."
      allowedRoles={[ACCOUNT_ROLES.CUSTOMER, ACCOUNT_ROLES.VENDOR, ACCOUNT_ROLES.ADMIN]}
    >
      {loading ? (
        <DashboardLoading label="Loading your profile..." />
      ) : error && !profile ? (
        <DashboardError message={error} onRetry={load} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <form onSubmit={handleSubmit} className="rounded-sm border border-line bg-surface p-5 sm:p-6">
            <h2 className="font-heading text-xl text-charcoal">Your details</h2>

            <div className="mt-5 space-y-5">
              <div>
                <label htmlFor="profile-name" className={labelClass}>
                  Full name
                </label>
                <input
                  id="profile-name"
                  value={values.name}
                  onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? "profile-name-error" : undefined}
                  className={controlClass}
                  maxLength={120}
                  autoComplete="name"
                />
                {fieldErrors.name ? (
                  <p id="profile-name-error" className="mt-1.5 text-xs text-destructive">
                    {fieldErrors.name}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="profile-email" className={labelClass}>
                  Email address
                </label>
                <input
                  id="profile-email"
                  value={profile?.email ?? ""}
                  readOnly
                  aria-describedby="profile-email-hint"
                  className={`${controlClass} cursor-not-allowed bg-muted text-ink-muted`}
                />
                <p id="profile-email-hint" className="mt-1.5 text-xs text-ink-muted">
                  Your email address is managed by your authentication provider.
                </p>
              </div>

              <div>
                <label htmlFor="profile-image" className={labelClass}>
                  Profile image URL
                </label>
                <input
                  id="profile-image"
                  type="url"
                  value={values.image}
                  onChange={(event) => setValues((current) => ({ ...current, image: event.target.value }))}
                  placeholder="https://example.com/photo.jpg"
                  aria-invalid={Boolean(fieldErrors.image)}
                  aria-describedby={fieldErrors.image ? "profile-image-error" : "profile-image-hint"}
                  className={controlClass}
                  maxLength={2048}
                />
                {fieldErrors.image ? (
                  <p id="profile-image-error" className="mt-1.5 text-xs text-destructive">
                    {fieldErrors.image}
                  </p>
                ) : (
                  <p id="profile-image-hint" className="mt-1.5 text-xs text-ink-muted">
                    Leave blank to remove your current photo.
                  </p>
                )}
              </div>

              {isVendor ? (
                <div>
                  <label htmlFor="profile-business" className={labelClass}>
                    Business name
                  </label>
                  <input
                    id="profile-business"
                    value={values.businessName}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, businessName: event.target.value }))
                    }
                    aria-invalid={Boolean(fieldErrors.businessName)}
                    aria-describedby={
                      fieldErrors.businessName ? "profile-business-error" : "profile-business-hint"
                    }
                    className={controlClass}
                    maxLength={120}
                    autoComplete="organization"
                  />
                  {fieldErrors.businessName ? (
                    <p id="profile-business-error" className="mt-1.5 text-xs text-destructive">
                      {fieldErrors.businessName}
                    </p>
                  ) : (
                    <p id="profile-business-hint" className="mt-1.5 text-xs text-ink-muted">
                      Shown with menu items you submit. Leave blank to clear it.
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="mt-6 space-y-3">
              {error && profile ? <FormMessage>{error}</FormMessage> : null}
              {success ? <FormMessage tone="success">{success}</FormMessage> : null}
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="mt-6 h-11 bg-tomato px-5 text-paper hover:bg-tomato-deep hover:text-paper"
            >
              <Save aria-hidden="true" />
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </form>

          <aside className="rounded-sm border border-line bg-surface p-5" aria-label="Account overview">
            <h2 className="font-heading text-xl text-charcoal">Account overview</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">Role</dt>
                <dd className="mt-1 font-medium text-charcoal">
                  {ROLE_LABELS[profile?.role] ?? profile?.role ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Subscription
                </dt>
                <dd className="mt-1 font-medium text-charcoal">
                  {subscriptionStatusMeta(profile?.subscriptionStatus).label}
                  {profile?.subscriptionPlan ? ` · ${profile.subscriptionPlan}` : ""}
                </dd>
              </div>
              {profile?.subscriptionExpiresAt ? (
                <div>
                  <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                    Expires
                  </dt>
                  <dd className="mt-1 font-medium text-charcoal">
                    {formatDate(profile.subscriptionExpiresAt)}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Member since
                </dt>
                <dd className="mt-1 font-medium text-charcoal">{formatDate(profile?.createdAt)}</dd>
              </div>
            </dl>
            {isVendor ? (
              <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-ink-muted">
                Subscription changes are handled by Stripe. Contact support if a payment needs review.
              </p>
            ) : null}
          </aside>
        </div>
      )}
    </DashboardShell>
  );
}
