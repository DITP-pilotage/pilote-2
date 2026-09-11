import type { ToolSet, UIMessage } from "ai";
import { Albert } from "@/server/albert/Albert";
import { buildChatSystemPrompt } from "@/server/albert/systemPrompt";
import {
  type Capacities,
  dashboardDejaCompose,
  detecterCapacities,
  extraireTexteDernierMessageUtilisateur,
} from "@/server/albert/detecteurIntention";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import type { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { getContainer } from "@/server/dependances";
import { displayChoicesTool } from "@/server/albert/tools/displayChoices";
import { createCreateDashboardTool } from "@/server/albert/tools/createDashboard";

/**
 * Câblage de l'agent : quels outils, quel prompt système, pour quelles
 * habilitations et quelle intention.
 *
 * La distinction avec `Albert` : `Albert` est la plomberie LLM — provider,
 * température, persistance dans `llm_calls`. `AssistantIA` est la
 * configuration de l'agent au-dessus. Les sous-agents (`searchChantiers` et
 * consorts) continuent donc de s'adresser directement à `Albert`.
 *
 * Le point de la classe est que `streamText` et `generateText` partagent le
 * MÊME setup. Toute divergence entre ce que voit la route et ce que voit une
 * eval serait invisible : l'eval passerait au vert sur un agent qui n'est pas
 * celui de la production.
 */

type AgentContext = Record<string, unknown> | undefined;

type ParamètresSetup = {
  habilitations: Habilitations;
  agentContext: AgentContext;
  capacities: Capacities;
  userId: string;
};

export class AssistantIA {
  /**
   * `create_dashboard` et `export_rapport` ne sont exposés que si l'intention
   * est détectée : la liste d'outils fait partie de ce qu'on évalue.
   */
  private static construireTools({
    habilitations,
    capacities,
    userId,
  }: Omit<ParamètresSetup, "agentContext">): ToolSet {
    const container = getContainer("albert");

    const chantiersAccessibles = habilitations.lecture.chantiers;
    const territoiresAccessibles = habilitations.lecture.territoires;

    return {
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
      get_chantier_objectifs: container.resolve(
        "createGetChantierObjectifsTool",
      )({ chantiersAccessibles }),
      get_chantiers_signales: container.resolve(
        "createGetChantiersSignalesTool",
      )({ territoiresAccessibles, chantiersAccessibles }),
      search_chantiers: container.resolve("createSearchChantiersTool")({
        chantiersAccessibles,
      }),
      search_indicateurs: container.resolve("createSearchIndicateursTool")({
        chantiersAccessibles,
      }),
      search_territoires: container.resolve("createSearchTerritoiresTool")(),
      display_choices: displayChoicesTool,
      ...(capacities.dashboard
        ? { create_dashboard: createCreateDashboardTool() }
        : {}),
      ...(capacities.exportRapport
        ? {
            export_rapport: container.resolve("createExportRapportTool")({
              userId,
            }),
          }
        : {}),
    };
  }

  private static construireSetup({
    habilitations,
    agentContext,
    capacities,
    userId,
  }: ParamètresSetup) {
    return {
      tools: this.construireTools({ habilitations, capacities, userId }),
      systemPrompt: buildChatSystemPrompt({
        territoiresAccessibles: habilitations.lecture.territoires,
        agentContext,
        capacities,
      }),
    };
  }

  /**
   * `dashboardDejaCompose` regarde l'historique : une fois un dashboard
   * composé, l'outil reste exposé pour que l'agent puisse le retoucher, même
   * si le dernier message ne le redemande pas.
   */
  private static detecterCapacitiesDepuisMessages(
    messages: PiloteUIMessage[],
  ): Capacities {
    const capacitiesDetectees = detecterCapacities(
      extraireTexteDernierMessageUtilisateur(messages),
    );

    return {
      ...capacitiesDetectees,
      dashboard:
        capacitiesDetectees.dashboard || dashboardDejaCompose(messages),
    };
  }

  static async streamText({
    chatId,
    messages,
    habilitations,
    agentContext,
    userId,
    model,
  }: {
    chatId: string;
    messages: UIMessage[];
    habilitations: Habilitations;
    agentContext: AgentContext;
    userId: string;
    model?: string;
  }) {
    const capacities = this.detecterCapacitiesDepuisMessages(
      messages as PiloteUIMessage[],
    );
    const { tools, systemPrompt } = this.construireSetup({
      habilitations,
      agentContext,
      capacities,
      userId,
    });

    return Albert.streamText({
      chatId,
      messages,
      systemPrompt,
      userId,
      model,
      tools,
    });
  }

  /**
   * Un tour d'agent sur une question isolée, `steps` inclus. Pas d'historique,
   * donc pas de `dashboardDejaCompose` : les capacities viennent de la seule
   * question.
   */
  static async generateText({
    chatId,
    question,
    habilitations,
    agentContext,
    userId,
    model,
  }: {
    chatId: string;
    question: string;
    habilitations: Habilitations;
    agentContext: AgentContext;
    userId: string;
    model?: string;
  }) {
    const capacities = detecterCapacities(question);
    const { tools, systemPrompt } = this.construireSetup({
      habilitations,
      agentContext,
      capacities,
      userId,
    });

    return Albert.generateText({
      chatId,
      prompt: question,
      systemPrompt,
      userId,
      model,
      tools,
    });
  }
}
