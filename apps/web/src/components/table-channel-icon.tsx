import React from "react";
import { RiWhatsappFill, RiInstagramFill } from "react-icons/ri";
import { Channel } from "@omnichannel/core/domain/entities/channel";


const channelTypeIcons: Record<
  Channel.Type,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  whatsapp: RiWhatsappFill,
  instagram: RiInstagramFill,
};

const channelTypeColors: Record<Channel.Type, string> = {
  whatsapp: "text-green-500",
  instagram: "text-pink-500",
};

export interface TableChannelIconProps {
  type: Channel.Type;
  size?: number | string;
  className?: string;
}

export const TableChannelIcon: React.FC<TableChannelIconProps> = ({
  type,
  size = 22,
  className = "",
}) => {
  const Icon = channelTypeIcons[type];
  const colorClass = channelTypeColors[type];

  if (!Icon) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-gray-200 text-gray-500 ${className}`}
        style={{ width: size, height: size }}
      >
        ?
      </div>
    );
  }

  return <Icon className={`${colorClass} ${className}`} style={{ width: size, height: size }} />;
};
