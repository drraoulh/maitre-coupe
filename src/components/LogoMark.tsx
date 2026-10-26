/**
 * Logo Maître Coupe redessiné d'après la carte de visite :
 * « MC » or sur fond noir, bandeau « Esthétique · Coiffure ».
 * `full` ajoute la signature « Maitre-Coupe » (pour les grandes tailles).
 */
export function LogoMark({ size = 44, full = false, className }: { size?: number; full?: boolean; className?: string }) {
  const id = full ? 'mc-gold-full' : 'mc-gold'
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} role="img" aria-label="Logo Maître Coupe">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6dc8f" />
          <stop offset="0.5" stopColor="#e2b443" />
          <stop offset="1" stopColor="#a87b2a" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="116" height="116" rx="20" fill="#0b0907" stroke={`url(#${id})`} strokeWidth="3" />
      <text
        x="60"
        y={full ? 76 : 80}
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, 'Times New Roman', serif"
        fontWeight="700"
        fontSize={full ? 64 : 70}
        fill={`url(#${id})`}
        letterSpacing="-2"
      >
        MC
      </text>
      {full && (
        <text
          x="60"
          y="62"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontStyle="italic"
          fontWeight="700"
          fontSize="17"
          fill="#f4eee5"
          stroke="#0b0907"
          strokeWidth="3"
          paintOrder="stroke"
          textLength="96"
          lengthAdjust="spacingAndGlyphs"
        >
          Maitre-Coupe
        </text>
      )}
      <rect x="14" y="90" width="92" height="17" rx="3" fill={`url(#${id})`} />
      <text x="60" y="102.5" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontWeight="800" fontSize="9" fill="#0b0907" textLength="80" lengthAdjust="spacingAndGlyphs">
        ESTHÉTIQUE · COIFFURE
      </text>
    </svg>
  )
}
