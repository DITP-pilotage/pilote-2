import {
  niveauDeMaille as niveauDeMailleStore,
  périmètreGéographique as périmètreGéographiqueStore,
  setNiveauDeMaille as setNiveauDeMailleStore,
  setPérimètreGéographique as setPérimètreGéographiqueStore,
} from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore';
import SélecteurDeNiveauDeMaille from '@/components/_commons/SélecteurDeNiveauDeMaille/SélecteurDeNiveauDeMaille';
import SélecteurDePérimètreGéographique
  from '@/components/_commons/SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique';

export default function FiltresSélecteurs() {
  const niveauDeMaille = niveauDeMailleStore();
  const setNiveauDeMaille = setNiveauDeMailleStore();
  const périmètreGéographique = périmètreGéographiqueStore();
  const setPérimètreGéographique = setPérimètreGéographiqueStore();
  return (
    <>
      <SélecteurDeNiveauDeMaille
        niveauDeMaille={niveauDeMaille}
        setNiveauDeMaille={setNiveauDeMaille}
      />
      <SélecteurDePérimètreGéographique
        niveauDeMaille={niveauDeMaille}
        périmètreGéographique={périmètreGéographique}
        setPérimètreGéographique={setPérimètreGéographique}
      />
    </>
  );
}
