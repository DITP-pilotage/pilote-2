import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

export type ChatConversation = {
  id: string;
  utilisateurId: string;
  titre: string;
  messages: PiloteUIMessage[];
  territoireCode: string | null;
  jalon: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ChatConversationResume = Omit<ChatConversation, "messages">;

const LONGUEUR_MAX_TITRE = 80;

export function deriverTitre(messages: PiloteUIMessage[]): string {
  const premierUser = messages.find((message) => message.role === "user");
  if (!premierUser) return "Nouvelle conversation";

  const texte = (premierUser.parts ?? [])
    .filter(
      (part): part is { type: "text"; text: string } => part.type === "text",
    )
    .map((part) => part.text)
    .join(" ")
    .trim();

  if (texte.length === 0) return "Nouvelle conversation";
  return texte.length > LONGUEUR_MAX_TITRE
    ? `${texte.slice(0, LONGUEUR_MAX_TITRE - 1)}…`
    : texte;
}
