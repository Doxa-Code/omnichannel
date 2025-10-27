"use client";
import { useChannels } from "@/hooks/use-channels";
import { TitlePage } from "./title-page";
import { Button } from "./ui/button";

export const HeaderConnections: React.FC = () => {
  const { toggleOpen } = useChannels();
  return (
    <header className="pt-6 flex justify-between items-center px-6">
      <TitlePage>Conexões</TitlePage>
      <Button onClick={() => toggleOpen()}>Nova conexão</Button>
    </header>
  );
};
