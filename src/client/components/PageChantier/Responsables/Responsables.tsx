
import Bloc from '@/components/_commons/Bloc/Bloc';
import ResponsablesLigne from '@/client/components/_commons/ResponsablesLigne/ResponsablesLigne';
import { Maille } from '@/server/domain/maille/Maille.interface';
import ResponsablesPageChantierProps from './Responsables.interface';

const mailTo = (label: string, mail: string | null) => (
  mail ?
    <a href={`mailto:${mail}`}>
      {label}
    </a>
    : label
);

const adjectifReferent: Record<Maille, string> = {
  'nationale': 'national',
  'départementale': 'départemental',
  'régionale': 'régional',
}; 

export default function ResponsablesPageChantier({ responsables, responsablesLocal, coordinateurTerritorial, afficheResponsablesLocaux, maille }: ResponsablesPageChantierProps) {
   
  return (
    <Bloc titre='National'>
      <ResponsablesLigne
        contenu={responsables.directeursProjet.map(directeur => (mailTo(directeur.nom, directeur.email)))}
        estEnTeteDePageChantier={false}
        libellé='Directeur(s) / directrice(s) du projet'
      />
      {
          !!afficheResponsablesLocaux && 
          <>
            <hr className='fr-hr fr-py-1w' />
            <ResponsablesLigne
              contenu={
                responsablesLocal?.map(responsable => 
                  mailTo(responsable.nom, responsable.email))
              }
              estEnTeteDePageChantier={false}
              libellé='Responsable local'
            />
            <hr className='fr-hr fr-py-1w' />
            <ResponsablesLigne
              contenu={coordinateurTerritorial?.map(coordinateur => mailTo(coordinateur.nom, coordinateur.email))}
              estEnTeteDePageChantier={false}
              libellé={`Coordinateur PILOTE ${maille ? adjectifReferent[maille] : ''}`}
            />
          </>
        }
    </Bloc>
  );
}
