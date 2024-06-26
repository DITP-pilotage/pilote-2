import { TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';

export type Rubrique = {
  nom: string,
  ancre: string,
  sousRubriques?: Rubrique[]
};

export type ÉlémentPageIndicateursType = Rubrique & { typeIndicateur: TypeIndicateur };

export const listeRubriquesIndicateursChantier: ÉlémentPageIndicateursType[] = [
  { nom: 'Indicateurs d\'impact', ancre: 'impact', typeIndicateur: 'IMPACT' },
  { nom: 'Indicateurs de déploiement', ancre: 'déploiement', typeIndicateur: 'DEPL' },
  { nom: 'Indicateurs de qualité de service', ancre: 'perception', typeIndicateur: 'Q_SERV' },
  { nom: 'Indicateurs de suivi des externalités et effets rebond', ancre: 'suivi', typeIndicateur: 'REBOND' },
  { nom: 'Indicateurs de contexte', ancre: 'contexte', typeIndicateur: 'CONTEXTE' },
];
  
export const listeRubriquesChantier = (typesIndicateurs: TypeIndicateur[], maille: Maille): Rubrique[] => {
  const rubriquesIndicateursNonVides = listeRubriquesIndicateursChantier.filter(
    rubriqueIndicateur => typesIndicateurs.includes(rubriqueIndicateur.typeIndicateur),
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

  if (rubriquesIndicateursNonVides.length === 0)
    rubriques = rubriques.filter(rubrique => rubrique.nom != 'Indicateurs');

  return rubriques;
};

export const listeRubriquesIndicateursProjetStructurant: ÉlémentPageIndicateursType[] = [
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

  if (rubriquesIndicateursNonVides.length === 0)
    rubriques = rubriques.filter(rubrique => rubrique.nom != 'Indicateurs');

  return rubriques;
};
