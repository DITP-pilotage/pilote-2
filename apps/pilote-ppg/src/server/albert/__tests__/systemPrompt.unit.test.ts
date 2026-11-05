import { buildChatSystemPrompt } from "@/server/albert/systemPrompt";

describe("buildChatSystemPrompt", () => {
  it("commence par la directive de raisonnement", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt.startsWith("Reasoning: high\n")).toBe(true);
  });

  it("ne parle pas de météo (D1)", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).not.toMatch(/m[ée]t[ée]o|SOLEIL|COUVERT|NUAGE|ORAGE/i);
  });

  it("ne renvoie pas à des consignes dans les résultats d'outils", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).not.toContain("_output_instructions");
  });

  it("garde la règle du périmètre, que le seul paramètre ne suffisait pas à faire respecter", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).toContain(
      "un seul appel par jalon et par outil, avec le `perimetre` qui les désigne, jamais un appel par territoire",
    );
    expect(prompt).toContain("n'énumère jamais ses territoires");
    expect(prompt).toContain(
      "Un territoire seul, région comprise (« en Bretagne »), est une sélection de son seul code",
    );
  });

  it("impose la recherche pour un territoire désigné par son nom", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).toContain("passe toujours par search_territoires");
  });

  it("oriente une synthèse ou une comparaison générique vers l'encart", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).toContain("rediger_synthese_territoire");
    expect(prompt).toContain("rediger_comparaison_territoires");
  });

  it("ne décrit plus la composition d'une synthèse, l'outil s'en charge", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).not.toContain("Une synthèse de territoire couvre");
  });

  it("garde une comparaison qui nomme son critère hors de l'encart", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).toContain("« Compare les taux d'avancement");
  });

  it("fait d'un rapport un encart, que l'utilisateur télécharge", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).toContain(
      "« rapport », « télécharger », « exporter » une synthèse ou une comparaison : l'encart",
    );
    expect(prompt).toContain("ne décris ni ses boutons ni son export");
    expect(prompt).not.toContain("export_rapport");
  });

  it("n'emprunte qu'un chemin par demande : l'encart ou les outils de données", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).toContain(
      "soit l'encart, soit les outils de données, jamais les deux",
    );
  });

  it("garde un rapport qui liste son contenu sur l'encart, indicateurs compris", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).toContain(
      "même quand la demande en liste le contenu (taux, chantiers en retard, en difficulté, indicateurs)",
    );
    expect(prompt).toContain("avec_indicateurs");
  });

  it("traduit un numéro de département en code, sans recherche", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).toContain(
      "se traduit directement en code (DEPT-84, REG-84), sans recherche",
    );
    expect(prompt).toContain(
      "« Le taux d'avancement dans le 35 » → get_taux_avancement_territoire sur DEPT-35",
    );
  });

  it("cherche un chantier avant de refuser une question sur une politique ou un thème", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).toContain(
      "Avant de refuser, vérifie si la demande peut désigner un chantier",
    );
  });

  it("garde la position face à la médiane hors de l'encart", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).toContain("« se situe par rapport à la médiane »");
  });

  it("fait de la recherche d'un territoire nommé une règle", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).toContain(
      "8. Un territoire désigné par son nom passe toujours par search_territoires",
    );
  });

  it("reconnaît un acronyme de région comme un territoire, pas comme un chantier", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).toContain(
      "un acronyme de région (« PACA », « AURA », « IDF », « BFC », « HDF »…) : un territoire",
    );
  });

  it("donne le jalon du contexte d'accueil", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: { jalon: 2026 },
    });

    // Then
    expect(prompt).toContain("- Jalon courant : 2026");
  });

  it("prend 2025 comme jalon sans contexte", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).toContain("- Jalon courant : 2025");
    expect(prompt).not.toContain("- Territoire courant :");
  });

  it("donne le territoire courant du contexte d'accueil, par son nom et son code", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: {
        jalon: 2026,
        territoireCode: "DEPT-01",
        territoireNom: "01 - Ain",
      },
    });

    // Then
    expect(prompt).toContain(
      "- Territoire courant : 01 - Ain (DEPT-01)\n- Jalon courant : 2026",
    );
  });

  it("donne le territoire courant par son seul code quand le contexte ne porte pas son nom", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: { jalon: 2026, territoireCode: "DEPT-01" },
    });

    // Then
    expect(prompt).toContain("- Territoire courant : DEPT-01\n");
  });

  it("donne le chantier courant du contexte de la page chantier, par son nom et son identifiant", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: {
        jalon: 2026,
        territoireCode: "DEPT-01",
        territoireNom: "01 - Ain",
        chantierId: "CH-173",
        chantierNom: "Renforcer notre souveraineté industrielle",
      },
    });

    // Then
    expect(prompt).toContain(
      "- Chantier courant : Renforcer notre souveraineté industrielle (CH-173)\n- Territoire courant : 01 - Ain (DEPT-01)\n",
    );
  });

  it("donne le chantier courant par son seul identifiant quand le contexte ne porte pas son nom", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: {
        jalon: 2026,
        territoireCode: "DEPT-01",
        chantierId: "CH-173",
      },
    });

    // Then
    expect(prompt).toContain("- Chantier courant : CH-173\n");
  });

  it("ne donne pas de chantier courant hors de la page chantier", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: { jalon: 2026, territoireCode: "DEPT-01" },
    });

    // Then
    expect(prompt).not.toContain("- Chantier courant :");
  });

  it("applique le chantier courant à une demande sur un chantier non désigné, pas à une demande sur plusieurs chantiers", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).toContain(
      "porte sur le chantier courant du contexte de la session, quand il y en a un. Une demande sur plusieurs chantiers (« les chantiers en retard ») n'est pas restreinte au chantier courant.",
    );
  });

  it("applique le territoire courant à une demande sans territoire, jamais NAT-FR par défaut", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).toContain(
      "porte sur le territoire courant du contexte de la session : jamais sur NAT-FR par défaut",
    );
  });

  it("termine par les territoires à accès complet", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: ["REG-53", "DEPT-35"],
      agentContext: null,
    });

    // Then
    expect(
      prompt.endsWith("- Territoires à accès complet : REG-53, DEPT-35"),
    ).toBe(true);
  });
});
