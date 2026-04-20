import { marked } from "marked";
import axios from "axios";
import logger from "@/server/infrastructure/Logger";

export function envoieMessageTchap(
  messageErreur: string,
  baseUrl: string,
  roomId: string,
  accessToken: string,
): void {
  const messageId = Date.now() * 1_000_000;

  const url = `${baseUrl}/_matrix/client/v3/rooms/${roomId}/send/m.room.message/${messageId}?access_token=${accessToken}`;

  const data = {
    body: messageErreur,
    msgtype: "m.text",
    format: "org.matrix.custom.html",
    formatted_body: marked(messageErreur),
  };

  axios
    .put(url, data, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then(() =>
      logger.info(
        { categorie: "notification", source: "notification-tchap" },
        "Message Tchap envoyé",
      ),
    )
    .catch((error) => {
      const axiosError = error as {
        response?: { status: number; data: unknown };
        stack?: string;
        message: string;
      };
      logger.error(
        {
          categorie: "notification",
          source: "notification-tchap",
          statusCode: axiosError.response?.status,
          responseData: axiosError.response?.data,
          errorStack: axiosError.stack,
        },
        `Erreur envoi message Tchap : ${axiosError.message}`,
      );
    });
}
