export default function BrandLogo({
  className = "",
  emblemClassName = "size-8",
  wordmarkClassName = "text-xl text-charcoal",
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 32 32"
        className={emblemClassName}
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M16 4 L28.5 25.5 Q29 26.5 27.8 26.5 H4.2 Q3 26.5 3.5 25.5 Z"
          fill="#B64035"
        />
        <path
          d="M4.2 24 H27.8"
          stroke="#C87543"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx="16" cy="12" r="2.3" fill="#FAF6EE" />
        <circle cx="11.6" cy="18.6" r="1.9" fill="#FAF6EE" />
        <circle cx="20.4" cy="18.6" r="1.9" fill="#FAF6EE" />
      </svg>
      <span
        className={`font-heading font-medium leading-none tracking-tight ${wordmarkClassName}`}
      >
        Pizza<span className="text-tomato">Hub</span>
      </span>
    </span>
  );
}
