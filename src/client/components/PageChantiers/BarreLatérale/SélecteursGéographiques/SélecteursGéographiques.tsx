import SélecteursGéographiquesStyled from './SélecteursGéographiques.styled';
import SélecteurDeNiveauDeMaille from './SélecteurDeNiveauDeMaille/SélecteurDeNiveauDeMaille';

export default function SélecteursGéographiques() {
  return (
    <SélecteursGéographiquesStyled>
      <div className='fr-p-3w'>
        <SélecteurDeNiveauDeMaille />
      </div>
    </SélecteursGéographiquesStyled>
  );
}
