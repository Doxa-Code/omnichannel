"use client";

import {
  ChartNoAxesColumnDecreasing,
  Edit,
  Trash,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  connectChannel,
  disconnectChannel,
  listChannels,
  removeChannel,
} from "@/app/actions/channels";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import {
  useServerActionMutation,
  useServerActionQuery,
} from "@/hooks/server-action-hooks";
import { Channel } from "@omnichannel/core/domain/entities/channel";
import { Badge } from "./ui/badge";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Spinner } from "flowbite-react";
import ModalConfirmDelete from "./modal-confirm-delete";
import { RiWhatsappFill } from "@remixicon/react";
import { useChannels } from "@/hooks/use-channels";

type Props = {
  channels: Channel.Raw[];
};

export default function TableChannels(props: Props) {
  const { toggleOpen, setChannelValues } = useChannels();
  const [channelIdOnConnecting, setChannelIdOnConnecting] = useState("");
  const { data, isPending } = useServerActionQuery(listChannels, {
    input: undefined,
    queryKey: ["list-channels"],
  });

  const queryClient = useQueryClient();

  const connectChannelAction = useServerActionMutation(connectChannel, {
    async onSuccess() {
      toast({
        title: "Sucesso",
        description: "Canal conectado com sucesso.",
      });
      await queryClient.invalidateQueries({ queryKey: ["list-channels"] });
    },
  });

  const disconnectChannelAction = useServerActionMutation(disconnectChannel, {
    async onSuccess() {
      toast({
        title: "Sucesso",
        description: "Canal desconectado com sucesso.",
      });
      await queryClient.invalidateQueries({ queryKey: ["list-channels"] });
    },
  });

  const removeChannelAction = useServerActionMutation(removeChannel, {
    async onSuccess() {
      toast({
        title: "Sucesso",
        description: "Canal removido com sucesso.",
      });
      await queryClient.invalidateQueries({ queryKey: ["list-channels"] });
    },
  });

  const channels = useMemo(
    () => (data ?? props.channels).sort((a, b) => a.name.localeCompare(b.name)),
    [data, props.channels]
  );

  useEffect(() => {
    window.fbAsyncInit = function () {
      FB.init({
        appId: "579228267872440",
        autoLogAppEvents: true,
        xfbml: true,
        version: "v23.0",
      });
    };

    (function (d, s, id) {
      var js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode?.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  }, []);

  return (
    <div className="space-y-4 relative h-full flex flex-col">
      {/* Table */}
      <div className="bg-background relative flex-1 overflow-hidden rounded-md border">
        <Table>
          <TableHead>
            <TableRow
              data-disabled={isPending}
              className="hover:bg-transparent data-[disabled=true]:opacity-40"
            >
              <TableHeaderCell className="px-4 w-32"></TableHeaderCell>
              <TableHeaderCell>Descrição</TableHeaderCell>
              <TableHeaderCell>Channel</TableHeaderCell>
              <TableHeaderCell className="px-4 w-44">Status</TableHeaderCell>
              <TableHeaderCell className="px-4 w-80">Ações</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {channels?.length
              ? channels.map((channel) => (
                  <TableRow key={channel.id}>
                    <TableCell className="py-2">
                      {channel.type === "whatsapp" ? (
                        <RiWhatsappFill />
                      ) : (
                        <ChartNoAxesColumnDecreasing />
                      )}
                    </TableCell>
                    <TableCell className="py-2">{channel.name}</TableCell>
                    <TableCell className="py-2">
                      {channel.type === "whatsapp"
                        ? channel.payload.phoneNumber || "-"
                        : "-"}
                    </TableCell>
                    <TableCell className="data-[danger=true]:text-rose-500 py-2">
                      {channel.status === "connected" ? (
                        <Badge className="bg-transparent text-green-500 border border-green-500">
                          <div className="size-2 rounded-full bg-green-500" />
                          <span>Conectado</span>
                        </Badge>
                      ) : (
                        <Badge className="bg-transparent text-rose-500 border border-rose-500">
                          <div className="size-2 rounded-full bg-rose-500" />
                          <span>Desconectado</span>
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-2 gap-2 flex items-center">
                      <Button
                        onClick={() => {
                          setChannelIdOnConnecting(channel.id);
                          FB.login(
                            (response) => {
                              connectChannelAction.mutate({
                                id: channel.id,
                                type: channel.type,
                                inputPayload: {
                                  code: response.authResponse.code || "",
                                },
                              });
                            },
                            {
                              config_id: "1315527863561114",
                              response_type: "code",
                              override_default_response_type: true,
                              extras: {
                                version: "v3",
                                featureType: "whatsapp_business_app_onboarding",
                                features: [
                                  { name: "app_only_install" },
                                  { name: "marketing_messages_lite" },
                                ],
                              },
                            }
                          );
                        }}
                        hidden={channel.status === "connected"}
                        variant="outline"
                      >
                        {channelIdOnConnecting === channel.id && isPending ? (
                          <Spinner className="size-3" />
                        ) : (
                          <Wifi className="size-3" />
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setChannelValues(channel.id, channel.name);
                          toggleOpen();
                        }}
                        variant="outline"
                        className="border-blue-200 hover:bg-blue-100"
                      >
                        <Edit className="size-3 stroke-blue-500" />
                      </Button>
                      <ModalConfirmDelete
                        hidden={channel.status === "disconnected"}
                        resourceName={channel.name}
                        title="Desconectar canal"
                        content="Tem certeza que deseja desconectar este canal?"
                        onConfirm={() => {
                          disconnectChannelAction.mutate({ id: channel.id });
                        }}
                      >
                        <Button variant="outline">
                          <WifiOff className="size-3" />
                        </Button>
                      </ModalConfirmDelete>
                      <ModalConfirmDelete
                        resourceName={channel.name}
                        onConfirm={() => {
                          removeChannelAction.mutate({ id: channel.id });
                        }}
                      >
                        <Button
                          variant="outline"
                          className="border-rose-200 hover:bg-rose-100"
                        >
                          <Trash className="size-3 stroke-rose-500" />
                        </Button>
                      </ModalConfirmDelete>
                    </TableCell>
                  </TableRow>
                ))
              : null}

            <TableRow data-hidden={!!channels?.length}>
              <TableCell colSpan={8} className="h-24 z-50 text-center">
                Nenhuma conexão encontrada.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
