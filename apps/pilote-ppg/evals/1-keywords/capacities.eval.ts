import { createScorer, evalite } from "evalite";
import { AssistantIA } from "@/server/albert/AssistantIA";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import type { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";

/**
 * Niveau 1 — outils chargés selon la conversation.
 *
 * `create_dashboard` et `export_rapport` ne sont exposés à l'agent que si
 * l'intention est détectée. La suite passe par le vrai câblage
 * d'`AssistantIA`, sans appeler le modèle : la liste d'outils est arrêtée avant
 * l'appel LLM, donc le résultat est déterministe.
 *
 * Référence observée le 2026-09-24 : 100 % sur 6 cas, en 5 ms.
 */

const OUTILS_CONDITIONNELS = ["create_dashboard", "export_rapport"] as const;
type OutilConditionnel = (typeof OUTILS_CONDITIONNELS)[number];

type Case = {
  messages: PiloteUIMessage[];
  reason: string;
};

const PERIMETRE_VIDE = { chantiers: [], territoires: [], périmètres: [] };

const HABILITATIONS: Habilitations = {
  lecture: PERIMETRE_VIDE,
  saisieCommentaire: PERIMETRE_VIDE,
  saisieIndicateur: PERIMETRE_VIDE,
  responsabilite: PERIMETRE_VIDE,
  gestionUtilisateur: PERIMETRE_VIDE,
};

const utilisateur = (text: string): PiloteUIMessage => ({
  id: text,
  role: "user",
  parts: [{ type: "text", text }],
});

const assistantAvecDashboard: PiloteUIMessage = {
  id: "dashboard-compose",
  role: "assistant",
  parts: [
    { type: "text", text: "Voici le tableau de bord de la Bretagne." },
    {
      type: "tool-create_dashboard",
      toolCallId: "call-1",
      state: "output-available",
      input: {
        task: "Tableau de bord Bretagne",
        territoire_codes: ["REG-53"],
        jalons: [2026],
      },
      output: { titre: "Bretagne", containers: [], _output_instructions: "" },
    },
  ],
};

const CASES: { input: Case; expected: OutilConditionnel[] }[] = [
  {
    input: {
      messages: [
        utilisateur(
          "Affiche un tableau de bord des indicateurs de la Bretagne",
        ),
      ],
      reason: "dashboard explicite",
    },
    expected: ["create_dashboard"],
  },
  {
    input: {
      messages: [
        utilisateur("Exporte-moi un rapport Markdown sur la Bretagne"),
      ],
      reason: "export explicite",
    },
    expected: ["export_rapport"],
  },
  {
    input: {
      messages: [
        utilisateur("Fais-moi une synthèse de l'avancement du chantier CH-004"),
      ],
      reason: "synthèse : aucun outil conditionnel",
    },
    expected: [],
  },
  {
    input: {
      messages: [utilisateur("Quel est le taux d'avancement de la Bretagne ?")],
      reason: "question factuelle : aucun outil conditionnel",
    },
    expected: [],
  },
  {
    input: {
      messages: [utilisateur("Donne-moi une vue d'ensemble de la situation")],
      reason:
        "RÉGRESSION : « vue » était un mot-clé dashboard et chargeait create_dashboard sur une synthèse",
    },
    expected: [],
  },
  {
    input: {
      messages: [
        utilisateur("Affiche un tableau de bord de la Bretagne"),
        assistantAvecDashboard,
        utilisateur("Ajoute les chantiers en retard"),
      ],
      reason:
        "HISTORIQUE : un dashboard déjà composé garde create_dashboard pour le retoucher",
    },
    expected: ["create_dashboard"],
  },
];

const conditionnels = (outils: string[]) =>
  outils.filter((outil): outil is OutilConditionnel =>
    (OUTILS_CONDITIONNELS as readonly string[]).includes(outil),
  );

const scorerOutil = (outil: OutilConditionnel) =>
  createScorer<Case, string[], OutilConditionnel[]>({
    name: outil,
    description: `${outil} est chargé si et seulement si il est attendu.`,
    scorer: ({ output, expected }) => {
      const charge = output.includes(outil);
      const attendu = expected?.includes(outil) ?? false;

      return {
        score: charge === attendu ? 1 : 0,
        metadata: `chargé : ${charge ? "oui" : "non"} — attendu : ${attendu ? "oui" : "non"}`,
      };
    },
  });

const derniereQuestion = (messages: PiloteUIMessage[]) =>
  messages
    .filter((message) => message.role === "user")
    .at(-1)
    ?.parts.flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join(" ") ?? "";

evalite<Case, string[], OutilConditionnel[]>("1 · Outils chargés", {
  data: () => CASES,
  task: (input) =>
    Promise.resolve(
      AssistantIA.outilsCharges({
        messages: input.messages,
        habilitations: HABILITATIONS,
        userId: "eval",
      }),
    ),
  scorers: OUTILS_CONDITIONNELS.map(scorerOutil),
  columns: ({ input, output, expected }) => [
    { label: "Message", value: derniereQuestion(input.messages) },
    { label: "Motif", value: input.reason },
    { label: "Chargés", value: conditionnels(output).join(", ") || "—" },
    { label: "Attendus", value: expected?.join(", ") || "—" },
  ],
});
