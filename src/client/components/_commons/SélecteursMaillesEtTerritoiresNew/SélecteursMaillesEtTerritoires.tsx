import Chantier from '@/server/domain/chantier/Chantier.interface';
import SélecteurMaille from './SélecteurMaille/SélecteurMaille';
import SélecteurTerritoire from './SélecteurTerritoire/SélecteurTerritoire';

interface SélecteursMaillesEtTerritoiresProps {
  chantierMailles?: Chantier['mailles'];
  territoireCode: string
  mailleSelectionnee: 'départementale' | 'régionale'
}

export default function SélecteursMaillesEtTerritoires({ chantierMailles, territoireCode, mailleSelectionnee }: SélecteursMaillesEtTerritoiresProps) {
  return (
    <>
      <SélecteurMaille mailleSelectionnee={mailleSelectionnee} />
      <SélecteurTerritoire 
        chantierMailles={chantierMailles}
        mailleSelectionnee={mailleSelectionnee}
        territoireCode={territoireCode}
      />
    </>
  );
}
