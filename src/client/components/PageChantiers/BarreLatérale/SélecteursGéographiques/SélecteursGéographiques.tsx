import SélecteurDePérimètreGéographique
  from '@/components/PageChantiers/BarreLatérale/SélecteursGéographiques/SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique';
import SélecteursGéographiquesStyled from './SélecteursGéographiques.styled';
import SélecteurDeNiveauDeMaille from './SélecteurDeNiveauDeMaille/SélecteurDeNiveauDeMaille';

export default function SélecteursGéographiques() {
  return (
    <SélecteursGéographiquesStyled>
      <div className='fr-p-3w'>
        <SélecteurDeNiveauDeMaille />
        <SélecteurDePérimètreGéographique />
      </div>
    </SélecteursGéographiquesStyled>
  );
}
