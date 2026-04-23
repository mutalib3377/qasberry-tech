// app/(marketing)/layout.tsx
// Layout for all public marketing pages.
// No auth required — passes through freely per middleware config.

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
