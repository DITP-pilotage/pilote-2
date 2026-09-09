import type { $Enums } from "@prisma/client";
import { extractCitedChantiers } from "@/components/_commons/ChatUI/extractCitedChantiers";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

const assistantMessage = (
  parts: PiloteUIMessage["parts"],
): PiloteUIMessage => ({
  id: "message-1",
  role: "assistant",
  parts,
});

const chantierResult = ({
  id,
  nom,
  maillesApplicables,
}: {
  id: string;
  nom: string;
  maillesApplicables: $Enums.Maille[];
}) => ({
  chantier: {
    id,
    nom,
    axe: "Axe",
    ppg: "PPG",
    ministeres: [],
    mailles_applicables: maillesApplicables,
  },
  meteo: null,
  tendance: null,
  ecart: null,
  taux_avancement: null,
  est_en_retard: false,
  est_en_difficulte: false,
  synthese: null,
  commentaires: { donnees: null, autresResultats: null },
});

describe("extractCitedChantiers", () => {
  test("retient les chantiers remontés par get_chantiers avec leurs mailles", () => {
    // Given
    const messages = [
      assistantMessage([
        {
          type: "tool-get_chantiers",
          toolCallId: "appel-1",
          state: "output-available",
          input: { territoire_code: "NAT-FR", jalon: 2025 },
          output: {
            resultats: [
              {
                territoire_code: "NAT-FR",
                territoire_nom: "France",
                jalon: 2025,
                chantiers: [
                  chantierResult({
                    id: "CH-050",
                    nom: "Sécurité routière",
                    maillesApplicables: ["NAT", "REG"],
                  }),
                ],
              },
            ],
            _output_instructions: "",
          },
        },
      ] as PiloteUIMessage["parts"]),
    ];

    // When
    const chantiers = extractCitedChantiers(messages);

    // Then
    expect([...chantiers.values()]).toStrictEqual([
      {
        id: "CH-050",
        nom: "Sécurité routière",
        maillesApplicables: ["NAT", "REG"],
      },
    ]);
  });

  test("retient les chantiers remontés par search_chantiers, sans mailles", () => {
    // Given
    const messages = [
      assistantMessage([
        {
          type: "tool-search_chantiers",
          toolCallId: "appel-1",
          state: "output-available",
          input: { query: "sécurité" },
          output: {
            chantiers: [{ id: "CH-050", nom: "Sécurité routière" }],
            reasoning: "",
            _output_instructions: "",
          },
        },
      ] as PiloteUIMessage["parts"]),
    ];

    // When
    const chantiers = extractCitedChantiers(messages);

    // Then
    expect([...chantiers.values()]).toStrictEqual([
      { id: "CH-050", nom: "Sécurité routière" },
    ]);
  });

  test("retient le chantier de rattachement des indicateurs trouvés", () => {
    // Given
    const messages = [
      assistantMessage([
        {
          type: "tool-search_indicateurs",
          toolCallId: "appel-1",
          state: "output-available",
          input: { query: "accidents" },
          output: {
            indicateurs: [
              {
                id: "IND-001",
                nom: "Accidents",
                chantier: { id: "CH-050", nom: "Sécurité routière" },
              },
            ],
            reasoning: "",
            _output_instructions: "",
          },
        },
      ] as PiloteUIMessage["parts"]),
    ];

    // When
    const chantiers = extractCitedChantiers(messages);

    // Then
    expect([...chantiers.values()]).toStrictEqual([
      { id: "CH-050", nom: "Sécurité routière" },
    ]);
  });

  test("cumule les chantiers sur plusieurs tours et conserve les mailles connues", () => {
    // Given
    const messages = [
      assistantMessage([
        {
          type: "tool-get_chantiers",
          toolCallId: "appel-1",
          state: "output-available",
          input: { territoire_code: "NAT-FR", jalon: 2025 },
          output: {
            resultats: [
              {
                territoire_code: "NAT-FR",
                territoire_nom: "France",
                jalon: 2025,
                chantiers: [
                  chantierResult({
                    id: "CH-050",
                    nom: "Sécurité routière",
                    maillesApplicables: ["NAT"],
                  }),
                ],
              },
            ],
            _output_instructions: "",
          },
        },
      ] as PiloteUIMessage["parts"]),
      assistantMessage([
        {
          type: "tool-search_chantiers",
          toolCallId: "appel-2",
          state: "output-available",
          input: { query: "handicap" },
          output: {
            chantiers: [
              { id: "CH-050", nom: "Sécurité routière" },
              { id: "CH-012", nom: "Handicap" },
            ],
            reasoning: "",
            _output_instructions: "",
          },
        },
      ] as PiloteUIMessage["parts"]),
    ];

    // When
    const chantiers = extractCitedChantiers(messages);

    // Then
    expect([...chantiers.values()]).toStrictEqual([
      { id: "CH-050", nom: "Sécurité routière", maillesApplicables: ["NAT"] },
      { id: "CH-012", nom: "Handicap" },
    ]);
  });

  test("ignore les parts dont la sortie n'est pas disponible", () => {
    // Given
    const messages = [
      assistantMessage([
        {
          type: "tool-search_chantiers",
          toolCallId: "appel-1",
          state: "input-available",
          input: { query: "sécurité" },
        },
      ] as PiloteUIMessage["parts"]),
    ];

    // When
    const chantiers = extractCitedChantiers(messages);

    // Then
    expect([...chantiers.values()]).toStrictEqual([]);
  });
});
