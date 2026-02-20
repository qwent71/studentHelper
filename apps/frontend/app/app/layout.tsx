import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getBackendUrl } from "@/shared/lib/env";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@student-helper/ui/web/primitives/sidebar";
import { Separator } from "@student-helper/ui/web/primitives/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@student-helper/ui/web/primitives/breadcrumb";
import { AppSidebar } from "@/widgets/settings-sidebar";
import { SettingsDialog } from "@/widgets/settings-dialog";
import { SettingsDialogProvider } from "@/shared/settings";
import type { User } from "@/entities/user";

interface SessionResponse {
  user?: User;
}

async function getSession(cookieHeader: string): Promise<User | null> {
  if (!cookieHeader) return null;

  try {
    const response = await fetch(
      new URL("/api/auth/get-session", getBackendUrl()),
      {
        headers: { cookie: cookieHeader },
        cache: "no-store",
      },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as SessionResponse | null;
    return data?.user ?? null;
  } catch {
    return null;
  }
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const defaultSidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const user = await getSession(cookieHeader);

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <SettingsDialogProvider>
      <SidebarProvider defaultOpen={defaultSidebarOpen}>
        <AppSidebar user={user} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 group-has-data-[collapsible=icon]/sidebar-wrapper:px-2.5">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 !h-4 bg-muted-foreground/25" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Главная</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <main className="flex-1 pt-0 p-4">{children}</main>
        </SidebarInset>
      </SidebarProvider>
      <SettingsDialog />
    </SettingsDialogProvider>
  );
}
