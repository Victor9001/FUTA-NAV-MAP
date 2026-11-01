export default function AnchorLogo({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-53 -3 106 106"
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="0" cy="7" r="6" />
      <path d="M -10 18 L 10 18" />
      <path d="M 0 13 L 0 99" />
      <path d="M -35 66 C -31 86 -16 96 0 100 C 16 96 31 86 35 66" />
      <path d="M -35 66 L -27.5 69" />
      <path d="M 35 66 L 27.5 69" />
    </svg>
  )
}