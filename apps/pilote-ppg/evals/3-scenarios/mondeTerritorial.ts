import type { TerritoireRef } from "../seeds";
import {
  seedJalon,
  seedTerritoire,
  type SeededChantier,
} from "./seedTerritoire";
import { JALON_COURANT, TERRITOIRES } from "./territoires";

/**
 * Le monde territorial des scénarios de niveau 3, semé à l'identique pour
 * chaque tour : les médianes sont les mêmes d'un cas à l'autre, et un tableau
 * de résultats se lit sans se demander ce que chaque cas a semé.
 *
 * Les valeurs placent la Bretagne (taux moyen 51) sous la médiane des régions
 * semées (Auvergne-Rhône-Alpes 65, Pays de la Loire 70 : médiane 65, écart
 * -14), pour que « en retard face à la médiane » ait quelque chose à dire.
 *
 * Chaque territoire breton porte un chantier à l'heure avec commentaire, un
 * en retard avec commentaire, un en difficulté SANS commentaire : c'est ce
 * qui force la règle « Pas de commentaire disponible ».
 *
 * Les commentaires typés sont territoriaux : « actions à venir » et « actions
 * à valoriser » sont des types nationaux, invisibles sur une région. En
 * Bretagne, CH-006 porte deux commentaires qui disent la même chose.
 */

const aLHeure = ({
  chantierId,
  taux,
  commentaire,
}: {
  chantierId: string;
  taux: number;
  commentaire: string;
}): SeededChantier => ({
  chantierId,
  taux,
  ecart: 2,
  meteo: "COUVERT",
  commentaireSynthese: commentaire,
  indicateur: {
    valeurInitiale: 20,
    valeurActuelle: taux,
    valeurCible: 100,
    tauxAvancement: taux,
  },
});

const BRETAGNE_2025: SeededChantier[] = [
  {
    ...aLHeure({
      chantierId: "CH-001",
      taux: 62,
      commentaire:
        "Les référents VSS sont désignés dans tous les établissements du second degré ; la formation des enquêteurs spécialisés se poursuit jusqu'en décembre.",
    }),
    commentaires: [
      {
        type: "autres_resultats_obtenus",
        contenu:
          "<p>Ouverture de deux maisons des femmes à Rennes et Brest. Prochaine étape : une troisième structure à Lorient au premier trimestre.</p>",
      },
    ],
  },
  {
    chantierId: "CH-005",
    taux: 34,
    ecart: -15,
    meteo: "NUAGE",
    commentaireSynthese:
      "Deux postes d'urgentistes restent vacants à Brest et Quimper. Le délai médian de passage remonte à 4 h 10 au premier semestre, malgré la régulation téléphonique mise en place en mars.",
    indicateur: {
      valeurInitiale: 280,
      valeurActuelle: 250,
      valeurCible: 180,
      tauxAvancement: 30,
    },
    commentaires: [
      {
        type: "commentaires_sur_les_donnees",
        contenu:
          "<p>La hausse du délai au premier semestre s'explique par la fermeture estivale de deux lignes de SMUR. La donnée de juin est provisoire.</p>",
      },
      {
        type: "autres_resultats_obtenus",
        contenu:
          "<p>Mise en place d'un numéro de régulation départemental unique en mars. Action engagée : recrutement de deux urgentistes par contrat de territoire, signature prévue en novembre.</p>",
      },
    ],
  },
  {
    chantierId: "CH-006",
    taux: 58,
    ecart: 2,
    meteo: "ORAGE",
    commentaireSynthese: null,
    indicateur: {
      valeurInitiale: 45,
      valeurActuelle: 52,
      valeurCible: 75,
      tauxAvancement: 23,
    },
    commentaires: [
      {
        type: "autres_resultats_obtenus",
        contenu:
          "<p>La campagne de vaccination antigrippale a démarré avec trois semaines de retard faute de doses. Action identifiée : ouverture de centres éphémères dans les pharmacies rurales.</p>",
      },
      // Le même constat, ressaisi par un autre contributeur : la synthèse des
      // commentaires doit le dire une fois (« Doublons compactés »).
      {
        type: "commentaires_sur_les_donnees",
        contenu:
          "<p>Faute de doses livrées, la vaccination antigrippale a commencé trois semaines plus tard que prévu. Des centres éphémères vont ouvrir dans les pharmacies rurales.</p>",
      },
    ],
  },
];

const PAYS_DE_LA_LOIRE_2025: SeededChantier[] = [
  aLHeure({
    chantierId: "CH-001",
    taux: 80,
    commentaire:
      "Le maillage des référents VSS est complet ; les signalements ont doublé depuis l'ouverture de la plateforme régionale.",
  }),
  aLHeure({
    chantierId: "CH-005",
    taux: 75,
    commentaire:
      "Le délai médian de passage est stabilisé à 2 h 45 grâce aux maisons médicales de garde.",
  }),
  {
    chantierId: "CH-007",
    taux: 55,
    ecart: -20,
    meteo: "NUAGE",
    commentaireSynthese:
      "Le nombre de dossiers de rénovation déposés recule depuis la baisse des aides ; les artisans labellisés manquent en Mayenne.",
    indicateur: {
      valeurInitiale: 1000,
      valeurActuelle: 3200,
      valeurCible: 5000,
      tauxAvancement: 55,
    },
  },
];

