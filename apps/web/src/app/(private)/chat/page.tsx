import {
  getUserAuthenticate,
  getWorkspaceSelected,
} from "@/app/actions/security";
import { Chat } from "@/components/chat";
import { listAllConversations } from "../../actions/conversations";

export default async function Page() {
  const [conversations] = await listAllConversations();
  const [userAuthenticated] = await getUserAuthenticate();
  const workspaceId = await getWorkspaceSelected();

  return (
    <main className="w-full !overflow-y-hidden flex p-0 flex-1">
      <Chat
        conversations={conversations ?? []}
        userAuthenticated={userAuthenticated?.raw?.()!}
        workspaceId={workspaceId ?? ""}
      />
    </main>
  );
}
