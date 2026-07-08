// Logo Shirlove (equivalente a assets/logo.svg del proyecto Flutter)
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 60"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Shirlove"
    >
      <text
        x="10"
        y="40"
        fill="#1A1A1A"
        fontSize="48"
        fontFamily="'Segoe Script', 'Script MT Bold', cursive"
      >
        shir
      </text>
      <text
        x="85"
        y="40"
        fill="#B5873A"
        fontSize="48"
        fontFamily="'Segoe Script', 'Script MT Bold', cursive"
      >
        love
      </text>
      <text
        x="10"
        y="55"
        fill="#3E2E15"
        fontSize="12"
        fontFamily="Arial, sans-serif"
      >
        BELLEZA QUE NACE DEL ALMA
      </text>
    </svg>
  )
}
