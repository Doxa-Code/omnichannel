"use client";

import {
  listAllConversations,
  transferConversation,
} from "@/app/actions/conversations";
import { markLastMessagesContactAsViewed } from "@/app/actions/messages";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useServerActionMutation,
  useServerActionQuery,
} from "@/hooks/server-action-hooks";
import { useSSE } from "@/hooks/use-sse";
import { useToast } from "@/hooks/use-toast";
import { Conversation } from "@omnichannel/core/domain/entities/conversation";
import { Message } from "@omnichannel/core/domain/entities/message";
import { User } from "@omnichannel/core/domain/entities/user";
import { Attendant } from "@omnichannel/core/domain/value-objects/attendant";
import { Sector } from "@omnichannel/core/domain/value-objects/sector";
import { useQueryClient } from "@tanstack/react-query";
import { CircleAlertIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "../logo";
import { Button } from "../ui/button";
import { ChatEmptyContainer } from "./chat-empty-container";
import { ChatForm } from "./chat-form";
import { ChatHeader } from "./chat-header";
import { ChatSidebar } from "./chat-sidebar";
import { ContainerMessages } from "./container-messages";

type Props = {
  conversations: Conversation.Raw[];
  userAuthenticated: User.Raw;
  workspaceId: string;
};

export function Chat(props: Props) {
  const [conversation, setConversation] = useState<Conversation.Raw | null>(
    null
  );
  const containerMessages = useRef<HTMLDivElement>(null);
  const { data } = useServerActionQuery(listAllConversations, {
    input: undefined,
    queryKey: ["list-conversations"],
  });
  const [conversations, setConversations] = useState<
    Map<string, Conversation.Raw>
  >(new Map(props.conversations.map((c) => [c.id, c])));
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Message.Raw[]>([]);
  const markLastMessagesContactAsViewedAction = useServerActionMutation(
    markLastMessagesContactAsViewed,
    {
      onSuccess(data) {
        setConversation(data);

        setConversations((prev) => {
          prev.set(data.id, data);
          return new Map(prev);
        });
      },
    }
  );
  const { mutate: transfer, isPending } = useServerActionMutation(
    transferConversation,
    {
      onSuccess: async () => {
        toast({
          variant: "success",
          title: "Transferência realizada com sucesso!",
          duration: 3000,
        });
        await queryClient.refetchQueries({
          queryKey: ["list-conversations"],
          exact: true,
        });
      },
      onError: (err) => {
        toast({
          variant: "error",
          title: "Erro",
          description: (err as Error).message || "Erro ao transferir",
        });
      },
    }
  );

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { connected } = useSSE({
    url: "/api/sse",
    onError(err) {
      if (err.message) {
        toast({
          variant: "error",
          title: "Error",
          description: err.message,
        });
      }
    },
    async onMessage({ type, data: message }) {
      await queryClient.invalidateQueries({
        queryKey: ["list-conversations"],
      });
      if (type === "typing" && message.conversationId === conversation?.id) {
        setTyping(true);
        return;
      }

      if (type === "untyping" && message.conversationId === conversation?.id) {
        setTyping(false);
        return;
      }

      if (type === "conversation") {
        const newConversation = message as Conversation.Raw;

        if (
          !newConversation.id ||
          newConversation.channel !== conversation?.channel
        )
          return;

        setConversations((conversations) => {
          conversations.set(newConversation.id, {
            ...newConversation,
            lastMessage: newConversation.lastMessage
              ? {
                  ...newConversation.lastMessage,
                  createdAt: new Date(newConversation.lastMessage?.createdAt),
                }
              : undefined,
            openedAt: newConversation.openedAt
              ? new Date(newConversation.openedAt)
              : null,
            messages: newConversation.messages.map((m) => ({
              ...m,
              createdAt: new Date(m.createdAt),
              viewedAt: m.viewedAt ? new Date(m.viewedAt) : null,
            })),
          });
          return new Map(Array.from(conversations.entries()));
        });

        if (conversation?.id === newConversation.id) {
          setConversation(newConversation);
        }
      }
    },
  });

  useEffect(() => {
    if (conversation?.id) {
      setConversation(conversations.get(conversation.id) ?? null);
    }
  }, [conversations]);

  useEffect(() => {
    if (data?.length) {
      setConversations(new Map(data?.map((c) => [c.id, c])));
    }
  }, [data]);

  useEffect(() => {
    setMessages(conversation?.messages ?? []);

    if (
      conversation?.messages.some(
        (m) => m.status !== "viewed" && m.sender?.type === "contact"
      ) &&
      conversation.attendant?.id === props.userAuthenticated.id
    ) {
      markLastMessagesContactAsViewedAction.mutate({
        channelId: conversation.channel,
        contactPhone: conversation.contact.phone,
      });
      const lastConversation = Conversation.fromRaw(conversation);
      lastConversation.markAllMessageAsViewed();
      setConversation(lastConversation.raw());
      setConversations((prev) => {
        prev.set(lastConversation.id, lastConversation.raw());
        return new Map(prev);
      });
    }
  }, [conversation]);

  useEffect(() => {
    if (containerMessages.current) {
      setTimeout(() => {
        containerMessages.current?.scrollBy({
          top: containerMessages.current.scrollHeight,
        });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setConversation(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!connected) {
    return (
      <div className="fixed w-full h-screen top-0 left-0 flex justify-center items-center flex-col bg-white/80 z-50">
        <Logo className="size-20 motion-preset-stretch " />
        <span className="animate-pulse">Carregando atendimentos...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 w-full overflow-hidden rounded-none">
      <ChatSidebar
        conversation={conversation}
        conversations={Array.from(conversations.values())}
        isConnected={connected}
        selectConversation={setConversation}
        user={props.userAuthenticated}
        registerMe={(conversationId, sector) => {
          const conversation = conversations.get(conversationId);

          if (!conversation) return;

          const lastConversation = Conversation.fromRaw(conversation);

          if (sector && sector.id && sector.name) {
            lastConversation.transferToSector(
              Sector.create(sector.name, sector.id)
            );
          }

          lastConversation.attributeAttendant(
            Attendant.create(
              props.userAuthenticated.id,
              props.userAuthenticated.name
            )
          );
          setConversation(lastConversation.raw());
          setConversations((prev) => {
            prev.set(lastConversation.id, lastConversation.raw());
            return new Map(prev);
          });
        }}
      />
      <ChatEmptyContainer hidden={!!conversation} />
      <div
        data-hidden={!conversation}
        className="background flex flex-col overflow-hidden bg-[#F5F1EB]/30 gap-0 w-full flex-1 relative"
      >
        <ChatHeader
          isMyConversation={
            conversation?.attendant?.id == props.userAuthenticated.id
          }
          contact={conversation?.contact}
          conversationId={conversation?.id}
          userInfo={{
            id: props.userAuthenticated.id,
            sector: props.userAuthenticated.sector,
          }}
        />
        <div className="flex flex-1 relative overflow-hidden">
          <div className="w-full overflow-y-auto flex-1 pb-16 flex flex-col relative">
            <ContainerMessages
              ref={containerMessages}
              messages={messages}
              channel={conversation?.channel!}
              typing={typing}
            />
            <ChatForm
              conversationId={conversation?.id}
              addMessage={(message) => {
                setMessages((messages) => [...messages, message]);
              }}
              attendantId={conversation?.attendant?.id}
              channel={conversation?.channel!}
              userAuthenticated={props.userAuthenticated}
            />
            <div
              data-hidden={
                conversation?.attendant?.id === props.userAuthenticated.id
              }
              className="w-full justify-between shadow z-50 h-screen max-h-[72px] text-center absolute bottom-0 flex left-[50%] -translate-x-[50%] items-center bg-white border gap-2 p-3"
            >
              <span className="text-muted-foreground italic text-sm">
                Você não é responsável pelo atendimento, não pode responder
                nesse chat.
              </span>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-sky-500 hover:bg-sky-600">
                    {isPending ? "Transferindo..." : "Assumir atendimento"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-full border"
                      aria-hidden="true"
                    >
                      <CircleAlertIcon className="opacity-80" size={16} />
                    </div>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Tem certeza que quer assumir esse atendimento?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        A atendente responsável por esse atendimento não
                        conseguirá mais responder até que o atendimento seja
                        transferido a ela novamente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-transparent text-muted-foreground border-muted-foretext-muted-foreground shadow-none hover:bg-transparent hover:opacity-55">
                      Manter
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        transfer({
                          conversationId: conversation?.id!,
                          sectorId: props.userAuthenticated?.sector?.id!,
                          attendantId: props.userAuthenticated.id,
                        });
                      }}
                      className="bg-sky-500 hover:bg-sky-600"
                    >
                      Assumir atendimento
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
