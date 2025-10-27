"use client";

import { LogOut, User2 } from "lucide-react";

import { signOut } from "@/app/actions/users";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { User } from "@omnichannel/core/domain/entities/user";
import { useServerAction } from "zsa-react";

export function NavUser({ user }: { user?: User.Raw }) {
  const { isMobile } = useSidebar();
  const signOutAction = useServerAction(signOut);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className=" overflow-hidden rounded-none data-[state=open]:text-sidebar-accent-foreground items-center justify-center cursor-pointer hover:opacity-80 md:h-[40px] gap-2 outline-0 ring-0 data-[state=collapsed]:px-0 flex pr-4">
        <Avatar className="size-8 bg-muted border">
          <AvatarFallback className="rounded-lg bg-transparent">
            <User2 className="stroke-1 stroke-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side={isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg border">
              <AvatarFallback className="rounded-lg">
                <User2 className="stroke-1 stroke-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left">
              <span className="truncate text-sm font-medium">{user?.name}</span>
              <span className="truncate text-xs font-light">{user?.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOutAction.execute()}>
          <LogOut />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
