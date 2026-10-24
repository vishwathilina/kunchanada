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
              "rounded-full border px-2.5 py-1 text-xs transition-colors",
              active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {titleCase(tag)}
          </button>
        );
      })}
    </div>
  );
}