const AUVERGNE_RHONE_ALPES_2025: SeededChantier[] = [
  aLHeure({
    chantierId: "CH-001",
    taux: 70,
    commentaire:
      "Les référents VSS sont en place dans huit départements sur douze.",
  }),
  aLHeure({
    chantierId: "CH-004",
    taux: 60,
    commentaire:
      "Quatorze maisons de santé ouvertes depuis janvier, dont six en zone de montagne.",
  }),
];

const departementBreton = ({
  tauxCh001,
  tauxCh005,
  ecartCh005,
  tauxCh006,
}: {
  tauxCh001: number;
  tauxCh005: number;
  ecartCh005: number;
  tauxCh006: number;
}): SeededChantier[] => [
  aLHeure({
    chantierId: "CH-001",
    taux: tauxCh001,
    commentaire:
      "Les référents VSS du département sont désignés ; la coordination avec les parquets est en cours.",
  }),
  {
    chantierId: "CH-005",
    taux: tauxCh005,
    ecart: ecartCh005,
    meteo: "NUAGE",
    commentaireSynthese:
      "Le délai de passage aux urgences reste au-dessus de la cible faute de médecins régulateurs.",
    indicateur: {
      valeurInitiale: 280,
      valeurActuelle: 240,
      valeurCible: 180,
      tauxAvancement: tauxCh005,
    },
  },
  {
    chantierId: "CH-006",
    taux: tauxCh006,
    ecart: 1,
    meteo: "ORAGE",
    commentaireSynthese: null,
    indicateur: {
      valeurInitiale: 45,
      valeurActuelle: 50,
      valeurCible: 75,
      tauxAvancement: tauxCh006,
    },
  },
];

const PEUPLEMENT_2025: {
  territoire: TerritoireRef;
  chantiers: SeededChantier[];
}[] = [
  { territoire: TERRITOIRES.bretagne, chantiers: BRETAGNE_2025 },
  { territoire: TERRITOIRES.paysDeLaLoire, chantiers: PAYS_DE_LA_LOIRE_2025 },
  {
    territoire: TERRITOIRES.auvergneRhoneAlpes,
    chantiers: AUVERGNE_RHONE_ALPES_2025,
  },
  {
    territoire: TERRITOIRES.cotesDArmor,
    chantiers: departementBreton({
      tauxCh001: 45,
      tauxCh005: 38,
      ecartCh005: -12,
      tauxCh006: 55,
    }),
  },
  {
    territoire: TERRITOIRES.finistere,
    chantiers: departementBreton({
      tauxCh001: 70,
      tauxCh005: 28,
      ecartCh005: -22,
      tauxCh006: 60,
    }),
  },
  {
    territoire: TERRITOIRES.illeEtVilaine,
    chantiers: departementBreton({
      tauxCh001: 58,
      tauxCh005: 30,
      ecartCh005: -18,
      tauxCh006: 50,
    }),
  },
  {
    territoire: TERRITOIRES.morbihan,
    chantiers: departementBreton({
      tauxCh001: 66,
      tauxCh005: 52,
      ecartCh005: -11,
      tauxCh006: 57,
    }),
  },
  {
    territoire: TERRITOIRES.vaucluse,
    chantiers: [
      aLHeure({
        chantierId: "CH-001",
        taux: 72,
        commentaire: "Le réseau des référents VSS couvre tout le département.",
      }),
      aLHeure({
        chantierId: "CH-004",
        taux: 64,
        commentaire: "Trois maisons de santé ouvertes dans le Haut-Vaucluse.",
      }),
    ],
  },
];

/**
 * Le jalon précédent, pour « Comparer les taux d'avancement entre le jalon
 * 2025 et un autre jalon ». Aucune donnée n'est semée en 2023 : le cas qui la
 * demande vérifie qu'Albert le dit au lieu d'inventer.
 */
const PEUPLEMENT_2024 = [
  {
    territoire: TERRITOIRES.bretagne,
    chantiers: [
      { chantierId: "CH-001", taux: 50, ecart: -5 },
      { chantierId: "CH-005", taux: 30, ecart: -14 },
      { chantierId: "CH-006", taux: 49, ecart: -1 },
    ],
  },
  {
    territoire: TERRITOIRES.paysDeLaLoire,
    chantiers: [
      { chantierId: "CH-001", taux: 65, ecart: 6 },
      { chantierId: "CH-005", taux: 60, ecart: 4 },
      { chantierId: "CH-007", taux: 50, ecart: -8 },
    ],
  },
  {
    territoire: TERRITOIRES.auvergneRhoneAlpes,
    chantiers: [
      { chantierId: "CH-001", taux: 58, ecart: 1 },
      { chantierId: "CH-004", taux: 52, ecart: -3 },
    ],
  },
];

export async function seedMondeTerritorial({ authorId }: { authorId: string }) {
  for (const { territoire, chantiers } of PEUPLEMENT_2025) {
    await seedTerritoire({
      territoire,
      jalon: JALON_COURANT,
      chantiers,
      authorId,
    });
  }

  for (const { territoire, chantiers } of PEUPLEMENT_2024) {
    await seedJalon({ territoire, jalon: 2024, chantiers });
  }
}
