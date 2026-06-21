import type { ZoneConfig, ZoneColor } from '@/lib/boat-specs';

const HULL_PATH =
  'M 150 14 C 196 14 263 92 263 212 L 263 402 C 263 462 233 507 193 511 L 107 511 C 67 507 37 462 37 402 L 37 212 C 37 92 104 14 150 14 Z';

const ZONE_FILL: Record<ZoneColor, string> = {
  cabin:   '#DBEAFE',
  common:  '#EFF6FF',
  utility: '#FEF3C7',
  head:    '#D1FAE5',
};

const ZONE_STROKE: Record<ZoneColor, string> = {
  cabin:   '#93C5FD',
  common:  '#BFDBFE',
  utility: '#FCD34D',
  head:    '#6EE7B7',
};

interface Props {
  zones: ZoneConfig[];
}

export default function BoatSVG({ zones }: Props) {
  return (
    <svg
      viewBox="0 0 300 524"
      width="100%"
      style={{ display: 'block', maxWidth: 300 }}
      aria-label="Bavaria C50 interior layout"
    >
      <defs>
        <clipPath id="hull-clip">
          <path d={HULL_PATH} />
        </clipPath>
      </defs>

      {/* Hull fill */}
      <path d={HULL_PATH} fill="rgba(240,248,255,0.6)" />

      {/* Interior zones, clipped to hull */}
      <g clipPath="url(#hull-clip)">
        {zones.map((zone) => (
          <g key={zone.id}>
            <rect
              x={zone.x}
              y={zone.y}
              width={zone.width}
              height={zone.height}
              rx={6}
              fill={ZONE_FILL[zone.color]}
              stroke={ZONE_STROKE[zone.color]}
              strokeWidth={1}
            />
            <text
              x={zone.x + zone.width / 2}
              y={zone.y + zone.height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={10}
              fontWeight={600}
              fill="#003366"
              fontFamily="inherit"
            >
              {zone.label}
            </text>
          </g>
        ))}
      </g>

      {/* Hull outline rendered on top so it overlaps zone borders */}
      <path
        d={HULL_PATH}
        fill="none"
        stroke="#0077BE"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />

      {/* Bow label */}
      <text
        x={150}
        y={8}
        textAnchor="middle"
        fontSize={8}
        fontWeight={700}
        fill="#4A90E2"
        letterSpacing={1.5}
        fontFamily="inherit"
      >
        BOW
      </text>

      {/* Stern label */}
      <text
        x={150}
        y={521}
        textAnchor="middle"
        fontSize={8}
        fontWeight={700}
        fill="#4A90E2"
        letterSpacing={1.5}
        fontFamily="inherit"
      >
        STERN
      </text>
    </svg>
  );
}
