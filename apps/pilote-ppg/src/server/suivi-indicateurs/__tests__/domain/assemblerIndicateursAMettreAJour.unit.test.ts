import { $Enums } from "@prisma/client";
import { assemblerIndicateursAMettreAJour } from "@/server/suivi-indicateurs/domain/assemblerIndicateursAMettreAJour";

const identite = (indicateurId: string, chantierId = "CH-001") => ({
  indicateurId,
  nom: `Indicateur ${indicateurId}`,
  chantierId,
  chantierNom: `Chantier ${chantierId}`,
  periodicite: "Trimestrielle",
  delaiDisponibilite: 2,
  responsablesDonneesMails: ["donnees@exemple.gouv.fr"],
});

describe("assemblerIndicateursAMettreAJour", () => {
  it("agrège les groupes en retard d'un indicateur sur plusieurs mailles", () => {
    // Given
    const entree = {
      identites: [identite("IND-001")],
      applicables: [{ indicateurId: "IND-001", nbTerritoires: 120 }],
      enRetard: [
        {
          indicateurId: "IND-001",
          maille: $Enums.Maille.DEPT,
          nbTerritoires: 40,
          minProchaineDateMajJours: -86,
          minDateDerniereValeur: new Date("2026-03-31"),
          minDateMajAttendue: new Date("2026-06-30"),
        },
        {
          indicateurId: "IND-001",
          maille: $Enums.Maille.NAT,
          nbTerritoires: 1,
          minProchaineDateMajJours: -10,
          minDateDerniereValeur: new Date("2025-12-31"),
          minDateMajAttendue: new Date("2026-09-14"),
        },
      ],
      aParametrer: [],
    };

    // When
    const resultat = assemblerIndicateursAMettreAJour(entree);

    // Then
    expect(resultat).toEqual({
      nonAJour: [
        {
          chantierId: "CH-001",
          chantierNom: "Chantier CH-001",
          indicateurId: "IND-001",
          nom: "Indicateur IND-001",
          periodicite: "Trimestrielle",
          delaiDisponibilite: 2,
          mailles: [$Enums.Maille.NAT, $Enums.Maille.DEPT],
          nbTerritoiresEnRetard: 41,
          nbTerritoiresApplicables: 120,
          retardMaxJours: 86,
          dateDerniereValeurPlusAncienne: "2025-12-31T00:00:00.000Z",
          dateMajAttenduePlusAncienne: "2026-06-30T00:00:00.000Z",
          responsablesDonneesMails: ["donnees@exemple.gouv.fr"],
        },
      ],
      aParametrer: [],
    });
  });

  it("renvoie un retard null quand aucune date de mise à jour n'est connue", () => {
    // Given
    const entree = {
      identites: [identite("IND-002")],
      applicables: [{ indicateurId: "IND-002", nbTerritoires: 1 }],
      enRetard: [
        {
          indicateurId: "IND-002",
          maille: $Enums.Maille.NAT,
          nbTerritoires: 1,
          minProchaineDateMajJours: null,
          minDateDerniereValeur: null,
          minDateMajAttendue: null,
        },
      ],
      aParametrer: [],
    };

    // When
    const resultat = assemblerIndicateursAMettreAJour(entree);

    // Then
    expect(resultat.nonAJour).toEqual([
      expect.objectContaining({
        indicateurId: "IND-002",
        retardMaxJours: null,
        dateDerniereValeurPlusAncienne: null,
        dateMajAttenduePlusAncienne: null,
      }),
    ]);
  });

  it("fusionne les manques de paramétrage d'un indicateur sur plusieurs territoires", () => {
    // Given
    const entree = {
      identites: [identite("IND-003", "CH-002")],
      applicables: [{ indicateurId: "IND-003", nbTerritoires: 101 }],
      enRetard: [],
      aParametrer: [
        {
          indicateurId: "IND-003",
          valeurInitialeManquante: false,
          valeurCibleManquante: true,
        },
        {
          indicateurId: "IND-003",
          valeurInitialeManquante: true,
          valeurCibleManquante: false,
        },
        {
          indicateurId: "IND-003",
          valeurInitialeManquante: false,
          valeurCibleManquante: true,
        },
      ],
    };

    // When
    const resultat = assemblerIndicateursAMettreAJour(entree);

    // Then
    expect(resultat.aParametrer).toEqual([
      {
        chantierId: "CH-002",
        chantierNom: "Chantier CH-002",
        indicateurId: "IND-003",
        nom: "Indicateur IND-003",
        periodicite: "Trimestrielle",
        manques: ["VALEUR_INITIALE", "VALEUR_CIBLE"],
        nbTerritoires: 3,
        nbTerritoiresApplicables: 101,
      },
    ]);
  });

  it("ignore un indicateur sans identité et trie par chantier puis nom", () => {
    // Given
    const groupe = (indicateurId: string) => ({
      indicateurId,
      maille: $Enums.Maille.NAT,
      nbTerritoires: 1,
      minProchaineDateMajJours: -1,
      minDateDerniereValeur: null,
      minDateMajAttendue: null,
    });
    const entree = {
      identites: [identite("IND-B", "CH-002"), identite("IND-A", "CH-001")],
      applicables: [],
      enRetard: [groupe("IND-B"), groupe("IND-A"), groupe("IND-INCONNU")],
      aParametrer: [],
    };

    // When
    const resultat = assemblerIndicateursAMettreAJour(entree);

    // Then
    expect(
      resultat.nonAJour.map((indicateur) => indicateur.indicateurId),
    ).toEqual(["IND-A", "IND-B"]);
  });
});
