"use client";
import { MailIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useChannels } from "@/hooks/use-channels";
import { RiWhatsappFill } from "@remixicon/react";
import { useServerActionMutation } from "@/hooks/server-action-hooks";
import { upsertChannel } from "@/app/actions/channels";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function ModalRegisterChannels() {
  const queryClient = useQueryClient();
  const { open, toggleOpen, channelDescription, channelId, setChannelValues } =
    useChannels();
  const { toast } = useToast();
  const upsertChannelAction = useServerActionMutation(upsertChannel, {
    onError(error) {
      toast({
        title: "Erro ao salvar a conexão",
        description: error.message,
        variant: "error",
        duration: 3000,
      });
    },
    onSuccess() {
      toast({
        title: "Salvo com sucesso!",
        variant: "success",
        duration: 3000,
      });
      toggleOpen();
      setChannelValues("", "");
      queryClient.invalidateQueries({
        exact: true,
        queryKey: ["list-channels"],
      });
    },
  });
  return (
    <Dialog open={open} onOpenChange={toggleOpen}>
      <DialogContent>
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex size-20 shrink-0 items-center justify-center rounded-full border"
            aria-hidden="true"
          >
            <RiWhatsappFill className="size-11 fill-black" />
          </div>
          <DialogHeader>
            <DialogTitle className="sm:text-center">Nova conexão</DialogTitle>
            <DialogDescription className="sm:text-center">
              Descreva o nome da conexão
            </DialogDescription>
          </DialogHeader>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            upsertChannelAction.mutate({
              id: channelId,
              name: form.get("name")?.toString() ?? "",
            });
          }}
          className="flex flex-col gap-5"
        >
          <Input
            id="dialog-subscribe"
            className="w-full"
            placeholder="Whatsapp Loja 1"
            type="text"
            aria-label="Nome"
            name="name"
            value={channelDescription}
            onChange={(e) => setChannelValues(channelId, e.target.value)}
          />
          <Button type="button" className="w-full">
            {upsertChannelAction.isPending ? "Cadastrando..." : "Cadastrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
