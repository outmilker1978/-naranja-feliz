export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50 to-surface px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
