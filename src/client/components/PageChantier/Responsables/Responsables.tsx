
import Bloc from '@/components/_commons/Bloc/Bloc';
import ResponsablesLigne from '@/client/components/_commons/ResponsablesLigne/ResponsablesLigne';
import { Maille } from '@/server/domain/maille/Maille.interface';
import ResponsablesPageChantierProps from './Responsables.interface';

const adjectifReferent: Record<Maille, string> = {
  'nationale': 'national',
  'départementale': 'départemental',
  'régionale': 'régional',
}; 

export default function ResponsablesPageChantier({ responsables, responsablesLocal, coordinateurTerritorial, afficheResponsablesLocaux, maille }: ResponsablesPageChantierProps) {
   
  return (
    <Bloc titre='National'>
      <ResponsablesLigne  
        estEmailResponsable={responsables.directeursProjet.map(directeur => directeur.email)}
        estEnTeteDePageChantier={false}
        estNomResponsable={responsables.directeursProjet.map(directeur => directeur.nom)}
        libellé='Directeur(s) / directrice(s) du projet' 
      />
      {
          !!afficheResponsablesLocaux && 
          <>
            <hr className='fr-hr fr-py-1w' />
            <ResponsablesLigne
              estEmailResponsable={responsablesLocal.map(responsableLocal => responsableLocal.email)}
              estEnTeteDePageChantier={false}
              estNomResponsable={responsablesLocal.map(responsableLocal => responsableLocal.nom)}
              libellé='Responsable local'
            />
            <hr className='fr-hr fr-py-1w' />
            <ResponsablesLigne          
              estEmailResponsable={coordinateurTerritorial.map(coordinateur => coordinateur.email)}
              estEnTeteDePageChantier={false}
              estNomResponsable={coordinateurTerritorial.map(coordinateur => coordinateur.nom)}
              libellé={`Coordinateur PILOTE ${maille ? adjectifReferent[maille] : ''}`}
            />
          </>
        }
    </Bloc>
  );
}
