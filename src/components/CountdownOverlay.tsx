import React from 'react';

interface CountdownOverlayProps {
  value: number | 'GO' | null;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ value }) => {
  if (value === null) return null;

  const isGo = value === 'GO';

  return (
    <div className="fixed inset-x-0 top-24 z-30 flex flex-col items-center justify-center pointer-events-none select-none">
      <div className="bg-[#070D19]/85 border border-white/15 rounded-2xl px-8 py-4 shadow-2xl text-center">
        <div className="flex items-center justify-center gap-2.5 mb-2">
          {[0, 1, 2, 3, 4].map((idx) => {
            let colorClass = 'bg-slate-700';
            if (isGo) {
              colorClass = 'bg-[#22C55E] shadow-[0_0_14px_#22C55E]';
            } else if (typeof value === 'number') {
              const activeCount = value === 3 ? 2 : value === 2 ? 4 : 5;
              if (idx < activeCount) {
                colorClass = 'bg-rose-500 shadow-[0_0_14px_#F43F5E]';
              }
            }
            return <span key={idx} className={`w-4 h-4 rounded-full ${colorClass}`} />;
          })}
        </div>

        <div
          className={`font-display font-bold tracking-wider ${
            isGo ? 'text-5xl md:text-7xl text-[#34D399]' : 'text-5xl md:text-6xl text-[#FBBF24]'
          }`}
        >
          {isGo ? 'GO!' : `${value}...`}
        </div>
        <p className="text-xs text-slate-300 mt-1">
          {isGo
            ? 'Gas poll! Klik jawaban dengan tepat dan cepat!'
            : 'Siapkan fokus pada kotak soal masing-masing tim!'}
        </p>
      </div>
    </div>
  );
};
