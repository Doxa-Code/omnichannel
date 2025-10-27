"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { User } from "@omnichannel/core/domain/entities/user";
import { PolicyName } from "@omnichannel/core/domain/services/authorization-service";
import {
  ArrowLeftRight,
  Box,
  ChevronRight,
  CogIcon,
  Dot,
  ListOrdered,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { LoadingComponent } from "./loading";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { WorkspaceDropdown } from "./workspace-dropdown";

type Menu = {
  title: string;
  url: string;
  icon: any;
  active?: boolean;
  childrens?: {
    title: string;
    url: string;
  }[];
};

const navMain: (user: User.Raw, permissions: Set<PolicyName>) => Menu[] = (
  user,
  permissions
) => [
  {
    title: "Atendimentos",
    url: "/chat",
    icon: MessageCircle,
    active:
      user?.type === "superuser" ||
      (
        [
          "view:conversations",
          "view:conversation",
          "send:message",
        ] as PolicyName[]
      ).some((permission) => permissions.has(permission)),
  },
  {
    title: "Conexões",
    url: "/channels",
    icon: ArrowLeftRight,
    active:
      user?.type === "superuser" ||
      (["manage:connections"] as PolicyName[]).some((permission) =>
        permissions.has(permission)
      ),
  },
  {
    title: "Configurações",
    url: "#",
    active:
      user?.type === "superuser" ||
      (["manage:settings", "view:settings"] as PolicyName[]).some(
        (permission) => permissions.has(permission)
      ),
    childrens: [
      {
        title: "Usuários",
        url: "/settings/users",
      },
      {
        title: "Áreas de trabalho",
        url: "/settings/workspaces",
      },
    ],
    icon: CogIcon,
  },
];

export function AppSidebar(
  props: React.ComponentProps<typeof Sidebar> & {
    user: User.Raw;
    workspaceSelected: {
      workspaces: { id: string; name: string }[];
      workspace: { id: string; name: string };
    };
    permissions: PolicyName[];
  }
) {
  const pathname = usePathname();
  const { open } = useSidebar();
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    setLoading(false);
  }, [pathname]);
  return (
    <>
      {loading && <LoadingComponent />}
      <Sidebar collapsible="icon" className="bg-white" {...props}>
        <SidebarHeader className="border-b h-auto mb-5">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex justify-between pl-2 items-center">
                <div
                  data-open={open}
                  className="w-full max-w-[50px] data-[open=false]:mx-auto"
                >
                  <Image
                    alt="Logo"
                    width={1000}
                    height={1000}
                    src={open ? "/icon.png" : "/icon.png"}
                  />
                </div>
                <SidebarTrigger data-hidden={!open} className="-ml-1" />
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
          <WorkspaceDropdown
            onSelected={() => {
              setLoading(true);
            }}
            {...props.workspaceSelected}
          />
        </SidebarHeader>
        <SidebarContent className="gap-1">
          <span className="px-6 mb-2 text-muted-foreground uppercase text-xs">
            Menu
          </span>
          {navMain(props.user, new Set(props.permissions)).map((item) => {
            const isDefaultOpen = item.childrens?.length
              ? item.childrens.some((c) => Boolean(pathname === c.url))
              : false;

            const isActive = Boolean(pathname === item.url);
            if (!item.active) return <React.Fragment key={item.title} />;
            return (
              <Collapsible
                key={item.title}
                title={item.title}
                className="group/collapsible"
                defaultOpen={isDefaultOpen}
              >
                <SidebarGroup className="px-4">
                  <SidebarGroupLabel
                    asChild
                    data-active={isActive}
                    className="group/label data-[active=true]:bg-primary cursor-pointer text-sidebar-foreground rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm px-2 py-2 h-auto"
                  >
                    <Link
                      className="w-full group-hover/label:translate-x-6 group-hover/label:transition-all group-hover/label:duration-100 duration-100 transition-all select-none cursor-pointer"
                      prefetch
                      onClick={() => {
                        if (item.url !== "#") {
                          setLoading(true);
                        }
                      }}
                      href={item.url}
                    >
                      <CollapsibleTrigger className="flex items-center w-full gap-3">
                        <item.icon className="size-5 stroke-1 stroke-[#9CA3AF] group-data-[active=true]/label:stroke-white" />
                        <span className="text-[#212C3A] font-light group-data-[active=true]/label:text-white">
                          {item.title}
                        </span>
                        <ChevronRight
                          data-hidden={!item.childrens?.length}
                          className="ml-auto stroke-muted-foreground transition-transform size-4 group-data-[state=open]/collapsible:rotate-90"
                        />
                      </CollapsibleTrigger>
                    </Link>
                  </SidebarGroupLabel>
                  <CollapsibleContent data-hidden={!item.childrens?.length}>
                    <SidebarGroupContent className="px-1.5 md:px-0">
                      <SidebarMenu className="gap-1 pt-1">
                        {item.childrens?.map((item) => {
                          const isActive = Boolean(pathname === item.url);
                          return (
                            <Link
                              onClick={() => setLoading(true)}
                              prefetch
                              key={item.title}
                              href={item.url}
                            >
                              <SidebarMenuItem>
                                <SidebarMenuButton
                                  isActive={isActive}
                                  data-active={isActive}
                                  className="group data-[active=true]:bg-primary !h-auto hover:pl-6 cursor-pointer px-4"
                                >
                                  <Dot className="size-4 group-data-[active=true]:stroke-white stroke-1.5 stroke-muted-foreground" />
                                  <span className="font-normal text-muted-foreground group-data-[active=true]:text-white">
                                    {item.title}
                                  </span>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            </Link>
                          );
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            );
          })}
        </SidebarContent>
      </Sidebar>
    </>
  );
}
