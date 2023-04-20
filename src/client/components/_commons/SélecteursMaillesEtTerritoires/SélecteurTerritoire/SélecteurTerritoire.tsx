import Sélecteur from '@/client/components/_commons/Sélecteur/Sélecteur';
import { actionsTerritoiresStore, mailleSélectionnéeTerritoiresStore, territoireSélectionnéTerritoiresStore, départementsTerritoiresStore, régionsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';

const construireLaListeDOptions = () => {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const départements = départementsTerritoiresStore();
  const régions = régionsTerritoiresStore();

  const territoires = mailleSélectionnée === 'départementale' ? départements : régions;

  return [
    {
      libellé: 'France',
      valeur: 'FR',
    },
    ...territoires.map(territoire => ({
      libellé: mailleSélectionnée === 'départementale' ? `${territoire.codeInsee} – ${territoire.nom}` : territoire.nom,
      valeur: territoire.codeInsee,
    })),
  ];
};

export default function SélecteurTerritoire() {
  const { modifierTerritoireSélectionné } = actionsTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  return (
    <Sélecteur
      htmlName="périmètre-géographique"
      libellé="Périmètre géographique"
      options={construireLaListeDOptions()}
      valeurModifiéeCallback={codeInsee => modifierTerritoireSélectionné(codeInsee)}
      valeurSélectionnée={territoireSélectionné.codeInsee}
    />
  );
}
