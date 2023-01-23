import {
  niveauDeMaille as niveauDeMailleStore,
  périmètreGéographique as périmètreGéographiqueStore,
  setNiveauDeMaille as setNiveauDeMailleStore,
  setPérimètreGéographique as setPérimètreGéographiqueStore,
} from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore';
import SélecteurDeNiveauDeMaille
  from '@/components/PageChantiers/BarreLatérale/SélecteursGéographiques/SélecteurDeNiveauDeMaille/SélecteurDeNiveauDeMaille';
import SélecteurDePérimètreGéographique
  from '@/components/PageChantiers/BarreLatérale/SélecteursGéographiques/SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique';
import SélecteursGéographiquesStyled from './SélecteursGéographiques.styled';

export default function SélecteursGéographiques() {
  const niveauDeMaille = niveauDeMailleStore();
  const setNiveauDeMaille = setNiveauDeMailleStore();
  const périmètreGéographique = périmètreGéographiqueStore();
  const setPérimètreGéographique = setPérimètreGéographiqueStore();
  return (
    <SélecteursGéographiquesStyled>
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
    </SélecteursGéographiquesStyled>
  );
}
