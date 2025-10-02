export interface Critere {
  id: string;
  nom: string;
  sousCriteres: Array<{
    id: string;
    nom: string;
    evaluation: {
      note: number;
      commentaire: string;
    };
  }>;
}

const CRITERES_STUB: Critere[] = [
  {
    id: "1",
    nom: "Déploiement territorial de la Feuille de route interministérielle",
    sousCriteres: [
      {
        id: "1-1",
        nom: "Gouvernance en place autour du préfet",
        evaluation: {
          note: null,
          commentaire: "",
        },
      },
      {
        id: "1-2",
        nom: "PILOTE – Pilotage qualitatif des données",
        evaluation: {
          note: null,
          commentaire: "",
        },
      },
    ],
  },
  {
    id: "2",
    nom: "Simplification",
    sousCriteres: [
      {
        id: "2-1",
        nom: "Initiatives prises en matière de simplification ",
        evaluation: {
          note: null,
          commentaire: "",
        },
      },
      {
        id: "2-2",
        nom: "Contribution à France Simplification",
        evaluation: {
          note: null,
          commentaire: "",
        },
      },
      {
        id: "2-3",
        nom: "Autres mesures de simplification mises en œuvre",
        evaluation: {
          note: null,
          commentaire: "",
        },
      },
    ],
  },
  {
    id: "3",
    nom: "Accès et qualité des services publics",
    sousCriteres: [
      {
        id: "3-1",
        nom: "Organisation et actions mises en place ou envisagée pour améliorer l’accès aux services publics",
        evaluation: {
          note: null,
          commentaire: "",
        },
      },
      {
        id: "3-2",
        nom: "Appui au déploiement du programme SP+",
        evaluation: {
          note: null,
          commentaire: "",
        },
      },
      {
        id: "3-3",
        nom: "France Services",
        evaluation: {
          note: null,
          commentaire: "",
        },
      },
    ],
  },
  {
    id: "4",
    nom: "Communication",
    sousCriteres: [
      {
        id: "4-1",
        nom: "Valorisation des PPG, dont celle publiées au Baromètre des résultats de l’action publique ",
        evaluation: {
          note: null,
          commentaire: "",
        },
      },
      {
        id: "4-2",
        nom: "Actions de communication demandées par le SIG ",
        evaluation: {
          note: null,
          commentaire: "",
        },
      },
      {
        id: "4-3",
        nom: "Toutes actions ou prises de parole valorisant la mobilisation de l’Etat dans votre territoire ",
        evaluation: {
          note: null,
          commentaire: "",
        },
      },
    ],
  },
];

export interface Objectif {
  id: string;
  nom: string;
  evaluation: {
    note: number;
    commentaire: string;
  };
}

const OBJECTIFS_STUB: Objectif[] = [
  {
    id: "1",
    nom: "Déployer un plan numérique éducatif dans les collèges et lycées",
    evaluation: {
      note: null,
      commentaire: "",
    },
  },
  {
    id: "2",
    nom: " Valoriser le patrimoine historique de Caen, Rouen et le Mont-Saint-Michel",
    evaluation: {
      note: null,
      commentaire: "",
    },
  },
  {
    id: "3",
    nom: "Transition écologique et Cohésion des territoires",
    evaluation: {
      note: null,
      commentaire: "",
    },
  },
  {
    id: "4",
    nom: "Faire de Besançon une référence du sport universitaire",
    evaluation: {
      note: null,
      commentaire: "",
    },
  },
  {
    id: "5",
    nom: "Renforcer l’insertion des jeunes dans les métiers industriels",
    evaluation: {
      note: null,
      commentaire: "",
    },
  },
];

export class AfficherAutoEvaluationUseCase {
  async run() {
    return {
      criteres: CRITERES_STUB,
      objectifs: OBJECTIFS_STUB,
      denieresModifications: new Date().toISOString(),
    };
  }
}
