import { listChannels } from "@/app/actions/channels";
import { HeaderConnections } from "@/components/header-connections";
import ModalRegisterChannels from "@/components/modal-register-channels";
import TableChannels from "@/components/table-channels";

export default async function ChannelsPage() {
  const [data] = await listChannels();
  const channels = data ?? [];
  return (
    <>
      <HeaderConnections />
      <main className="p-6">
        <TableChannels channels={channels} />
      </main>
      <ModalRegisterChannels />
    </>
  );
}
