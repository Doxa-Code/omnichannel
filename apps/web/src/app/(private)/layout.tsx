import { AppSidebar } from "@/components/app-sidebar";
import { NavUser } from "@/components/nav-user";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MembershipsDatabaseRepository } from "@omnichannel/core/infra/repositories/membership-repository";
import { getUserAuthenticate } from "../actions/security";
import { listWorkspaces } from "../actions/users";
import { redirect } from "next/navigation";

const membershipsRepository = MembershipsDatabaseRepository.instance();

export default async function PrivateRootLayout(
  props: React.PropsWithChildren
) {
  const [user] = await getUserAuthenticate();
  const [workspaces] = await listWorkspaces();
  const membership = await membershipsRepository.retrieveByUserIdAndWorkspaceId(
    user?.id!,
    workspaces?.workspace?.id!
  );
  if (!user) redirect("/signin");

  return (
    <SidebarProvider    >
      <AppSidebar
        permissions={membership?.permissions ?? []}
        workspaceSelected={workspaces!}
        user={user?.raw?.()!}
      />
      <main className="w-full h-screen overflow-auto flex flex-col bg-[#F9FAFC]">
        <header className="flex border-b h-auto py-0 justify-end items-center w-full bg-primary">
          <NavUser user={user?.raw()} />
        </header>
        {props.children}
      </main>
    </SidebarProvider>
  );
}
