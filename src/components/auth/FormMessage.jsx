export default function FormMessage({ tone = "error", children }) {
  if (!children) {
    return null;
  }

  const isError = tone === "error";

  return (
    <p
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`rounded-sm border px-3 py-2.5 text-sm leading-relaxed ${
        isError
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-olive/30 bg-olive/10 text-charcoal"
      }`}
    >
      {children}
    </p>
  );
}
