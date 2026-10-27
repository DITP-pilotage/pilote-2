import type { ModelMessage, ToolSet, UIMessage } from "ai";
import { Albert } from "@/server/albert/Albert";
import { buildChatSystemPrompt } from "@/server/albert/systemPrompt";
import type { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import { getContainer } from "@/server/dependances";
import { clarifyWithChoicesTool } from "@/server/albert/tools/clarifyWithChoices";

/**
 * Câblage de l'agent : quels outils et quel prompt système, pour quelles
 * habilitations.
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
  userId: string;
};

export class AssistantIA {
  /**
   * Tous les outils sont toujours exposés (PIL-1900) : les exposer selon des
   * mots-clés du dernier message privait l'agent de `create_dashboard` après
   * une clarification, et il rédigeait alors un faux dashboard en texte.
   */
  private static construireTools({
    habilitations,
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
      rediger_synthese_territoire: container.resolve(
        "createRedigerSyntheseTerritoireTool",
      )({ habilitations }),
      rediger_comparaison_territoires: container.resolve(
        "createRedigerComparaisonTerritoiresTool",
      )({ habilitations }),
      get_indicateurs: container.resolve("createGetChantierIndicateursTool")({
        chantiersAccessibles,
      }),
      get_evolution_indicateur: container.resolve(
        "createGetEvolutionIndicateurTool",
      )({ territoiresAccessibles, chantiersAccessibles }),
      get_historique_indicateur: container.resolve(
        "createGetHistoriqueIndicateurTool",
      )({ territoiresAccessibles, chantiersAccessibles }),
      get_chantier_commentaires: container.resolve(
        "createGetChantierCommentairesTool",
      )({ territoiresAccessibles, chantiersAccessibles }),
      get_chantier_objectifs: container.resolve(
        "createGetChantierObjectifsTool",
      )({ chantiersAccessibles }),
      get_chantiers_signales: container.resolve(
        "createGetChantiersSignalesTool",
      )({ territoiresAccessibles, chantiersAccessibles }),
      get_indicateurs_non_a_jour: container.resolve(
        "createGetIndicateursNonAJourTool",
      )({ territoiresAccessibles, chantiersAccessibles }),
      search_chantiers: container.resolve("createSearchChantiersTool")({
        chantiersAccessibles,
      }),
      search_indicateurs: container.resolve("createSearchIndicateursTool")({
        chantiersAccessibles,
      }),
      search_territoires: container.resolve("createSearchTerritoiresTool")(),
      consulter_centre_aide: container.resolve(
        "createConsulterCentreAideTool",
      )(),
      clarify_with_choices: clarifyWithChoicesTool,
      create_dashboard: container.resolve("createCreateDashboardTool")({
        chantiersAccessibles,
      }),
      export_rapport: container.resolve("createExportRapportTool")({
        userId,
      }),
    };
  }

  private static construireSetup({
    habilitations,
    agentContext,
    userId,
  }: ParamètresSetup) {
    return {
      tools: this.construireTools({ habilitations, userId }),
      systemPrompt: buildChatSystemPrompt({
        territoiresAccessibles: habilitations.lecture.territoires,
        agentContext,
      }),
    };
  }

  static async streamText({
    llmCallId,
    chatId,
    messages,
    habilitations,
    agentContext,
    userId,
    model,
  }: {
    llmCallId?: string;
    chatId: string;
    messages: UIMessage[];
    habilitations: Habilitations;
    agentContext: AgentContext;
    userId: string;
    model?: string;
  }) {
    const { tools, systemPrompt } = this.construireSetup({
      habilitations,
      agentContext,
      userId,
    });

    return Albert.streamText({
      llmCallId,
      chatId,
      messages,
      systemPrompt,
      userId,
      model,
      tools,
    });
  }

  /** Un tour d'agent, `steps` inclus, après un éventuel `history` de messages. */
  static async generateText({
    chatId,
    question,
    history,
    habilitations,
    agentContext,
    userId,
    model,
  }: {
    chatId: string;
    question: string;
    history?: ModelMessage[];
    habilitations: Habilitations;
    agentContext: AgentContext;
    userId: string;
    model?: string;
  }) {
    const { tools, systemPrompt } = this.construireSetup({
      habilitations,
      agentContext,
      userId,
    });

    return Albert.generateText({
      chatId,
      prompt: question,
      history,
      systemPrompt,
      userId,
      model,
      tools,
    });
  }
}
