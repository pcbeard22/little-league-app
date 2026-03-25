import { motion } from "framer-motion";

interface BaseballFieldProps {
  positions: Array<{
    position: string; // P, C, 1B, 2B, 3B, SS, LF, CF, RF
    playerName: string;
    playerId: number;
  }>;
  onPositionClick?: (position: string) => void;
  className?: string;
}

// Realistic top-down baseball field coordinates (viewBox 0 0 500 500)
// Home plate is at bottom-center, CF at top-center
const POSITION_COORDS: Record<string, { x: number; y: number }> = {
  CF: { x: 250, y: 72 },
  LF: { x: 100, y: 155 },
  RF: { x: 400, y: 155 },
  SS: { x: 185, y: 235 },
  "2B": { x: 310, y: 230 },
  "3B": { x: 148, y: 305 },
  P: { x: 250, y: 305 },
  "1B": { x: 348, y: 305 },
  C: { x: 250, y: 432 },
};

const badgeVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
      delay: i * 0.06,
    },
  }),
};

function getShortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  return parts[0]; // return full first name — font size adapts dynamically
}

function getNameFontSize(name: string): number {
  if (name.length <= 6) return 11;
  if (name.length <= 8) return 9;
  return 8;
}

export default function BaseballField({
  positions,
  onPositionClick,
  className = "",
}: BaseballFieldProps) {
  const positionMap = new Map(
    positions
      .filter((p) => p.position !== "BN")
      .map((p) => [p.position, p])
  );

  return (
    <div className={`w-full max-w-xl mx-auto ${className}`}>
      <svg
        viewBox="0 0 500 500"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.15))" }}
      >
        <defs>
          {/* Outfield grass gradient */}
          <radialGradient
            id="outfieldGradient"
            cx="50%"
            cy="85%"
            r="75%"
            fx="50%"
            fy="85%"
          >
            <stop offset="0%" stopColor="#3A7D33" />
            <stop offset="60%" stopColor="#2D5A27" />
            <stop offset="100%" stopColor="#234A1F" />
          </radialGradient>

          {/* Infield grass gradient */}
          <radialGradient id="infieldGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3F8535" />
            <stop offset="100%" stopColor="#3A7233" />
          </radialGradient>

          {/* Dirt gradient */}
          <radialGradient id="dirtGradient" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#D4B36A" />
            <stop offset="100%" stopColor="#C4A35A" />
          </radialGradient>

          {/* Mound gradient */}
          <radialGradient id="moundGradient" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#D9BE78" />
            <stop offset="100%" stopColor="#B89848" />
          </radialGradient>

          {/* Badge glow filter */}
          <filter id="badgeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#7B3FE4" floodOpacity="0.5" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Clipping path for the field shape - fan/wedge */}
          <clipPath id="fieldClip">
            <path d="M 250 410 L 10 100 Q 250 -30 490 100 Z" />
          </clipPath>
        </defs>

        {/* ===== FIELD BACKGROUND ===== */}

        {/* Overall background */}
        <rect width="500" height="500" fill="#1a1a2e" rx="16" />

        {/* Outfield grass - fan shape */}
        <path
          d="M 250 395 L 15 110 Q 250 -20 485 110 Z"
          fill="url(#outfieldGradient)"
        />

        {/* Outfield fence arc */}
        <path
          d="M 30 130 Q 250 -10 470 130"
          fill="none"
          stroke="#F5E6C8"
          strokeWidth="2.5"
          strokeDasharray="8 4"
          opacity="0.5"
        />

        {/* Warning track arc */}
        <path
          d="M 42 138 Q 250 10 458 138"
          fill="none"
          stroke="#B8860B"
          strokeWidth="10"
          opacity="0.2"
        />

        {/* ===== INFIELD ===== */}

        {/* Infield grass diamond area (larger behind the dirt) */}
        <polygon
          points="250,210 340,305 250,400 160,305"
          fill="url(#infieldGradient)"
        />

        {/* Dirt/skin diamond */}
        <polygon
          points="250,235 325,305 250,375 175,305"
          fill="url(#dirtGradient)"
          stroke="#B89848"
          strokeWidth="1"
        />

        {/* ===== BASE PATHS ===== */}
        <g stroke="white" strokeWidth="2" fill="none" opacity="0.9">
          {/* Home to 1st */}
          <line x1="250" y1="375" x2="325" y2="305" />
          {/* 1st to 2nd */}
          <line x1="325" y1="305" x2="250" y2="235" />
          {/* 2nd to 3rd */}
          <line x1="250" y1="235" x2="175" y2="305" />
          {/* 3rd to Home */}
          <line x1="175" y1="305" x2="250" y2="375" />
        </g>

        {/* ===== BASES ===== */}

        {/* First base */}
        <rect
          x="320"
          y="300"
          width="11"
          height="11"
          fill="white"
          transform="rotate(45 325.5 305.5)"
        />

        {/* Second base */}
        <rect
          x="244.5"
          y="229.5"
          width="11"
          height="11"
          fill="white"
          transform="rotate(45 250 235)"
        />

        {/* Third base */}
        <rect
          x="169.5"
          y="299.5"
          width="11"
          height="11"
          fill="white"
          transform="rotate(45 175 305)"
        />

        {/* Home plate - pentagon shape */}
        <polygon
          points="250,379 243,373 243,367 257,367 257,373"
          fill="white"
        />

        {/* ===== PITCHER'S MOUND ===== */}

        {/* Mound circle */}
        <circle cx="250" cy="305" r="14" fill="url(#moundGradient)" />
        {/* Rubber */}
        <rect x="244" y="303" width="12" height="3" rx="1" fill="white" />

        {/* ===== DIRT AREAS ===== */}

        {/* Batter's box area / home plate dirt circle */}
        <circle cx="250" cy="375" r="22" fill="#C4A35A" opacity="0.5" />

        {/* First base dirt cutout */}
        <circle cx="325" cy="305" r="14" fill="#C4A35A" opacity="0.4" />

        {/* Third base dirt cutout */}
        <circle cx="175" cy="305" r="14" fill="#C4A35A" opacity="0.4" />

        {/* ===== FOUL LINES ===== */}
        <g stroke="#F5E6C8" strokeWidth="1.5" opacity="0.6">
          <line x1="250" y1="375" x2="15" y2="110" />
          <line x1="250" y1="375" x2="485" y2="110" />
        </g>

        {/* ===== GRASS MOWING PATTERN (subtle) ===== */}
        <g opacity="0.04" clipPath="url(#fieldClip)">
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={`mow-${i}`}
              x1={0}
              y1={i * 35}
              x2={500}
              y2={i * 35}
              stroke="white"
              strokeWidth="15"
            />
          ))}
        </g>

        {/* ===== POSITION BADGES ===== */}
        {Object.entries(POSITION_COORDS).map(([pos, coords], index) => {
          const player = positionMap.get(pos);
          const displayName = player ? getShortName(player.playerName) : "";

          return (
            <motion.g
              key={pos}
              custom={index}
              variants={badgeVariants}
              initial="hidden"
              animate="visible"
              style={{ cursor: onPositionClick ? "pointer" : "default" }}
              onClick={() => onPositionClick?.(pos)}
            >
              {/* Hover target (invisible, larger) */}
              <circle
                cx={coords.x}
                cy={coords.y}
                r="28"
                fill="transparent"
                className="position-hit-area"
              />

              {/* Badge circle */}
              <circle
                cx={coords.x}
                cy={coords.y}
                r="20"
                fill={player ? "#33006F" : "#555"}
                stroke={player ? "#7B3FE4" : "#777"}
                strokeWidth="2"
                className="position-badge"
              />

              {/* Position abbreviation */}
              <text
                x={coords.x}
                y={coords.y - 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="10"
                fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
                style={{ pointerEvents: "none" }}
              >
                {pos}
              </text>

              {/* Player name below badge */}
              {player && (
                <text
                  x={coords.x}
                  y={coords.y + 33}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={getNameFontSize(displayName)}
                  fontWeight="600"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  style={{ pointerEvents: "none" }}
                >
                  {displayName}
                </text>
              )}

              {/* Empty position indicator */}
              {!player && (
                <text
                  x={coords.x}
                  y={coords.y + 33}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#999"
                  fontSize="9"
                  fontStyle="italic"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  style={{ pointerEvents: "none" }}
                >
                  empty
                </text>
              )}
            </motion.g>
          );
        })}

        {/* ===== INLINE STYLES FOR HOVER ===== */}
        <style>{`
          .position-badge {
            transition: transform 0.2s ease, filter 0.2s ease;
          }
          .position-hit-area:hover ~ .position-badge {
            filter: url(#badgeGlow);
            transform-origin: center;
          }
          g:hover .position-badge {
            filter: url(#badgeGlow);
          }
          g:hover {
            transform: scale(1.12);
            transform-origin: center;
            transform-box: fill-box;
          }
          g {
            transition: transform 0.15s ease;
          }
        `}</style>
      </svg>
    </div>
  );
}
