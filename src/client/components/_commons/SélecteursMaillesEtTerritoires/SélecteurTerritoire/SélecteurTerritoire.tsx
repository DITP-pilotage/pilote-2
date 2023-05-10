import Sélecteur from '@/client/components/_commons/Sélecteur/Sélecteur';
import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import { actionsTerritoiresStore, mailleSélectionnéeTerritoiresStore, territoireSélectionnéTerritoiresStore, territoiresAccessiblesEnLectureStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';

const construireLaListeDOptions = (territoiresAccessiblesEnLecture: DétailTerritoire[]) => {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();

  const territoiresDisponibles = territoiresAccessiblesEnLecture.filter(territoire => territoire.maille === mailleSélectionnée);
  
  let options = [];
  if (territoiresAccessiblesEnLecture.some(territoire => territoire.maille === 'nationale')) {
    options.push({
      libellé: 'France',
      valeur: 'FR',
    });
  }

  return [
    ...options, 
    ...territoiresDisponibles.map(territoire => ({
      libellé: territoire.nomAffiché,
      valeur: territoire.codeInsee,
    })),
  ];
};

export default function SélecteurTerritoire() {
  const { modifierTerritoireSélectionné } = actionsTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const territoiresAccessiblesEnLecture = territoiresAccessiblesEnLectureStore();
  
  return (
    <Sélecteur
      htmlName="périmètre-géographique"
      libellé="Périmètre géographique"
      options={construireLaListeDOptions(territoiresAccessiblesEnLecture)}
      valeurModifiéeCallback={codeInsee => modifierTerritoireSélectionné(codeInsee)}
      valeurSélectionnée={territoireSélectionné.codeInsee}
    />
  );
}
