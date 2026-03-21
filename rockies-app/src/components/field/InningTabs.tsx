import { motion } from "framer-motion";

interface InningTabsProps {
  currentInning: number;
  onInningChange: (inning: number) => void;
  totalInnings?: number;
}

const ordinalSuffix = (n: number): string => {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
};

export default function InningTabs({
  currentInning,
  onInningChange,
  totalInnings = 6,
}: InningTabsProps) {
  const innings = Array.from({ length: totalInnings }, (_, i) => i + 1);

  return (
    <div className="w-full overflow-x-auto scrollbar-hide -mx-1 px-1">
      <div className="flex gap-2 min-w-max py-1 justify-center">
        {innings.map((inning) => {
          const isActive = inning === currentInning;
          return (
            <button
              key={inning}
              onClick={() => onInningChange(inning)}
              className={`
                relative px-4 py-2 rounded-full text-sm font-semibold
                transition-colors duration-200 whitespace-nowrap
                min-w-[56px] select-none
                ${
                  isActive
                    ? "text-white"
                    : "text-gray-400 bg-white/5 hover:bg-white/10 hover:text-gray-200"
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeInningPill"
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: "#33006F" }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
              <span className="relative z-10">{ordinalSuffix(inning)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
