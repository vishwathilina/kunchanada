"use client";

import { INJURY_TAGS } from "@/lib/constants";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TagPicker({
  value,
  onChange,
  max = 8,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  max?: number;
}) {
  const toggle = (tag: string) => {
    if (value.includes(tag)) onChange(value.filter((t) => t !== tag));
    else if (value.length < max) onChange([...value, tag]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {INJURY_TAGS.map((tag) => {
        const active = value.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            aria-pressed={active}
            className={cn(
              "px-3 py-2 text-base",
              active ? "bg-[#333231] text-[#eeecea]" : "bg-[#eeecea] text-[#333231]",
            )}
          >
            {titleCase(tag)}
          </button>
        );
      })}
    </div>
  );
}
