import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-28 w-full bg-[#eeecea] px-3 py-3 text-base text-[#333231] transition-colors outline-none placeholder:text-[#6b6763] focus-visible:outline-2 focus-visible:outline-[#333231] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
