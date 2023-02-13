import {
  mailleInterne as mailleInterneStore,
  périmètreGéographique as périmètreGéographiqueStore,
  setMailleInterne as setMailleInterneStore,
  setPérimètreGéographique as setPérimètreGéographiqueStore,
} from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore';
import SélecteurDePérimètreGéographique
  from '@/components/_commons/SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique';
import InterrupteurMailleInterne from '@/components/_commons/InterrupteurMailleInterne/InterrupteurMailleInterne';

export default function Sélecteurs() {
  const mailleInterne = mailleInterneStore();
  const setMailleInterne = setMailleInterneStore();
  const périmètreGéographique = périmètreGéographiqueStore();
  const setPérimètreGéographique = setPérimètreGéographiqueStore();
  return (
    <>
      <InterrupteurMailleInterne
        mailleInterne={mailleInterne}
        setMailleInterne={setMailleInterne}
      />
      <SélecteurDePérimètreGéographique
        mailleInterne={mailleInterne}
        périmètreGéographique={périmètreGéographique}
        setPérimètreGéographique={setPérimètreGéographique}
      />
    </>
  );
}
