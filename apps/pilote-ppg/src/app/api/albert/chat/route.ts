import { validateUIMessages } from "ai";
import { z } from "zod";
import { AssistantIA } from "@/server/albert/AssistantIA";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { getContainer } from "@/server/dependances";
import {
  calculerAccesAskAI,
  construireFeatureFlipsAskAI,
} from "@/server/albert/accesAskAI";
import { estEmailAutoriseAskAITerritoire } from "@/server/albert/emailsAutorisesAskAITerritoire";

const chatRequestSchema = z
  .object({
    id: z.string().uuid(),
    messages: z.array(z.any()),
    agentContext: z.record(z.string(), z.unknown()).nullable().optional(),
    model: z
      .enum(["openweight-medium", "openweight-large"])
      .default("openweight-large"),
  })
  .passthrough();

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const variables = await getContainer("legacy")
      .resolve("recupererToutesLesVariablesContenuUseCase")
      .run();

    const { peutUtiliserAskAI } = calculerAccesAskAI({
      profil: session.profil ?? null,
      emailAutoriseAskAITerritoire: estEmailAutoriseAskAITerritoire(
        session.user.email,
      ),
      featureFlips: construireFeatureFlipsAskAI(variables),
    });

    if (!peutUtiliserAskAI) {
      return new Response("Forbidden", { status: 403 });
    }

    const body = chatRequestSchema.parse(await request.json());
    const messages = await validateUIMessages({ messages: body.messages });

    const agentContext = body.agentContext ?? undefined;

    const messagesPilote = messages as PiloteUIMessage[];

    const result = await AssistantIA.streamText({
      chatId: body.id,
      messages,
      habilitations: session.habilitations,
      agentContext,
      userId: session.user.id,
      model: body.model,
    });

    // Le detail de l'erreur reste cote serveur : une erreur d'appel LLM peut porter un
    // corps de reponse, une URL interne ou des details d'infrastructure. C'est le
    // durcissement introduit par ai v7, dont le defaut est passe a un message generique.
    // Ce handler existe pour deux raisons : rendre ce message en francais, et surtout
    // logger l'erreur — le catch du POST ne couvre pas celles survenant PENDANT le flux,
    // qui disparaissaient donc sans laisser de trace.
    const onErreurFlux = (error: unknown) => {
      // eslint-disable-next-line no-console
      console.error("Erreur dans le flux Albert:", error);
      return "la génération de la réponse a échoué. Vous pouvez réessayer.";
    };

    const enregistrerConversation = getContainer("albert").resolve(
      "enregistrerConversationUseCase",
    );

    return result.toUIMessageStreamResponse<PiloteUIMessage>({
      originalMessages: messagesPilote,
      onError: onErreurFlux,
      onFinish: async ({ messages: messagesFinaux }) => {
        await enregistrerConversation.execute({
          id: body.id,
          utilisateurId: session.user.id,
          messages: messagesFinaux,
          contexte: agentContext ?? null,
        });
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in Albert chat stream:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
