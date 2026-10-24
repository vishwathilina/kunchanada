import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { Providers } from "@/components/providers";
import { PHOTOS } from "@/lib/photos";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Kunchanada — community animal rescue",
    template: "%s · Kunchanada",
  },
  description:
    "Report injured animals, alert nearby vets and volunteers, fund treatment transparently, and follow every rescue to its outcome.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bricolage.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>
          <SiteHeader />
          <main className="flex flex-1 flex-col">{children}</main>
          <div className="h-2 w-full overflow-hidden" aria-hidden>
            <div className="flex h-2 w-max">
              {Array.from({ length: 80 }, (_, i) => (
                <span key={i} className={i % 2 === 0 ? "h-2 w-7 shrink-0 bg-[#333231]" : "h-2 w-7 shrink-0 bg-transparent"} />
              ))}
            </div>
          </div>
          <footer className="bg-[#333231] px-3 pb-10 text-[#eeecea] sm:px-[8vw]">
            <div className="hidden sm:flex" aria-hidden>
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} className="-mb-6 h-8 flex-1 rounded-b-full bg-[#333231]" />
              ))}
            </div>
            <div className="flex sm:hidden" aria-hidden>
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} className="-mb-5 h-6 flex-1 rounded-b-full bg-[#333231]" />
              ))}
            </div>
            <div className="bg-[#eeecea] px-6 py-10 text-[#333231] sm:px-12 sm:py-12">
              <div className="grid gap-10 sm:grid-cols-2">
                <div>
                  <p className="arrive text-[length:var(--step-head)]">See you on the road.</p>
                  <p className="arrive mt-4 max-w-[36ch] text-base leading-relaxed">
                    File what you found. A verified vet inside their own radius gets the call, and the outcome stays on the case.
                  </p>
                </div>
                <div className="relative">
                  <img
                    src={PHOTOS.raccoonCare.src}
                    alt={PHOTOS.raccoonCare.alt}
                    width={88}
                    height={117}
                    className="float-right mb-4 ml-4 h-[117px] w-[88px] object-cover p-1.5 sm:h-[117px] sm:w-[88px]"
                  />
                  <nav className="arrive flex flex-col gap-3 text-base">
                    <Link href="/cases/new" className="hover:text-[#5c6b54]">
                      File a report
                    </Link>
                    <Link href="/cases" className="hover:text-[#5c6b54]">
                      Open cases
                    </Link>
                    <Link href="/donate" className="hover:text-[#5c6b54]">
                      The fund
                    </Link>
                    <Link href="/leaderboard" className="hover:text-[#5c6b54]">
                      Leaderboard
                    </Link>
                  </nav>
                </div>
              </div>
              <p className="mt-10 text-center text-[length:var(--step-small)] text-[#6b6763]">© 2026 Kunchanada</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
