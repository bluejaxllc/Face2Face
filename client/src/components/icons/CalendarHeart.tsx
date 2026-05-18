import React from "react";

interface CalendarHeartProps {
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
}

/**
 * Custom icon: Calendar outline with a prominent heart inside.
 * Matches Lucide icon conventions (24×24 viewBox, stroke-based calendar, filled heart).
 */
export default function CalendarHeart({ className, style, strokeWidth = 1.5 }: CalendarHeartProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Calendar body */}
      <rect x="3" y="4" width="18" height="18" rx="2" />
      {/* Calendar top divider line */}
      <line x1="3" y1="10" x2="21" y2="10" />
      {/* Calendar pegs */}
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />

      {/* Large prominent heart — centered in calendar date area (below the divider) */}
      <path
        d="M12 19.5
           C12 19.5 6 15.5 6 12.8
           C6 11.2 7.2 10 8.7 10
           C9.7 10 10.6 10.5 11.2 11.3
           L12 12.3
           L12.8 11.3
           C13.4 10.5 14.3 10 15.3 10
           C16.8 10 18 11.2 18 12.8
           C18 15.5 12 19.5 12 19.5Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
