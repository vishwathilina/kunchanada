import type { ReactNode } from "react";
import Link from "next/link";

export function StripeLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`stripe-btn group relative inline-flex items-center justify-center overflow-hidden ${className}`}>
      <span className="absolute inset-0 hidden group-hover:flex" aria-hidden>
        {Array.from({ length: 16 }, (_, i) => (
          <span key={i} className={i % 2 === 0 ? "h-full flex-1 bg-[#333231]" : "h-full flex-1 bg-[#eeecea]"} />
        ))}
      </span>
      <span className="relative group-hover:text-[#333231]">{children}</span>
    </Link>
  );
}
