import { genererParametresEnvoieRapportProposition } from "@/server/chantiers/app/contrats/ParametresEnvoieEmailRapportProposition";
import { PropositionValeurAvancementRapport } from "@/server/chantiers/domain/ports/PropositionValeurAvancementRepository";
import { RapportDirecteurProjetChantierInformation } from "@/server/chantiers/domain/PropositionValeurAvancementChantierInformation";

describe("genererParametresEnvoieRapportProposition", () => {
  describe("Propositions de valeur d'avancement", () => {
    it("doit générer les paramètres avec une proposition sur un territoire", () => {
      // Given
      const listeChantierIds = ["CH-001"];
      const mapChantiersInformation = new Map<
        string,
        RapportDirecteurProjetChantierInformation
      >([
        [
          "CH-001",
          {
            id: "CH-001",
            nom: "Chantier 1",
            statut: "PUBLIE",
            conseillerMail: "conseiller1@exemple.com",
          },
        ],
      ]);

      const propositionsParChantier = new Map<
        string,
        Map<string, PropositionValeurAvancementRapport[]>
      >([
        [
          "CH-001",
          new Map([
            [
              "IND-001",
              [
                {
                  indicateurId: "IND-001",
                  territoireCode: "DEPT-01",
                  dateValeurAvancement: "2025-05-15",
                  valeurAvancementProposee: "75",
                  valeurAvancementReference: "70",
                  nomIndicateur: "Indicateur 1",
                  uniteIndicateur: "kg",
                  nomTerritoire: "Ain",
                },
              ],
            ],
          ]),
        ],
      ]);

      // When
      const result = genererParametresEnvoieRapportProposition(
        listeChantierIds,
        mapChantiersInformation,
        propositionsParChantier,
        new Map(),
        new Map(),
      );

      // Then
      expect(result.chantiers).toHaveLength(1);
      expect(result.chantiers[0]).toEqual({
        nom_chantier: "Chantier 1",
        id_chantier: "CH-001",
        nombre_propositions:
          "1 proposition territoriale de valeur d'avancement",
        conseiller_email: "conseiller1@exemple.com",
        afficherSectionPropositions: true,
        nombreIndicateursNonMisAJour: "aucun indicateur à mettre à jour",
        indicateursPropositions: [
          {
            id: "IND-001",
            nom: "Indicateur 1",
            unite: "(en kg)",
            territoires: [
              {
                code: "DEPT-01",
                nom: "Ain",
                valeur_avancement: "70",
                date_valeur: "2025-05-15",
                proposition: "75",
              },
            ],
          },
        ],
        afficherSectionMajIndicateur: false,
        indicateursNonMisAJour: [],
        afficherSectionParametrage: false,
        indicateursAParametrer: [],
        nombreIndicateursAParametrer:
          "aucun indicateur dont le taux d'avancement ne peut être calculé",
      });
      expect(result.conseillerEmail).toEqual("conseiller1@exemple.com");
    });

    it("doit générer les paramètres avec plusieurs propositions", () => {
      // Given
      const listeChantierIds = ["CH-001"];
      const mapChantiersInformation = new Map<
        string,
        RapportDirecteurProjetChantierInformation
      >([
        [
          "CH-001",
          {
            id: "CH-001",
            nom: "Chantier 1",
            statut: "PUBLIE",
            conseillerMail: "conseiller1@exemple.com",
          },
        ],
      ]);

      const propositionsParChantier = new Map<
        string,
        Map<string, PropositionValeurAvancementRapport[]>
      >([
        [
          "CH-001",
          new Map([
            [
              "IND-001",
              [
                {
                  indicateurId: "IND-001",
                  territoireCode: "DEPT-01",
                  dateValeurAvancement: "2025-05-15",
                  valeurAvancementProposee: "75",
                  valeurAvancementReference: "70",
                  nomIndicateur: "Indicateur 1",
                  uniteIndicateur: "pourcentage",
                  nomTerritoire: "Ain",
                },
                {
                  indicateurId: "IND-001",
                  territoireCode: "DEPT-02",
                  dateValeurAvancement: "2025-05-15",
                  valeurAvancementProposee: "60",
                  valeurAvancementReference: "55",
                  nomIndicateur: "Indicateur 1",
                  uniteIndicateur: "pourcentage",
                  nomTerritoire: "Aisne",
                },
              ],
            ],
            [
              "IND-002",
              [
                {
                  indicateurId: "IND-002",
                  territoireCode: "DEPT-01",
                  dateValeurAvancement: "2025-05-15",
                  valeurAvancementProposee: "150",
                  valeurAvancementReference: "145",
                  nomIndicateur: "Indicateur 2",
                  uniteIndicateur: "",
                  nomTerritoire: "Ain",
                },
                {
                  indicateurId: "IND-002",
                  territoireCode: "DEPT-02",
                  dateValeurAvancement: "2025-05-15",
                  valeurAvancementProposee: "200",
                  valeurAvancementReference: "195",
                  nomIndicateur: "Indicateur 2",
                  uniteIndicateur: "",
                  nomTerritoire: "Aisne",
                },
              ],
            ],
          ]),
        ],
      ]);

      // When
      const result = genererParametresEnvoieRapportProposition(
        listeChantierIds,
        mapChantiersInformation,
        propositionsParChantier,
        new Map(),
        new Map(),
      );

      // Then
      expect(result.chantiers).toHaveLength(1);
      expect(result.chantiers[0].afficherSectionPropositions).toEqual(true);
      expect(result.chantiers[0].indicateursPropositions).toHaveLength(2);
      expect(result.chantiers[0].nombre_propositions).toEqual(
        "4 propositions territoriales de valeur d'avancement",
      );
      expect(
        result.chantiers[0].indicateursPropositions[0].territoires,
      ).toEqual([
        {
          code: "DEPT-01",
          nom: "Ain",
          valeur_avancement: "70 %",
          date_valeur: "2025-05-15",
          proposition: "75 %",
        },
        {
          code: "DEPT-02",
          nom: "Aisne",
          valeur_avancement: "55 %",
          date_valeur: "2025-05-15",
          proposition: "60 %",
        },
      ]);
    });
  });

  describe("Indicateurs non mis à jour", () => {
    it("doit afficher la section MAJ avec des indicateurs non à jour", () => {
      // Given
      const listeChantierIds = ["CH-001"];
      const mapChantiersInformation = new Map<
        string,
        RapportDirecteurProjetChantierInformation
      >([
        [
          "CH-001",
          {
            id: "CH-001",
            nom: "Chantier 1",
            statut: "PUBLIE",
            conseillerMail: "conseiller1@exemple.com",
          },
        ],
      ]);

      const propositionsParChantier = new Map<
        string,
        Map<string, PropositionValeurAvancementRapport[]>
      >([
        [
          "CH-001",
          new Map([
            [
              "IND-003",
              [
                {
                  indicateurId: "IND-003",
                  territoireCode: "DEPT-01",
                  dateValeurAvancement: "2025-05-15",
                  valeurAvancementProposee: "75",
                  valeurAvancementReference: "70",
                  nomIndicateur: "Indicateur 3",
                  uniteIndicateur: "kg",
                  nomTerritoire: "Ain",
                },
              ],
            ],
          ]),
        ],
      ]);

      const indicateursNonAJourParChantier = new Map<
        string,
        { id: string; nom: string; mailles: string[] }[]
      >([
        [
          "CH-001",
          [
            { id: "IND-001", nom: "Indicateur 1", mailles: ["NAT"] },
            { id: "IND-002", nom: "Indicateur 2", mailles: ["NAT", "REG"] },
          ],
        ],
      ]);

      // When
      const result = genererParametresEnvoieRapportProposition(
        listeChantierIds,
        mapChantiersInformation,
        propositionsParChantier,
        indicateursNonAJourParChantier,
        new Map(),
      );

      // Then
      expect(result.chantiers).toHaveLength(1);
      expect(result.chantiers[0].afficherSectionMajIndicateur).toEqual(true);
      expect(result.chantiers[0].indicateursNonMisAJour).toEqual([
        { id: "IND-001", nom: "Indicateur 1", mailles: ["NAT"] },
        { id: "IND-002", nom: "Indicateur 2", mailles: ["NAT", "REG"] },
      ]);
    });

    it("ne doit pas afficher la section MAJ sans indicateurs non à jour", () => {
      // Given
      const listeChantierIds = ["CH-001"];
      const mapChantiersInformation = new Map<
        string,
        RapportDirecteurProjetChantierInformation
      >([
        [
          "CH-001",
          {
            id: "CH-001",
            nom: "Chantier 1",
            statut: "PUBLIE",
            conseillerMail: "conseiller1@exemple.com",
          },
        ],
      ]);

      const propositionsParChantier = new Map<
        string,
        Map<string, PropositionValeurAvancementRapport[]>
      >([
        [
          "CH-001",
          new Map([
            [
              "IND-001",
              [
                {
                  indicateurId: "IND-001",
                  territoireCode: "DEPT-01",
                  dateValeurAvancement: "2025-05-15",
                  valeurAvancementProposee: "75",
                  valeurAvancementReference: "70",
                  nomIndicateur: "Indicateur 1",
                  uniteIndicateur: "kg",
                  nomTerritoire: "Ain",
                },
              ],
            ],
          ]),
        ],
      ]);

      const indicateursNonAJourParChantier = new Map<
        string,
        { id: string; nom: string; mailles: string[] }[]
      >();

      // When
      const result = genererParametresEnvoieRapportProposition(
        listeChantierIds,
        mapChantiersInformation,
        propositionsParChantier,
        indicateursNonAJourParChantier,
        new Map(),
      );

      // Then
      expect(result.chantiers).toHaveLength(1);
      expect(result.chantiers[0].afficherSectionMajIndicateur).toEqual(false);
      expect(result.chantiers[0].indicateursNonMisAJour).toEqual([]);
    });
  });

  describe("Combinaisons de sections", () => {
    it("doit afficher les deux sections quand il y a des propositions ET des indicateurs non à jour", () => {
      // Given
      const listeChantierIds = ["CH-001"];
      const mapChantiersInformation = new Map<
        string,
        RapportDirecteurProjetChantierInformation
      >([
        [
          "CH-001",
          {
            id: "CH-001",
            nom: "Chantier 1",
            statut: "PUBLIE",
            conseillerMail: "conseiller1@exemple.com",
          },
        ],
      ]);

      const propositionsParChantier = new Map<
        string,
        Map<string, PropositionValeurAvancementRapport[]>
      >([
        [
          "CH-001",
          new Map([
            [
              "IND-001",
              [
                {
                  indicateurId: "IND-001",
                  territoireCode: "DEPT-01",
                  dateValeurAvancement: "2025-05-15",
                  valeurAvancementProposee: "75",
                  valeurAvancementReference: "70",
                  nomIndicateur: "Indicateur 1",
                  uniteIndicateur: "kg",
                  nomTerritoire: "Ain",
                },
              ],
            ],
          ]),
        ],
      ]);

      const indicateursNonAJourParChantier = new Map<
        string,
        { id: string; nom: string; mailles: string[] }[]
      >([
        [
          "CH-001",
          [
            { id: "IND-002", nom: "Indicateur 2", mailles: ["NAT"] },
            { id: "IND-003", nom: "Indicateur 3", mailles: ["REG"] },
          ],
        ],
      ]);

      // When
      const result = genererParametresEnvoieRapportProposition(
        listeChantierIds,
        mapChantiersInformation,
        propositionsParChantier,
        indicateursNonAJourParChantier,
        new Map(),
      );

      // Then
      expect(result.chantiers).toHaveLength(1);
      expect(result.chantiers[0].afficherSectionPropositions).toEqual(true);
      expect(result.chantiers[0].afficherSectionMajIndicateur).toEqual(true);
    });

    it("doit afficher seulement la section propositions quand il n'y a pas d'indicateurs non à jour", () => {
      // Given
      const listeChantierIds = ["CH-001"];
      const mapChantiersInformation = new Map<
        string,
        RapportDirecteurProjetChantierInformation
      >([
        [
          "CH-001",
          {
            id: "CH-001",
            nom: "Chantier 1",
            statut: "PUBLIE",
            conseillerMail: "conseiller1@exemple.com",
          },
        ],
      ]);

      const propositionsParChantier = new Map<
        string,
        Map<string, PropositionValeurAvancementRapport[]>
      >([
        [
          "CH-001",
          new Map([
            [
              "IND-001",
              [
                {
                  indicateurId: "IND-001",
                  territoireCode: "DEPT-01",
                  dateValeurAvancement: "2025-05-15",
                  valeurAvancementProposee: "75",
                  valeurAvancementReference: "70",
                  nomIndicateur: "Indicateur 1",
                  uniteIndicateur: "kg",
                  nomTerritoire: "Ain",
                },
              ],
            ],
          ]),
        ],
      ]);

      // When
      const result = genererParametresEnvoieRapportProposition(
        listeChantierIds,
        mapChantiersInformation,
        propositionsParChantier,
        new Map(),
        new Map(),
      );

      // Then
      expect(result.chantiers).toHaveLength(1);
      expect(result.chantiers[0].afficherSectionPropositions).toEqual(true);
      expect(result.chantiers[0].afficherSectionMajIndicateur).toEqual(false);
    });

    it("doit afficher seulement la section MAJ quand il n'y a pas de propositions", () => {
      // Given
      const listeChantierIds = ["CH-001"];
      const mapChantiersInformation = new Map<
        string,
        RapportDirecteurProjetChantierInformation
      >([
        [
          "CH-001",
          {
            id: "CH-001",
            nom: "Chantier 1",
            statut: "PUBLIE",
            conseillerMail: "conseiller1@exemple.com",
          },
        ],
      ]);

      const propositionsParChantier = new Map<
        string,
        Map<string, PropositionValeurAvancementRapport[]>
      >();

      const indicateursNonAJourParChantier = new Map<
        string,
        { id: string; nom: string; mailles: string[] }[]
      >([
        [
          "CH-001",
          [
            { id: "IND-001", nom: "Indicateur 1", mailles: ["NAT"] },
            { id: "IND-002", nom: "Indicateur 2", mailles: ["DEPT"] },
          ],
        ],
      ]);

      // When
      const result = genererParametresEnvoieRapportProposition(
        listeChantierIds,
        mapChantiersInformation,
        propositionsParChantier,
        indicateursNonAJourParChantier,
        new Map(),
      );

      // Then
      expect(result.chantiers).toHaveLength(1);
      expect(result.chantiers[0].afficherSectionPropositions).toEqual(false);
      expect(result.chantiers[0].indicateursPropositions).toEqual([]);
      expect(result.chantiers[0].afficherSectionMajIndicateur).toEqual(true);
    });

    it("ne doit pas retourner un chantier sans propositions, ni indicateurs non à jour, ni indicateurs à paramétrer", () => {
      // Given
      const listeChantierIds = ["CH-001", "CH-002"];
      const mapChantiersInformation = new Map<
        string,
        RapportDirecteurProjetChantierInformation
      >([
        [
          "CH-001",
          {
            id: "CH-001",
            nom: "Chantier 1",
            statut: "PUBLIE",
            conseillerMail: "conseiller1@exemple.com",
          },
        ],
        [
          "CH-002",
          {
            id: "CH-002",
            nom: "Chantier 2",
            statut: "PUBLIE",
            conseillerMail: "conseiller2@exemple.com",
          },
        ],
      ]);

      const propositionsParChantier = new Map<
        string,
        Map<string, PropositionValeurAvancementRapport[]>
      >([
        [
          "CH-001",
          new Map([
            [
              "IND-001",
              [
                {
                  indicateurId: "IND-001",
                  territoireCode: "DEPT-01",
                  dateValeurAvancement: "2025-05-15",
                  valeurAvancementProposee: "75",
                  valeurAvancementReference: "70",
                  nomIndicateur: "Indicateur 1",
                  uniteIndicateur: "kg",
                  nomTerritoire: "Ain",
                },
              ],
            ],
          ]),
        ],
      ]);

      const indicateursNonAJourParChantier = new Map<
        string,
        { id: string; nom: string; mailles: string[] }[]
      >();

      // When
      const result = genererParametresEnvoieRapportProposition(
        listeChantierIds,
        mapChantiersInformation,
        propositionsParChantier,
        indicateursNonAJourParChantier,
        new Map(),
      );

      // Then
      expect(result.chantiers).toHaveLength(1);
      expect(result.chantiers[0].id_chantier).toEqual("CH-001");
      expect(
        result.chantiers.find((c) => c.id_chantier === "CH-002"),
      ).toBeUndefined();
    });

    it("doit retourner un chantier ayant uniquement des indicateurs à paramétrer", () => {
      // Given
      const listeChantierIds = ["CH-001"];
      const mapChantiersInformation = new Map<
        string,
        RapportDirecteurProjetChantierInformation
      >([
        [
          "CH-001",
          {
            id: "CH-001",
            nom: "Chantier 1",
            statut: "PUBLIE",
            conseillerMail: "conseiller1@exemple.com",
          },
        ],
      ]);

      const indicateursAParametrerParChantier = new Map<
        string,
        { id: string; nom: string }[]
      >([["CH-001", [{ id: "IND-001", nom: "Indicateur 1" }]]]);

      // When
      const result = genererParametresEnvoieRapportProposition(
        listeChantierIds,
        mapChantiersInformation,
        new Map(),
        new Map(),
        indicateursAParametrerParChantier,
      );

      // Then
      expect(result.chantiers).toHaveLength(1);
      expect(result.chantiers[0].afficherSectionPropositions).toEqual(false);
      expect(result.chantiers[0].afficherSectionMajIndicateur).toEqual(false);
      expect(result.chantiers[0].afficherSectionParametrage).toEqual(true);
      expect(result.chantiers[0].indicateursAParametrer).toEqual([
        { id: "IND-001", nom: "Indicateur 1" },
      ]);
    });
  });

  describe("Indicateurs à paramétrer", () => {
    it("doit afficher la section paramétrage quand il existe des indicateurs à paramétrer", () => {
      // Given
      const listeChantierIds = ["CH-001"];
      const mapChantiersInformation = new Map<
        string,
        RapportDirecteurProjetChantierInformation
      >([
        [
          "CH-001",
          {
            id: "CH-001",
            nom: "Chantier 1",
            statut: "PUBLIE",
            conseillerMail: "conseiller1@exemple.com",
          },
        ],
      ]);

      const indicateursAParametrerParChantier = new Map<
        string,
        { id: string; nom: string }[]
      >([
        [
          "CH-001",
          [
            { id: "IND-001", nom: "Indicateur 1" },
            { id: "IND-002", nom: "Indicateur 2" },
          ],
        ],
      ]);

      // When
      const result = genererParametresEnvoieRapportProposition(
        listeChantierIds,
        mapChantiersInformation,
        new Map(),
        new Map(),
        indicateursAParametrerParChantier,
      );

      // Then
      expect(result.chantiers).toHaveLength(1);
      expect(result.chantiers[0].afficherSectionParametrage).toEqual(true);
      expect(result.chantiers[0].indicateursAParametrer).toEqual([
        { id: "IND-001", nom: "Indicateur 1" },
        { id: "IND-002", nom: "Indicateur 2" },
      ]);
      expect(result.chantiers[0].nombreIndicateursAParametrer).toEqual(
        "2 indicateurs dont le taux d'avancement ne peut être calculé",
      );
    });

    it("ne doit pas afficher la section paramétrage quand il n'existe pas d'indicateurs à paramétrer", () => {
      // Given
      const listeChantierIds = ["CH-001"];
      const mapChantiersInformation = new Map<
        string,
        RapportDirecteurProjetChantierInformation
      >([
        [
          "CH-001",
          {
            id: "CH-001",
            nom: "Chantier 1",
            statut: "PUBLIE",
            conseillerMail: "conseiller1@exemple.com",
          },
        ],
      ]);

      const propositionsParChantier = new Map<
        string,
        Map<string, PropositionValeurAvancementRapport[]>
      >([
        [
          "CH-001",
          new Map([
            [
              "IND-001",
              [
                {
                  indicateurId: "IND-001",
                  territoireCode: "DEPT-01",
                  dateValeurAvancement: "2025-05-15",
                  valeurAvancementProposee: "75",
                  valeurAvancementReference: "70",
                  nomIndicateur: "Indicateur 1",
                  uniteIndicateur: "kg",
                  nomTerritoire: "Ain",
                },
              ],
            ],
          ]),
        ],
      ]);

      // When
      const result = genererParametresEnvoieRapportProposition(
        listeChantierIds,
        mapChantiersInformation,
        propositionsParChantier,
        new Map(),
        new Map(),
      );

      // Then
      expect(result.chantiers).toHaveLength(1);
      expect(result.chantiers[0].afficherSectionParametrage).toEqual(false);
      expect(result.chantiers[0].indicateursAParametrer).toEqual([]);
      expect(result.chantiers[0].nombreIndicateursAParametrer).toEqual(
        "aucun indicateur dont le taux d'avancement ne peut être calculé",
      );
    });
  });
});
