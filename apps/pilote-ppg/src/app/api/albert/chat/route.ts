import { validateUIMessages } from "ai";
import { z } from "zod";
import { Albert } from "@/server/albert/Albert";
import { displayChoicesTool } from "@/server/albert/tools/displayChoices";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { buildChatSystemPrompt } from "@/server/albert/systemPrompt";
import {
  Capacities,
  dashboardDejaCompose,
  detecterCapacities,
  extraireTexteDernierMessageUtilisateur,
} from "@/server/albert/detecteurIntention";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { getContainer } from "@/server/dependances";
import { createCreateDashboardTool } from "@/server/albert/tools/createDashboard";

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
    const body = chatRequestSchema.parse(await request.json());
    const messages = await validateUIMessages({ messages: body.messages });

    const agentContext = body.agentContext ?? undefined;

    const territoiresAccessibles = session.habilitations.lecture.territoires;

    const container = getContainer("albert");
    const createGetTauxAvancementTerritoireTool = container.resolve(
      "createGetTauxAvancementTerritoireTool",
    );
    const createGetChantiersTool = container.resolve("createGetChantiersTool");
    const createGetChantierIndicateursTool = container.resolve(
      "createGetChantierIndicateursTool",
    );
    const createGetChantierCommentairesTool = container.resolve(
      "createGetChantierCommentairesTool",
    );
    const createGetChantierObjectifsTool = container.resolve(
      "createGetChantierObjectifsTool",
    );
    const createGetChantiersSignalesTool = container.resolve(
      "createGetChantiersSignalesTool",
    );
    const createSearchChantiersTool = container.resolve(
      "createSearchChantiersTool",
    );
    const createSearchIndicateursTool = container.resolve(
      "createSearchIndicateursTool",
    );
    const createSearchTerritoiresTool = container.resolve(
      "createSearchTerritoiresTool",
    );
    const createExportRapportTool = container.resolve(
      "createExportRapportTool",
    );

    const messagesPilote = messages as PiloteUIMessage[];
    const texteDernierMessage =
      extraireTexteDernierMessageUtilisateur(messagesPilote);
    const capacitiesDetectees = detecterCapacities(texteDernierMessage);
    const capacities: Capacities = {
      ...capacitiesDetectees,
      dashboard:
        capacitiesDetectees.dashboard || dashboardDejaCompose(messagesPilote),
    };

    const systemPrompt = buildChatSystemPrompt({
      territoiresAccessibles,
      agentContext,
      capacities,
    });
    const getTauxAvancementTerritoire = createGetTauxAvancementTerritoireTool({
      habilitations: session.habilitations,
    });
    const getChantiers = createGetChantiersTool({
      territoiresAccessibles,
      chantiersAccessibles: session.habilitations.lecture.chantiers,
    });
    const getChantierIndicateurs = createGetChantierIndicateursTool();
    const getChantierCommentaires = createGetChantierCommentairesTool({
      territoiresAccessibles,
    });
    const getChantierObjectifs = createGetChantierObjectifsTool({
      chantiersAccessibles: session.habilitations.lecture.chantiers,
    });
    const getChantiersSignales = createGetChantiersSignalesTool({
      territoiresAccessibles,
      chantiersAccessibles: session.habilitations.lecture.chantiers,
    });
    const searchChantiers = createSearchChantiersTool({
      chantiersAccessibles: session.habilitations.lecture.chantiers,
    });
    const searchIndicateurs = createSearchIndicateursTool({
      chantiersAccessibles: session.habilitations.lecture.chantiers,
    });
    const searchTerritoires = createSearchTerritoiresTool();
    const exportRapport = createExportRapportTool({
      userId: session.user.id,
    });

    const createDashboard = createCreateDashboardTool();

    const tools = {
      get_taux_avancement_territoire: getTauxAvancementTerritoire,
      get_chantiers: getChantiers,
      get_chantiers_signales: getChantiersSignales,
      get_indicateurs: getChantierIndicateurs,
      get_chantier_commentaires: getChantierCommentaires,
      get_chantier_objectifs: getChantierObjectifs,
      search_chantiers: searchChantiers,
      search_indicateurs: searchIndicateurs,
      search_territoires: searchTerritoires,
      display_choices: displayChoicesTool,
      ...(capacities.dashboard ? { create_dashboard: createDashboard } : {}),
      ...(capacities.exportRapport ? { export_rapport: exportRapport } : {}),
    };

    const result = await Albert.streamText({
      chatId: body.id,
      messages,
      systemPrompt,
      userId: session.user.id,
      model: body.model,
      tools,
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

    const variables = await getContainer("legacy")
      .resolve("recupererToutesLesVariablesContenuUseCase")
      .run();
    const persistanceActive =
      variables.NEXT_PUBLIC_FF_HISTORIQUE_ALBERT === true;

    if (!persistanceActive) {
      return result.toUIMessageStreamResponse({ onError: onErreurFlux });
    }

    const enregistrerConversation = container.resolve(
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
