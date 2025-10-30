import {
  ChevronDownIcon
} from "lucide-react";
import { RiInstagramLine, RiWhatsappLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

export function ChannelTypeDropdown({ defaultValue = "whatsapp", onChange }: {
  defaultValue?: string;
  onChange: (type: string) => void;
}) {
  const [selected, setSelected] = useState(defaultValue);

  const handleSelect = (type: string) => {
    setSelected(type);
    onChange(type);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          type="button"
        >
          <div className="flex items-center gap-2">
            {selected === "whatsapp" ? (
              <>
                <RiWhatsappLine size={16} className="text-green-500" />
                WhatsApp
              </>
            ) : (
              <>
                <RiInstagramLine size={16} className="text-pink-500" />
                Instagram
              </>
            )}
          </div>
          <ChevronDownIcon size={16} className="opacity-60" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuItem onClick={() => handleSelect("whatsapp")}>
          <RiWhatsappLine size={16} className="mr-2 text-green-500" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSelect("instagram")}>
          <RiInstagramLine size={16} className="mr-2 text-pink-500" />
          Instagram
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
