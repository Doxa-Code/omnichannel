"use client";

import { CircleAlertIcon } from "lucide-react";
import { PropsWithChildren, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Props = {
  resourceName: string;
  title?: string;
  content?: string;
  onConfirm?: () => void;
  hidden?: boolean;
} & PropsWithChildren;

export default function ModalConfirmDelete(props: Props) {
  const id = useId();
  const [inputValue, setInputValue] = useState("");

  if (props.hidden) {
    return <></>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent>
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full border"
            aria-hidden="true"
          >
            <CircleAlertIcon className="opacity-80" size={16} />
          </div>
          <DialogHeader>
            <DialogTitle className="sm:text-center">
              {props.title || "Tem certeza que deseja remover este recurso?"}
            </DialogTitle>
            <DialogDescription className="sm:text-center">
              {props.content ||
                "Esta ação não pode ser desfeita. Para confirmar, insira o nome do recurso para confirmar"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className="space-y-5">
          <div className="*:not-first:mt-2">
            <Input
              id={id}
              type="text"
              placeholder={props.resourceName}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              inputClassName="placeholder:!text-black/40"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="flex-1">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="button"
              className="flex-1"
              disabled={inputValue !== props.resourceName}
              onClick={() => {
                props.onConfirm?.();
              }}
            >
              Remover
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
