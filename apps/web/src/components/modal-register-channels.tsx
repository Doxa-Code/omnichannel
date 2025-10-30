"use client";
import { upsertChannel } from "@/app/actions/channels";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useServerActionMutation } from "@/hooks/server-action-hooks";
import { useChannels } from "@/hooks/use-channels";
import { useToast } from "@/hooks/use-toast";
import { RiInstagramLine, RiWhatsappLine } from "@remixicon/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChannelTypeDropdown } from "./channel-type-dropdown";
import { z } from "zod"

export default function ModalRegisterChannels() {
  const queryClient = useQueryClient();

  const { open, toggleOpen, channelDescription, channelId, setChannelValues } =
    useChannels();

  const [channelType, setChannelType] = useState("whatsapp");

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

  const channelFormSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "O nome é obrigatório"),
    type: z.enum(["whatsapp", "instagram"])
  });

  return (
    <Dialog open={open} onOpenChange={toggleOpen}>
      <DialogContent>
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex size-20 shrink-0 items-center justify-center rounded-full border"
            aria-hidden="true"
          >
            <RiWhatsappLine
              className="absolute size-11 fill-green-500 left-1/2 -translate-x-1/2"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 0 100%)'
              }}
            />
            <RiInstagramLine
              className="absolute size-11 fill-pink-500 left-1/2 -translate-x-1/2"
              style={{
                clipPath: 'polygon(100% 0, 100% 100%, 0 100%)'
              }}
            />
          </div>
          <DialogHeader>
            <DialogTitle className="sm:text-center">Nova conexão</DialogTitle>
          </DialogHeader>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const rawData = {
              id: channelId,
              name: form.get("name")?.toString() ?? "",
              type: channelType,
            };
            const result = channelFormSchema.safeParse(rawData);
            if (!result.success) {
              console.log("Erro no formulário:", result.error.format());
              return;
            }
            upsertChannelAction.mutate(result.data);
          }}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Tipo de conexão</label>
            <ChannelTypeDropdown
              defaultValue={channelType}
              onChange={setChannelType}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Nome da conexão</label>
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
          </div>

          <Button type="submit" className="w-full">
            {upsertChannelAction.isPending ? "Cadastrando..." : "Cadastrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
