import { TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';

export type Rubrique = {
  nom: string,
  ancre: string,
  sousRubriques?: Rubrique[]
};

export type CategoriesIndicateur = 'participation_ta' | 'non_participation_ta' | 'autre';
export type ÉlémentPageIndicateursType = Rubrique & { categorieIndicateur: CategoriesIndicateur, description: string | null, estAccordeonOuvert: boolean };

export const listeRubriquesIndicateursChantier: ÉlémentPageIndicateursType[] = [
  { 
    nom: "Indicateurs pris en compte dans le taux d'avancement du territoire",
    ancre: 'participation_ta', 
    categorieIndicateur: 'participation_ta',
    description: null,
    estAccordeonOuvert: true,
  },
  { 
    nom: "Indicateurs non pris en compte dans le taux d'avancement du territoire et/ou de la maille",
    ancre: 'non_participation_ta',
    categorieIndicateur: 'non_participation_ta',
    description: "Ces indicateurs ne sont pas pris en compte pour le territoire. Toutefois, ils peuvent être pris en compte dans le calcul du taux d'avancement pour d'autres territoires ou d'autres mailles géographiques",
    estAccordeonOuvert: false,
  },
  { 
    nom: 'Autres indicateurs', 
    ancre: 'autre', 
    categorieIndicateur: 'autre',
    description: "Ces indicateurs ne sont jamais pris en compte pour calculer le taux d'avancement de la PPG. Ils sont présentés pour donner des informations complémentaires sur l'impact et le déploiement de la PPG",
    estAccordeonOuvert: false,
  },
];
  
export const listeRubriquesChantier = (categorieIndicateur: CategoriesIndicateur[], maille: Maille): Rubrique[] => {
  const rubriquesIndicateursNonVides = listeRubriquesIndicateursChantier.filter(
    rubriqueIndicateur => categorieIndicateur.includes(rubriqueIndicateur.categorieIndicateur),
  );

  let rubriques = maille === 'nationale' ? [
    { nom: 'Avancement du chantier', ancre: 'avancement' },
    { nom: 'Météo et synthèse des résultats', ancre: 'synthèse' },
    { nom: 'Responsables', ancre: 'responsables' },
    { nom: 'Répartition géographique', ancre: 'cartes' },
    { nom: 'Objectifs', ancre: 'objectifs' },
    { nom: 'Indicateurs', ancre: 'indicateurs', sousRubriques: rubriquesIndicateursNonVides },
    { nom: 'Décisions stratégiques', ancre: 'décisions-stratégiques' },
    { nom: 'Commentaires', ancre: 'commentaires' },
  ] : [
    { nom: 'Avancement du chantier', ancre: 'avancement' },
    { nom: 'Météo et synthèse des résultats', ancre: 'synthèse' },
    { nom: 'Responsables', ancre: 'responsables' },
    { nom: 'Répartition géographique', ancre: 'cartes' },
    { nom: 'Objectifs', ancre: 'objectifs' },
    { nom: 'Indicateurs', ancre: 'indicateurs', sousRubriques: rubriquesIndicateursNonVides },
    { nom: 'Commentaires', ancre: 'commentaires' },
  ];

  if (rubriquesIndicateursNonVides.length === 0) {
    rubriques = rubriques.filter(rubrique => rubrique.nom != 'Indicateurs');
  }

  return rubriques;
};

export type ÉlémentPageIndicateursTypeProjetsStructurants = Rubrique & { typeIndicateur: TypeIndicateur };
export const listeRubriquesIndicateursProjetStructurant: ÉlémentPageIndicateursTypeProjetsStructurants[] = [
  { nom: 'Indicateurs d\'impact', ancre: 'impact', typeIndicateur: 'IMPACT' },
  { nom: 'Indicateurs de déploiement', ancre: 'déploiement', typeIndicateur: 'DEPL' },
  { nom: 'Indicateurs financiers', ancre: 'financier', typeIndicateur: 'FINANCIER' },
];
  
export const listeRubriquesProjetStructurant = (typesIndicateurs: TypeIndicateur[]): Rubrique[] => {
  const rubriquesIndicateursNonVides = listeRubriquesIndicateursProjetStructurant.filter(
    rubriqueIndicateur => typesIndicateurs.includes(rubriqueIndicateur.typeIndicateur),
  );
  
  let rubriques = [
    { nom: 'Avancement du projet', ancre: 'avancement' },
    { nom: 'Responsables', ancre: 'responsables' },
    { nom: 'Météo et synthèse des résultats', ancre: 'synthèse' },
    { nom: 'Objectifs', ancre: 'objectifs' },
    { nom: 'Indicateurs', ancre: 'indicateurs', sousRubriques: rubriquesIndicateursNonVides },
    { nom: 'Commentaires', ancre: 'commentaires' },
  ];

  if (rubriquesIndicateursNonVides.length === 0) {
    rubriques = rubriques.filter(rubrique => rubrique.nom != 'Indicateurs');
  }

  return rubriques;
};
