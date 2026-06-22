import { CoopGuard } from "@cp/ui";

export default async function CoopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ coopSlug: string }>;
}) {
  const { coopSlug } = await params;
  return <CoopGuard slug={coopSlug}>{children}</CoopGuard>;
}
