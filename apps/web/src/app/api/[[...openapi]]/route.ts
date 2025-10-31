import { retrieveConversation } from "@/app/actions/conversations";
import {
  changeStatusMessage,
  listenAudio,
  markLastMessagesContactAsViewed,
  messageReceived,
  metaVerifyToken,
  retrieveImage,
  sendMessage,
  sendTyping,
} from "@/app/actions/messages";
import { sse } from "@/app/actions/sse";
import {
  createOpenApiServerActionRouter,
  createRouteHandlers,
} from "zsa-openapi";

const router = createOpenApiServerActionRouter({
  pathPrefix: "/api",
})
  .get("/sse", sse)
  .get("/conversation/{conversationId}", retrieveConversation)
  .get("/message/{messageId}/audio", listenAudio)
  .get("/message/{messageId}/image", retrieveImage)
  .get("/message/received", metaVerifyToken)
  .post("/message/received", messageReceived)
  .post("/message/status", changeStatusMessage)
  .post("/message/viewed", markLastMessagesContactAsViewed)
  .post("/message/send", sendMessage)
  .post("/message/typing", sendTyping);

export const { GET, POST, PUT, DELETE } = createRouteHandlers(router) as any;
