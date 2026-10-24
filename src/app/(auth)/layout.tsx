export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-start justify-center bg-[#cdc3b6] px-5 py-10 sm:py-16">
      {children}
    </div>
  );
}
