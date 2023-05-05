import Sélecteur from '@/client/components/_commons/Sélecteur/Sélecteur';
import { actionsTerritoiresStore, mailleSélectionnéeTerritoiresStore, territoireSélectionnéTerritoiresStore, départementsTerritoiresStore, régionsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import SélecteurTerritoireProps from './SélecteurTerritoire.interface';

const construireLaListeDOptions = (listeCodeInsee: string[]) => {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const départements = départementsTerritoiresStore();
  const régions = régionsTerritoiresStore();

  const territoires = mailleSélectionnée === 'départementale' ? départements : régions;

  const territoiresDisponibles = territoires.filter((c) => (listeCodeInsee.find((code) => code === c.codeInsee)));
  
  let result = [];
  if (!listeCodeInsee.includes('FR')) {
    result.push({
      libellé: 'France',
      valeur: 'FR',
    });
  }

  return [
    ...result, 
    ...territoiresDisponibles.map(territoire => ({
      libellé: mailleSélectionnée === 'départementale' ? `${territoire.codeInsee} – ${territoire.nom}` : territoire.nom,
      valeur: territoire.codeInsee,
    })),
  ];
};

export default function SélecteurTerritoire({ habilitation } : SélecteurTerritoireProps) {
  const { modifierTerritoireSélectionné } = actionsTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const listeCodeInsee = habilitation.recupererListeCodeInseeEnLectureDisponible(mailleSélectionnée);
  
  if (!listeCodeInsee.includes(territoireSélectionné.codeInsee)) {
    modifierTerritoireSélectionné(listeCodeInsee[0]);
  }

  return (
    <Sélecteur
      htmlName="périmètre-géographique"
      libellé="Périmètre géographique"
      options={construireLaListeDOptions(listeCodeInsee)}
      valeurModifiéeCallback={codeInsee => modifierTerritoireSélectionné(codeInsee)}
      valeurSélectionnée={territoireSélectionné.codeInsee}
    />
  );
}
