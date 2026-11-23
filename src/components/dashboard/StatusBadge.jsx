import {
  menuStatusMeta,
  orderStatusMeta,
  statusBadgeClass,
  subscriptionStatusMeta,
} from "@/lib/status";

export default function StatusBadge({ type = "order", status, label }) {
  const meta =
    type === "menu"
      ? menuStatusMeta(status)
      : type === "subscription"
        ? subscriptionStatusMeta(status)
        : orderStatusMeta(status);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(meta)}`}
    >
      {label ?? meta.label}
    </span>
  );
}
