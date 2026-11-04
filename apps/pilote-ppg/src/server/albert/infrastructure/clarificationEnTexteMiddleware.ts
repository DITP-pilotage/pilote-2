import { generateId } from "ai";
import type {
  LanguageModelV4CallOptions,
  LanguageModelV4Content,
  LanguageModelV4Middleware,
  LanguageModelV4StreamPart,
  LanguageModelV4ToolCall,
} from "@ai-sdk/provider";
import { clarifyWithChoicesInputSchema } from "@/server/albert/tools/clarifyWithChoices";

const CLARIFY_WITH_CHOICES = "clarify_with_choices";

/**
 * Rattrape une clarification que le modèle écrit en JSON dans sa réponse au
 * lieu d'appeler `clarify_with_choices` (PIL-1855).
 *
 * gpt-oss le fait quand la clarification est le premier appel du tour : 16 fois
 * sur 166 en eval, jamais après un autre outil. L'utilisateur voyait alors le
 * JSON brut. Le middleware remplace ce texte par l'appel que le modèle voulait
 * faire : l'outil s'exécute, l'interface affiche l'encart de choix, et
 * l'historique garde un vrai appel d'outil.
 *
 * Il n'agit que si l'appel expose `clarify_with_choices` et que le modèle n'a
 * appelé aucun outil : les sous-agents ne sont pas concernés. Un texte qui ne
 * commence pas par `{` passe sans délai ; un texte qui commence par `{` est
 * retenu jusqu'à la fin de l'étape, puis rendu tel quel s'il n'est pas une
 * clarification valide.
 */
export const clarificationEnTexteMiddleware: LanguageModelV4Middleware = {
  specificationVersion: "v4",

  wrapGenerate: async ({ doGenerate, params }) => {
    const result = await doGenerate();
    if (!exposeClarification({ params })) return result;
    if (result.content.some((part) => part.type === "tool-call")) return result;

    const texte = result.content
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("");
    const appel = clarificationDepuisTexte({ texte });
    if (!appel) return result;

    return {
      ...result,
      content: [
        ...result.content.filter(
          (part): part is LanguageModelV4Content => part.type !== "text",
        ),
        appel,
      ],
      finishReason: { ...result.finishReason, unified: "tool-calls" },
    };
  },

  wrapStream: async ({ doStream, params }) => {
    const result = await doStream();
    if (!exposeClarification({ params })) return result;

    return {
      ...result,
      stream: result.stream.pipeThrough(retenirClarificationEnTexte()),
    };
  },
};

function exposeClarification({
  params,
}: {
  params: LanguageModelV4CallOptions;
}): boolean {
  return (params.tools ?? []).some(
    (tool) => tool.type === "function" && tool.name === CLARIFY_WITH_CHOICES,
  );
}

function clarificationDepuisTexte({
  texte,
}: {
  texte: string;
}): LanguageModelV4ToolCall | null {
  const json = texte
    .trim()
    .replace(/^```(?:json)?\s*/u, "")
    .replace(/\s*```$/u, "");
  if (!json.startsWith("{")) return null;

  let candidat: unknown;
  try {
    candidat = JSON.parse(json);
  } catch {
    return null;
  }

  const parsed = clarifyWithChoicesInputSchema.safeParse(candidat);
  if (!parsed.success) return null;

  return {
    type: "tool-call",
    toolCallId: generateId(),
    toolName: CLARIFY_WITH_CHOICES,
    input: JSON.stringify(parsed.data),
    // Visible dans le transcript de `llm_calls` : on peut compter les rattrapages.
    providerMetadata: { pilote: { clarificationRattrapee: true } },
  };
}

/**
 * Laisse passer le flux, sauf les blocs de texte qui commencent par `{` : ils
 * sont retenus jusqu'à la fin de l'étape, puis remplacés par l'appel d'outil
 * s'ils forment une clarification et qu'aucun outil n'a été appelé.
 */
function retenirClarificationEnTexte() {
  const retenus = new Map<string, LanguageModelV4StreamPart[]>();
  const textes = new Map<string, string>();
  const decides = new Set<string>();
  let outilAppele = false;

  return new TransformStream<
    LanguageModelV4StreamPart,
    LanguageModelV4StreamPart
  >({
    transform(part, controller) {
      switch (part.type) {
        case "text-start":
          retenus.set(part.id, [part]);
          textes.set(part.id, "");
          return;

        case "text-delta": {
          if (decides.has(part.id) || !retenus.has(part.id)) {
            controller.enqueue(part);
            return;
          }
          const texte = (textes.get(part.id) ?? "") + part.delta;
          textes.set(part.id, texte);
          retenus.get(part.id)?.push(part);

          const debut = texte.trimStart();
          if (debut === "") return;
          if (debut.startsWith("{") || debut.startsWith("```")) return;

          // Du texte ordinaire : on rend ce qui a été retenu et on ne retient plus.
          for (const retenu of retenus.get(part.id) ?? []) {
            controller.enqueue(retenu);
          }
          retenus.delete(part.id);
          decides.add(part.id);
          return;
        }

        case "text-end":
          if (retenus.has(part.id)) {
            retenus.get(part.id)?.push(part);
            return;
          }
          controller.enqueue(part);
          return;

        case "tool-call":
          outilAppele = true;
          controller.enqueue(part);
          return;

        case "finish": {
          const texte = [...retenus.keys()]
            .map((id) => textes.get(id) ?? "")
            .join("");
          const appel = outilAppele
            ? null
            : clarificationDepuisTexte({ texte });

          if (appel) {
            retenus.clear();
            controller.enqueue(appel);
            controller.enqueue({
              ...part,
              finishReason: { ...part.finishReason, unified: "tool-calls" },
            });
            return;
          }

          rendreRetenus({ retenus, controller });
          controller.enqueue(part);
          return;
        }

        default:
          controller.enqueue(part);
      }
    },

    // Un flux coupé avant `finish` ne doit pas perdre le texte retenu.
    flush(controller) {
      rendreRetenus({ retenus, controller });
    },
  });
}

function rendreRetenus({
  retenus,
  controller,
}: {
  retenus: Map<string, LanguageModelV4StreamPart[]>;
  controller: TransformStreamDefaultController<LanguageModelV4StreamPart>;
}) {
  for (const parts of retenus.values()) {
    for (const retenu of parts) controller.enqueue(retenu);
  }
  retenus.clear();
}
