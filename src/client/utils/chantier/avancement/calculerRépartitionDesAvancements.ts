import { calculerMoyenne, calculerMédiane, valeurMinimum, valeurMaximum } from '@/client/utils/statistiques/statistiques';
import {
  DonnéesTerritoires,
  TerritoireSansCodeInsee,
} from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';
import { Agrégation } from '@/client/utils/types';
import { Maille, MailleInterne } from '@/server/domain/chantier/Chantier.interface';

export default function calculerRépartitionDesAvancements(donnéesTerritoireAggrégée: DonnéesTerritoires<Agrégation<TerritoireSansCodeInsee>>, mailleAssociéeAuTerritoireSélectionné: Maille, mailleSélectionnée: MailleInterne, codeInseeTerritoireSélectionné: string) {

  const avancements = donnéesTerritoireAggrégée[mailleAssociéeAuTerritoireSélectionné][codeInseeTerritoireSélectionné].avancement;
  const avancementsGlobaux = avancements.map(avancement => avancement.global);

  const moyennesTauxAvancementMaille: (number | null)[] = [];

  if (mailleSélectionnée === 'départementale') {
    Object.entries(donnéesTerritoireAggrégée.départementale).forEach(([codeInsee, territoire]) => {
      moyennesTauxAvancementMaille.push(calculerMoyenne(territoire.avancement.map(avancement => avancement.global)));
    });
  } else if (mailleSélectionnée === 'régionale') {
    Object.entries(donnéesTerritoireAggrégée.régionale).forEach(([codeInsee, territoire]) => {
      moyennesTauxAvancementMaille.push(calculerMoyenne(territoire.avancement.map(avancement => avancement.global)));
    });
  }

  return {
    moyenne: calculerMoyenne(avancementsGlobaux),
    médiane: calculerMédiane(moyennesTauxAvancementMaille),
    minimum: valeurMinimum(moyennesTauxAvancementMaille),
    maximum: valeurMaximum(moyennesTauxAvancementMaille),
  };
}
