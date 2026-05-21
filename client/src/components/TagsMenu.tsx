import React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface TagsMenuProps {
  tags: string[];
  activeTag: string | null;
  onTagSelect: (tag: string) => void;
  theme?: { text: string; bg: string; border: string; primary: string };
}

export default function TagsMenu({ tags, activeTag, onTagSelect, theme }: TagsMenuProps) {
  return (
    <div className="w-full mb-4 px-4">
      <ScrollArea className="w-full whitespace-nowrap rounded-md pb-2">
        <div className="flex w-max space-x-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className={`cursor-pointer px-4 py-1.5 rounded-full border border-slate-700/50 transition-all ${
                activeTag === tag
                  ? "bg-slate-700 text-white shadow-sm"
                  : "bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
              onClick={() => onTagSelect(tag)}
            >
              #{tag}
            </Badge>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>
    </div>
  );
}
