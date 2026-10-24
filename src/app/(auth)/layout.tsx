export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-start justify-center bg-gradient-to-b from-primary/[0.06] to-transparent px-4 py-10 sm:py-16">
      {children}
    </div>
  );
}
