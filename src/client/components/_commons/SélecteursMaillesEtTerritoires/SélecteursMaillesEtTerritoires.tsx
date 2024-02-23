import Chantier from '@/server/domain/chantier/Chantier.interface';
import SélecteurMaille from './SélecteurMaille/SélecteurMaille';
import SélecteurTerritoire from './SélecteurTerritoire/SélecteurTerritoire';

interface SélecteursMaillesEtTerritoiresProps {
  chantierMailles?: Chantier['mailles'];
}

export default function SélecteursMaillesEtTerritoires({ chantierMailles }: SélecteursMaillesEtTerritoiresProps) {
  return (
    <>
      <SélecteurMaille />
      <SélecteurTerritoire 
        chantierMailles={chantierMailles}
      />
    </>
  );
}
