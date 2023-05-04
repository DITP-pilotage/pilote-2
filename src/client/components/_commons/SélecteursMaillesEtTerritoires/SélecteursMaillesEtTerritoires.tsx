import SélecteurMaille from './SélecteurMaille/SélecteurMaille';
import SélecteurTerritoire from './SélecteurTerritoire/SélecteurTerritoire';
import SélecteursMaillesEtTerritoiresProps from './SélecteursMaillesEtTerritoire.interface';




export default function SélecteursMaillesEtTerritoires({ maillesDisponibles, codesInseeDisponibles }: SélecteursMaillesEtTerritoiresProps) {
  return (
    <>
      <SélecteurMaille maillesDisponibles={maillesDisponibles} />
      <SélecteurTerritoire codesInseeDisponibles={codesInseeDisponibles} />
    </>
  );
}
