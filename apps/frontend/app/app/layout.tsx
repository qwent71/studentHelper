import { AppSidebarLayout } from "@/widgets/app-sidebar";

export default function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppSidebarLayout>{children}</AppSidebarLayout>;
}
