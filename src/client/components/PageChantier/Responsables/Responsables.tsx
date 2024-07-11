
import Bloc from '@/components/_commons/Bloc/Bloc';
import ResponsablesLigne from '@/client/components/_commons/ResponsablesLigne/ResponsablesLigne';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { virguleOuEspace } from '@/client/utils/strings';
import ResponsablesPageChantierProps from './Responsables.interface';

const adjectifReferent: Record<Maille, string> = {
  'nationale': 'national',
  'départementale': 'départemental',
  'régionale': 'régional',
}; 

export default function ResponsablesPageChantier({ responsables, responsablesLocal, coordinateurTerritorial, afficheResponsablesLocaux, maille }: ResponsablesPageChantierProps) {

  const nomDirecteurProjet = () => (
    responsables.directeursProjet.map((directeurProjet, index) => {
      return (virguleOuEspace(index) + directeurProjet.nom);
    }));
  
  const nomResponsableLocalOuCoordinateur = (responsablesLocalOuCoordinateurs:ResponsablesPageChantierProps['coordinateurTerritorial' | 'responsablesLocal']) => (
    responsablesLocalOuCoordinateurs.map((responsableLocalOuCoordinateur, index) => {
      return (virguleOuEspace(index) + responsableLocalOuCoordinateur.nom);
    }));
  
  return (
    <Bloc titre='National'>
      <ResponsablesLigne  
        estEmailResponsable={responsables.directeursProjet.map(directeur => directeur.email)}
        estEnTeteDePageChantier={false}
        estNomResponsable={nomDirecteurProjet()}
        libellé='Directeur(s) / directrice(s) du projet'
      />
      {
          !!afficheResponsablesLocaux && 
          <>
            <hr className='fr-hr fr-py-1w' />
            <ResponsablesLigne
              estEmailResponsable={responsablesLocal.map(responsableLocal => responsableLocal.email)}
              estEnTeteDePageChantier={false}
              estNomResponsable={nomResponsableLocalOuCoordinateur(responsablesLocal)}
              libellé='Responsable local'
            />
            <hr className='fr-hr fr-py-1w' />
            <ResponsablesLigne          
              estEmailResponsable={coordinateurTerritorial.map(coordinateur => coordinateur.email)}
              estEnTeteDePageChantier={false}
              estNomResponsable={nomResponsableLocalOuCoordinateur(coordinateurTerritorial)}
              libellé={`Coordinateur PILOTE ${maille ? adjectifReferent[maille] : ''}`}
            />
          </>
        }
    </Bloc>
  );
}
