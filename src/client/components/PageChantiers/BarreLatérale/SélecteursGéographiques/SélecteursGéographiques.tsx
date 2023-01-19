import { niveauDeMaille as niveauDeMailleStore, setNiveauDeMaille as setNiveauDeMailleStore } from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore';
import SélecteurDeNiveauDeMaille
  from '@/components/PageChantiers/BarreLatérale/SélecteursGéographiques/SélecteurDeNiveauDeMaille/SélecteurDeNiveauDeMaille';
import SélecteurDePérimètreGéographique
  from '@/components/PageChantiers/BarreLatérale/SélecteursGéographiques/SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique';
import SélecteursGéographiquesStyled from './SélecteursGéographiques.styled';

export default function SélecteursGéographiques() {
  const niveauDeMaille = niveauDeMailleStore();
  const setNiveauDeMaille = setNiveauDeMailleStore();
  return (
    <SélecteursGéographiquesStyled>
      <div className='fr-p-3w'>
        <SélecteurDeNiveauDeMaille
          niveauDeMaille={niveauDeMaille}
          setNiveauDeMaille={setNiveauDeMaille}
        />
        <SélecteurDePérimètreGéographique niveauDeMaille={niveauDeMaille} />
      </div>
    </SélecteursGéographiquesStyled>
  );
}
