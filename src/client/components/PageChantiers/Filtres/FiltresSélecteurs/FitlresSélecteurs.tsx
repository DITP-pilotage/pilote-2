import {
  niveauDeMaille as niveauDeMailleStore,
  périmètreGéographique as périmètreGéographiqueStore,
  setNiveauDeMaille as setNiveauDeMailleStore,
  setPérimètreGéographique as setPérimètreGéographiqueStore,
} from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore';
import SélecteurDeNiveauDeMaille from './SélecteurDeNiveauDeMaille/SélecteurDeNiveauDeMaille';
import SélecteurDePérimètreGéographique from './SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique';
import FiltresSélecteursStyled from './FiltresSélecteurs.styled';

export default function FiltresSélecteurs() {
  const niveauDeMaille = niveauDeMailleStore();
  const setNiveauDeMaille = setNiveauDeMailleStore();
  const périmètreGéographique = périmètreGéographiqueStore();
  const setPérimètreGéographique = setPérimètreGéographiqueStore();
  return (
    <FiltresSélecteursStyled>
      <div className='fr-p-3w'>
        <SélecteurDeNiveauDeMaille
          niveauDeMaille={niveauDeMaille}
          setNiveauDeMaille={setNiveauDeMaille}
        />
        <SélecteurDePérimètreGéographique
          niveauDeMaille={niveauDeMaille}
          périmètreGéographique={périmètreGéographique}
          setPérimètreGéographique={setPérimètreGéographique}
        />
      </div>
    </FiltresSélecteursStyled>
  );
}
