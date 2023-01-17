import SélecteursGéographiquesStyled from './SélecteursGéographiques.styled';
import SélecteursGéographiquesProps from './SélecteursGéographiques.interface';
import SélecteurDeNiveauDeMaille from './SélecteurDeNiveauDeMaille/SélecteurDeNiveauDeMaille';

export default function SélecteursGéographiques({ setNiveauDeMaille, niveauDeMaille }: SélecteursGéographiquesProps) {
  return (
    <SélecteursGéographiquesStyled>
      <div className='fr-p-3w'>
        <SélecteurDeNiveauDeMaille
          niveauDeMaille={niveauDeMaille}
          setNiveauDeMaille={setNiveauDeMaille}
        />
      </div>
    </SélecteursGéographiquesStyled>
  );
}
