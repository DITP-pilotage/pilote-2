import {
  detecterCapacities,
  extraireTexteDernierMessageUtilisateur,
  dashboardDejaCompose,
} from "@/server/albert/detecteurIntention";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

describe("detecterCapacities", () => {
  it("détecte une demande de synthèse explicite", () => {
    // when
    const result = detecterCapacities("Fais-moi la synthèse de la Bretagne");

    // then
    expect(result).toEqual({
      synthese: true,
      dashboard: false,
      exportRapport: false,
    });
  });

  it("détecte une synthèse via 'état des lieux'", () => {
    // when
    const result = detecterCapacities(
      "Donne-moi un état des lieux de l'Île-de-France",
    );

    // then
    expect(result).toEqual({
      synthese: true,
      dashboard: false,
      exportRapport: false,
    });
  });

  it("détecte une synthèse via 'résume'", () => {
    // when
    const result = detecterCapacities("Résume la situation pour 2025");

    // then
    expect(result).toEqual({
      synthese: true,
      dashboard: false,
      exportRapport: false,
    });
  });

  it("détecte une demande de dashboard via 'cockpit'", () => {
    // when
    const result = detecterCapacities(
      "Construis-moi un cockpit pour la Bretagne",
    );

    // then
    expect(result).toEqual({
      synthese: false,
      dashboard: true,
      exportRapport: false,
    });
  });

  it("détecte une demande de dashboard via 'tableau de bord'", () => {
    // when
    const result = detecterCapacities(
      "Je veux un tableau de bord avec les chantiers en retard",
    );

    // then
    expect(result).toEqual({
      synthese: false,
      dashboard: true,
      exportRapport: false,
    });
  });

  it("détecte une demande de dashboard via 'cartographie'", () => {
    // when
    const result = detecterCapacities(
      "Affiche la cartographie des taux d'avancement",
    );

    // then
    expect(result.dashboard).toBe(true);
  });

  it("détecte un export via 'exporte'", () => {
    // when
    const result = detecterCapacities("Exporte ce rapport en PDF");

    // then
    expect(result).toEqual({
      synthese: false,
      dashboard: false,
      exportRapport: true,
    });
  });

  it("détecte un export via 'télécharger'", () => {
    // when
    const result = detecterCapacities("Je veux télécharger le rapport");

    // then
    expect(result.exportRapport).toBe(true);
  });

  it("active toutes les capacités sur une demande mixte", () => {
    // when
    const result = detecterCapacities(
      "Fais une synthèse puis un dashboard et exporte en PDF",
    );

    // then
    expect(result).toEqual({
      synthese: true,
      dashboard: true,
      exportRapport: true,
    });
  });

  it("ne déclenche aucune capacité sur une question simple", () => {
    // when
    const result = detecterCapacities(
      "Quel est le taux d'avancement de l'Île-de-France ?",
    );

    // then
    expect(result).toEqual({
      synthese: false,
      dashboard: false,
      exportRapport: false,
    });
  });

  it("est insensible à la casse", () => {
    // when
    const result = detecterCapacities("FAIS-MOI UNE SYNTHÈSE");

    // then
    expect(result.synthese).toBe(true);
  });

  it("détecte 'synthese' sans accent", () => {
    // when
    const result = detecterCapacities("fais une synthese rapide");

    // then
    expect(result.synthese).toBe(true);
  });
});

describe("extraireTexteDernierMessageUtilisateur", () => {
  it("retourne une chaîne vide quand il n'y a pas de message", () => {
    // when
    const result = extraireTexteDernierMessageUtilisateur([]);

    // then
    expect(result).toEqual("");
  });

  it("extrait le texte du dernier message utilisateur", () => {
    // given
    const messages: PiloteUIMessage[] = [
      {
        id: "1",
        role: "user",
        parts: [{ type: "text", text: "Premier message" }],
      },
      {
        id: "2",
        role: "assistant",
        parts: [{ type: "text", text: "Réponse" }],
      },
      {
        id: "3",
        role: "user",
        parts: [{ type: "text", text: "Deuxième message" }],
      },
    ];

    // when
    const result = extraireTexteDernierMessageUtilisateur(messages);

    // then
    expect(result).toEqual("Deuxième message");
  });

  it("concatène plusieurs parts text d'un même message", () => {
    // given
    const messages: PiloteUIMessage[] = [
      {
        id: "1",
        role: "user",
        parts: [
          { type: "text", text: "Première partie" },
          { type: "text", text: "deuxième partie" },
        ],
      },
    ];

    // when
    const result = extraireTexteDernierMessageUtilisateur(messages);

    // then
    expect(result).toEqual("Première partie deuxième partie");
  });
});

describe("dashboardDejaCompose", () => {
  it("retourne false quand aucun dashboard n'a été composé", () => {
    // given
    const messages: PiloteUIMessage[] = [
      {
        id: "1",
        role: "user",
        parts: [{ type: "text", text: "Bonjour" }],
      },
      {
        id: "2",
        role: "assistant",
        parts: [{ type: "text", text: "Bonjour, comment puis-je aider ?" }],
      },
    ];

    // when
    const result = dashboardDejaCompose(messages);

    // then
    expect(result).toBe(false);
  });

  it("retourne true quand un message assistant contient un tool-create_dashboard", () => {
    // given
    const messages: PiloteUIMessage[] = [
      {
        id: "1",
        role: "user",
        parts: [{ type: "text", text: "Construis un cockpit" }],
      },
      {
        id: "2",
        role: "assistant",
        parts: [
          { type: "text", text: "Voici le dashboard demandé." },
          {
            type: "tool-create_dashboard",
            toolCallId: "call-1",
            state: "output-available",
            input: {
              task: "Cockpit Bretagne",
              territoire_codes: ["REG-53"],
              jalons: [2026],
            },
            output: {
              titre: "Test",
              containers: [],
              _output_instructions: "",
            },
          },
        ],
      },
    ];

    // when
    const result = dashboardDejaCompose(messages);

    // then
    expect(result).toBe(true);
  });
});
