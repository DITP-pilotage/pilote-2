
import Bloc from '@/components/_commons/Bloc/Bloc';
import ResponsablesLigne from '@/client/components/_commons/ResponsablesLigne/ResponsablesLigne';
import { Maille } from '@/server/domain/maille/Maille.interface';
import ResponsablesPageChantierStyled from './Responsables.styled';
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
    <ResponsablesPageChantierStyled>
      <Bloc titre='National'>
        <ResponsablesLigne
          contenu={responsables.porteur ? [responsables.porteur.nom] : []}
          libellé='Ministère porteur'
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          contenu={responsables.coporteurs.map(coporteur => coporteur.nom)}
          libellé='Autres ministères co-porteurs'
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          contenu={responsables.directeursAdminCentrale.map(directeur => (`${directeur.nom} (${directeur.direction})`))}
          libellé='Directeur(s) / directrice(s) d’Administration Centrale'
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          contenu={responsables.directeursProjet.map(directeur => (mailTo(directeur.nom, directeur.email)))}
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
              libellé='Responsable local'
            />
            <hr className='fr-hr fr-py-1w' />
            <ResponsablesLigne
              contenu={coordinateurTerritorial?.map(coordinateur => mailTo(coordinateur.nom, coordinateur.email))}
              libellé={`Coordinateur PILOTE ${maille ? adjectifReferent[maille] : ''}`}
            />
          </>
        }
      </Bloc>
    </ResponsablesPageChantierStyled>
  );
}
