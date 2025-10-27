"use client";
import { useCart } from "@/hooks/use-cart";
import { ContactRaw } from "@omnichannel/core/domain/value-objects/contact";
import { SectorRaw } from "@omnichannel/core/domain/value-objects/sector";
import { ShoppingCart, User2 } from "lucide-react";
import { ModalTransfer } from "../modal-transfer";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

type Props = {
  contact?: ContactRaw;
  isMyConversation: boolean;
  conversationId?: string;
  userInfo: {
    id: string;
    sector: SectorRaw | null;
  };
};

export const ChatHeader: React.FC<Props> = (props) => {
  const { contact, userInfo, isMyConversation, conversationId } = props;
  const { openCart, setOpenCart, productsOnCart } = useCart();
  return (
    <div className="w-full z-50 justify-between items-center border-b flex top-0 bg-white h-screen max-h-[64px] py-6 px-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10 bg-white border">
          <AvatarFallback className="border">
            <User2 className="stroke-1 size-5" />
          </AvatarFallback>
        </Avatar>

        <div
          onClick={() => setOpenCart(!openCart)}
          className="flex flex-col cursor-pointer select-none"
        >
          <span className="font-normal text-[#0A0A0A]">{contact?.name}</span>
          <span className="font-normal text-xs text-muted-foreground">
            {contact?.phone}
          </span>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        {isMyConversation && (
          <ModalTransfer conversationId={conversationId} userInfo={userInfo} />
        )}
        <Button
          data-active={openCart}
          onClick={() => setOpenCart(!openCart)}
          variant="ghost"
          className="data-[active=true]:bg-sky-500 group rounded-lg"
        >
          <Badge
            className="!text-[7pt] rounded-full absolute -top-1 -right-1 bg-pink-500 w-4 h-4"
            data-hidden={productsOnCart < 1}
          >
            {productsOnCart}
          </Badge>
          <ShoppingCart className="size-4 group-data-[active=true]:!stroke-sky-100" />
        </Button>
      </div>
    </div>
  );
};
