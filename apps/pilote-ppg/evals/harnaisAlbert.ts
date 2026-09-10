import { generateText, stepCountIs, type ToolSet } from "ai";
import { Albert } from "@/server/albert/Albert";
import { prisma } from "@/server/db/prisma";
import { buildChatSystemPrompt } from "@/server/albert/systemPrompt";
import {
  type Capacities,
  detecterCapacities,
} from "@/server/albert/detecteurIntention";
import { getContainer } from "@/server/dependances";
import { displayChoicesTool } from "@/server/albert/tools/displayChoices";

/**
 * SPIKE — harnais partage par les evals qui font tourner un vrai tour d'agent.
 *
 * Reproduit le cablage de `src/app/api/albert/chat/route.ts` sans passer par
 * `Albert.streamText`, pour deux raisons :
 *  - streamText ecrit une ligne dans `llm_calls` a chaque appel, ce qui
 *    polluerait la table qui sert justement de dataset ;
 *  - on a besoin des `steps` en retour pour inspecter les tool calls.
 */

export type ToolCallObserve = { toolName: string; input?: unknown };

type HabilitationsCompletes = {
  chantiersAccessibles: string[];
  territoiresAccessibles: string[];
};

let habilitationsEnCache: Promise<HabilitationsCompletes> | undefined;

/**
 * Habilitations d'un profil qui voit tout, lues depuis la base de dev.
 *
 * Memoisee plutot que resolue au chargement du module : un `await` de premier
 * niveau dans un `.eval.ts` passe a l'execution (Vite le transpile) mais fait
 * echouer `tsc` avec la config du projet.
 */
export function chargerHabilitationsCompletes(): Promise<HabilitationsCompletes> {
  habilitationsEnCache ??= (async () => {
    const [chantiers, territoires] = await Promise.all([
      prisma.chantier_identite.findMany({ select: { id: true } }),
      prisma.territoire.findMany({ select: { code: true } }),
    ]);

    return {
      chantiersAccessibles: chantiers.map((chantier) => chantier.id),
      territoiresAccessibles: territoires.map((territoire) => territoire.code),
    };
  })();

  return habilitationsEnCache;
}

/**
 * Construit le ToolSet reel — memes schemas Zod, memes descriptions et memes
 * acces Prisma qu'en production.
 */
export function construireTools({
  chantiersAccessibles,
  territoiresAccessibles,
  capacities,
}: {
  chantiersAccessibles: string[];
  territoiresAccessibles: string[];
  capacities: Capacities;
}): ToolSet {
  const container = getContainer("albert");

  const habilitations = {
    lecture: {
      chantiers: chantiersAccessibles,
      territoires: territoiresAccessibles,
      périmètres: [],
    },
  } as never;

  const tools: ToolSet = {
    get_taux_avancement_territoire: container.resolve(
      "createGetTauxAvancementTerritoireTool",
    )({ habilitations }),
    get_chantiers: container.resolve("createGetChantiersTool")({
      territoiresAccessibles,
      chantiersAccessibles,
    }),
    get_indicateurs: container.resolve("createGetChantierIndicateursTool")(),
    get_chantier_commentaires: container.resolve(
      "createGetChantierCommentairesTool",
    )({ territoiresAccessibles }),
    get_chantier_objectifs: container.resolve("createGetChantierObjectifsTool")({
      chantiersAccessibles,
    }),
    get_chantiers_signales: container.resolve("createGetChantiersSignalesTool")({
      territoiresAccessibles,
      chantiersAccessibles,
    }),
    search_chantiers: container.resolve("createSearchChantiersTool")({
      chantiersAccessibles,
    }),
    search_indicateurs: container.resolve("createSearchIndicateursTool")({
      chantiersAccessibles,
    }),
    search_territoires: container.resolve("createSearchTerritoiresTool")(),
    display_choices: displayChoicesTool,
  };

  // La route n'expose create_dashboard / export_rapport que si l'intention est
  // detectee : on reproduit ce filtrage, sinon l'eval jugerait un agent qui n'a
  // pas les memes outils qu'en prod.
  if (!capacities.dashboard) delete tools.create_dashboard;
  if (!capacities.exportRapport) delete tools.export_rapport;

  return tools;
}

/**
 * Joue un tour d'agent complet sur une question utilisateur et renvoie le texte
 * final, les tool calls observes et l'usage.
 */
export async function jouerTourAgent({
  question,
  chantiersAccessibles,
  territoiresAccessibles,
  model = "openweight-large",
}: {
  question: string;
  chantiersAccessibles: string[];
  territoiresAccessibles: string[];
  model?: string;
}) {
  const capacities = detecterCapacities(question);
  const tools = construireTools({
    chantiersAccessibles,
    territoiresAccessibles,
    capacities,
  });

  const systemPrompt = buildChatSystemPrompt({
    territoiresAccessibles,
    agentContext: undefined,
    capacities,
  });

  const resultat = await generateText({
    model: Albert.createProvider().chat(model),
    system: systemPrompt,
    prompt: question,
    tools,
    stopWhen: stepCountIs(50),
    temperature: 0.2,
  });

  const toolCalls: ToolCallObserve[] = resultat.steps.flatMap((etape) =>
    etape.toolCalls.map((appel) => ({
      toolName: appel.toolName,
      input: appel.input,
    })),
  );

  return {
    texte: resultat.text,
    toolCalls,
    nbEtapes: resultat.steps.length,
    usage: resultat.usage,
  };
}
