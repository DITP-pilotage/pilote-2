import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { getContainer } from "@/server/dependances";

export async function POST(
  _request: Request,
  {
    params,
  }: { params: Promise<{ conversationId: string; messageId: string }> },
) {
  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { conversationId, messageId } = await params;

  const container = getContainer("albert");
  const exporterDerniereReponseUseCase = container.resolve(
    "exporterDerniereReponseUseCase",
  );

  const resultat = await exporterDerniereReponseUseCase.execute({
    conversationId,
    messageId,
    utilisateurId: session.user.id,
  });

  if (resultat.statut === "conversation_introuvable") {
    return new Response("Conversation introuvable", { status: 404 });
  }

  if (resultat.statut === "message_introuvable") {
    return new Response("Message introuvable", { status: 404 });
  }

  if (resultat.statut === "message_invalide") {
    return new Response("Message invalide", { status: 400 });
  }

  return new Response(resultat.buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${resultat.filename}"`,
    },
  });
}
