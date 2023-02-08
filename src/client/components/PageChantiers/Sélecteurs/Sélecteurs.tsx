import {
  niveauDeMaille as niveauDeMailleStore,
  périmètreGéographique as périmètreGéographiqueStore,
  setNiveauDeMaille as setNiveauDeMailleStore,
  setPérimètreGéographique as setPérimètreGéographiqueStore,
} from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore';
import InterrupteurNiveauDeMaille from '@/components/_commons/InterrupteurNiveauDeMaille/InterrupteurNiveauDeMaille';
import SélecteurDePérimètreGéographique
  from '@/components/_commons/SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique';

export default function Sélecteurs() {
  const niveauDeMaille = niveauDeMailleStore();
  const setNiveauDeMaille = setNiveauDeMailleStore();
  const périmètreGéographique = périmètreGéographiqueStore();
  const setPérimètreGéographique = setPérimètreGéographiqueStore();
  return (
    <>
      <InterrupteurNiveauDeMaille
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
