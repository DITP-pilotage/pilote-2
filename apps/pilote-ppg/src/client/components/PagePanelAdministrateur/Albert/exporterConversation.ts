import { slugifier } from "@/client/utils/strings";

/** Le nom du document : le titre de la conversation, à défaut sa date de création. */
export const nomConversation = ({
  titre,
  createdAt,
}: {
  titre: string;
  createdAt: Date;
}): string =>
  slugifier({ texte: titre }) ||
  `conversation-${createdAt.toISOString().slice(0, 10)}`;
