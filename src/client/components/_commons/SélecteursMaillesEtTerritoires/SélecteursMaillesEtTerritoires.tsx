import SélecteurMaille from './SélecteurMaille/SélecteurMaille';
import SélecteurTerritoire from './SélecteurTerritoire/SélecteurTerritoire';
import SélecteursMaillesEtTerritoiresProps from './SélecteursMaillesEtTerritoire.interface';

export default function SélecteursMaillesEtTerritoires({ habilitation }: SélecteursMaillesEtTerritoiresProps) {
  return (
    <>
      <SélecteurMaille habilitation={habilitation} />
      <SélecteurTerritoire habilitation={habilitation} />
    </>
  );
}
