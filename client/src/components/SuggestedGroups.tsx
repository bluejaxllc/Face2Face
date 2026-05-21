import React from "react";
import { ChevronDown } from "lucide-react";

export interface Group {
  name: string;
  seed: string;
}

interface SuggestedGroupsProps {
  title: string;
  groups: Group[];
  theme?: { text: string };
  onSeeAll?: (title: string, groups: Group[]) => void;
}

export default function SuggestedGroups({ title, groups, theme, onSeeAll }: SuggestedGroupsProps) {
  const textColor = theme?.text || "text-slate-300";
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-end mb-3 px-4">
        <h2 className={`text-[26px] font-bold ${textColor} tracking-tight`}>{title}</h2>
        {onSeeAll && (
          <button 
            onClick={() => onSeeAll(title, groups)}
            className="flex flex-col items-center cursor-pointer group"
          >
            <span className={`text-[11px] font-extrabold ${textColor} lowercase tracking-wider mb-0 hover:opacity-80 transition-colors`}>all</span>
            <ChevronDown className={`w-5 h-5 ${textColor} group-hover:opacity-80 transition-colors translate-y-[-4px]`} strokeWidth={3} />
          </button>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto px-4 snap-x pb-4 [&::-webkit-scrollbar]:hidden">
        {groups.map((g, i) => (
          <div key={i} className="relative w-36 h-[210px] rounded-[24px] overflow-hidden shrink-0 snap-center shadow-lg border border-slate-800/50 cursor-pointer">
            <img 
              src={`https://picsum.photos/seed/${g.seed}/400/600`} 
              alt={g.name} 
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
              loading="lazy"
            />
            <div className="absolute inset-0 bg-slate-950/40 pointer-events-none transition-colors hover:bg-slate-950/50" />
            <div className="absolute inset-0 flex items-center justify-center px-2 pointer-events-none text-center">
              <h3 className="font-extrabold text-[16px] leading-snug text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] break-words">{g.name}</h3>
            </div>
          </div>
        ))}
        <div className="w-1 shrink-0 snap-end" />
      </div>
    </div>
  );
}
