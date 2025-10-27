"use client";
import { cx } from "@/lib/utils";
import { Message } from "@omnichannel/core/domain/entities/message";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Skeleton } from "../ui/skeleton";
import { MessageContainer } from "./message-container";

type Props = {
  message: Message.Raw;
  channel: string;
  hiddenAvatar: boolean;
};

export const ImageBubble: React.FC<Props> = (props) => {
  if (props.message?.type !== "image") return <></>;

  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImage();
  }, []);

  async function loadImage() {
    const response = await fetch(
      `/api/message/${props.message.id}/image?channel=${props.channel}`
    );
    const buffer = await response.arrayBuffer();

    const blob = new Blob([buffer], { type: "image/png" });
    const url = URL.createObjectURL(blob);
    setImageUrl(url);
    setLoading(false);
  }

  return (
    <MessageContainer
      senderId={props.message.sender.id}
      createdAt={props.message.createdAt}
      senderType={props.message.sender?.type}
      status={props.message.status}
      hiddenAvatar={props.hiddenAvatar}
      senderName={props.message.sender.name}
    >
      <div
        data-sender={props.message.sender?.type}
        className="group flex w-screen max-w-[250px] px-4 pt-5 flex-col items-start gap-3"
      >
        <div
          data-rounded={!props.hiddenAvatar}
          className={cx(
            "flex flex-col justify-start gap-2 w-full max-w-[320px] leading-1.5 border-gray-200",
            "group-data-[sender=attendant]:data-[rounded=false]:rounded-br-xl group-data-[sender=attendant]:rounded-l-xl group-data-[sender=attendant]:rounded-tr-xl group-data-[sender=attendant]:text-white",
            "group-data-[sender=contact]:rounded-tl-xl group-data-[sender=contact]:data-[rounded=false]:rounded-bl-xl group-data-[sender=contact]:rounded-r-xl group-data-[sender=contact]:rounded-br-xl "
          )}
        >
          <div
            className="w-full gap-4 flex justify-center items-center"
            data-hidden={!loading}
          >
            <Skeleton className="w-full h-[200px]" />
          </div>
          <Dialog>
            <DialogTrigger className="cursor-pointer">
              <Image
                data-hidden={loading}
                width={2000}
                height={1000}
                alt="image"
                src={imageUrl}
              />
            </DialogTrigger>
            <DialogContent>
              <Image
                data-hidden={loading}
                width={1000}
                height={800}
                alt="image"
                src={imageUrl}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </MessageContainer>
  );
};
