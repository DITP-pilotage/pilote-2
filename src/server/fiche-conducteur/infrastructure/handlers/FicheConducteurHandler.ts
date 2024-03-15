import {
  AvancementFicheConducteurContrat,
  ChantierFicheConducteurContrat,
  DonnéesCartographieContrat,
  FicheConducteurContrat,
  SyntheseDesResultatsContrat,
} from '@/server/fiche-conducteur/app/contrats/FicheConducteurContrat';
import {
  RécupererChantierFicheConducteurUseCase,
} from '@/server/fiche-conducteur/usecases/RécupererChantierFicheConducteurUseCase';
import { ChantierFicheConducteur } from '@/server/fiche-conducteur/domain/ChantierFicheConducteur';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { RécupérerAvancementUseCase } from '@/server/fiche-conducteur/usecases/RécupérerAvancementUseCase';
import { AvancementFicheConducteur } from '@/server/fiche-conducteur/domain/AvancementFicheConducteur';
import {
  RécupérerDernièreSynthèseDesRésultatsUseCase,
} from '@/server/fiche-conducteur/usecases/RécupérerDernièreSynthèseDesRésultatsUseCase';
import { SyntheseDesResultats } from '@/server/fiche-conducteur/domain/SyntheseDesResultats';
import { formaterDate } from '@/client/utils/date/date';
import {
  RécupérerDonnéesCartographieUseCase,
} from '@/server/fiche-conducteur/usecases/RécupérerDonnéesCartographieUseCase';
import { DonnéeCartographie } from '@/server/fiche-conducteur/domain/DonnéeCartographie';


const numberWithSpaces = (nombreATransformer: number) => {
  const parts = nombreATransformer.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
};

const presenterEnChantierFicheConducteurContrat = (chantierFicheConducteur: ChantierFicheConducteur): ChantierFicheConducteurContrat=> {
  return {
    nom: chantierFicheConducteur.nom,
    directeursAdministrationCentrale: chantierFicheConducteur.listeDirecteursAdministrationCentrale.join(', '),
    directeursProjet: chantierFicheConducteur.listeDirecteursProjet.join(', '),
    indicateurs: chantierFicheConducteur.indicateurs.map(indicateurFicheConducteur => ({
      nom: indicateurFicheConducteur.nom,
      dateValeurActuelle: indicateurFicheConducteur.dateValeurActuelle ? `(${formaterDate(indicateurFicheConducteur.dateValeurActuelle, 'MM/YY')})` : '',
      valeurInitiale: indicateurFicheConducteur.valeurInitiale ? numberWithSpaces(indicateurFicheConducteur.valeurInitiale) : '-',
      valeurActuelle: indicateurFicheConducteur.valeurActuelle ? numberWithSpaces(indicateurFicheConducteur.valeurActuelle) : '-',
      objectifValeurCibleIntermediaire: indicateurFicheConducteur.objectifValeurCibleIntermediaire ? numberWithSpaces(indicateurFicheConducteur.objectifValeurCibleIntermediaire) : '-',
      objectifTauxAvancementIntermediaire: indicateurFicheConducteur.objectifTauxAvancementIntermediaire ? numberWithSpaces(indicateurFicheConducteur.objectifTauxAvancementIntermediaire) : '-',
      objectifValeurCible: indicateurFicheConducteur.objectifValeurCible ? numberWithSpaces(indicateurFicheConducteur.objectifValeurCible) : '-',
      objectifTauxAvancement: indicateurFicheConducteur.objectifTauxAvancement ? numberWithSpaces(indicateurFicheConducteur.objectifTauxAvancement) : '-',
    })),

  };
};
const presenterEnAvancementFicheConducteurContrat = (avancementFicheConducteur: AvancementFicheConducteur): AvancementFicheConducteurContrat => {
  return {
    global: avancementFicheConducteur.global,
    minimum: avancementFicheConducteur.minimum,
    mediane: avancementFicheConducteur.mediane,
    maximum: avancementFicheConducteur.maximum,
  };
};

const presenterEnSynthèseDesResultatsContrat = (synthèseDesRésultats: SyntheseDesResultats | null): SyntheseDesResultatsContrat => {
  return  {
    meteo: synthèseDesRésultats?.meteo || null,
    commentaire: synthèseDesRésultats?.commentaire || null,
  };
};

const presenterEnDonnéesCartographieContrat = (donnéesCartographie: DonnéeCartographie[]): DonnéesCartographieContrat => {
  return donnéesCartographie.reduce((acc, val) => {
    acc.tauxAvancement.push({ codeInsee: val.codeInsee, valeur: val.tauxAvancement, estApplicable: true });
    acc.meteo.push({ codeInsee: val.codeInsee, valeur: val.météo, estApplicable: true });
    return acc;
  }, {
    tauxAvancement: [],
    meteo: [],
  } as DonnéesCartographieContrat);
};

export const ficheConducteurHandler = () => {
  const recupererFicheConducteur = async (chantierId: string, territoireCode: string): Promise<FicheConducteurContrat> => {
    const chantier = await new RécupererChantierFicheConducteurUseCase({
      chantierRepository: dependencies.getFicheConducteurChantierRepository(),
      indicateurRepository: dependencies.getFicheConducteurIndicateurRepository(),
    })
      .run({ chantierId, territoireCode })
      .then(presenterEnChantierFicheConducteurContrat);

    const avancement = await new RécupérerAvancementUseCase({ chantierRepository: dependencies.getFicheConducteurChantierRepository() })
      .run({ chantierId })
      .then(presenterEnAvancementFicheConducteurContrat);

    const synthèseDesRésultats = await new RécupérerDernièreSynthèseDesRésultatsUseCase({
      synthèseDesRésultatsRepository: dependencies.getFicheConducteurSynthèseDesRésultatsRepository(),
    })
      .run({ chantierId })
      .then(presenterEnSynthèseDesResultatsContrat);

    const donnéesCartographie = await new RécupérerDonnéesCartographieUseCase({
      chantierRepository: dependencies.getFicheConducteurChantierRepository(),
    })
      .run({ chantierId })
      .then(presenterEnDonnéesCartographieContrat);

    return {
      chantier,
      avancement,
      synthèseDesRésultats,
      donnéesCartographie,
    };
  };
  
  return {
    recupererFicheConducteur,
  };
};
