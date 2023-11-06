
import Bloc from '@/components/_commons/Bloc/Bloc';
import ResponsablesLigne from '@/client/components/_commons/ResponsablesLigne/ResponsablesLigne';
import ResponsablesPageChantierStyled from './Responsables.styled';
import ResponsablesPageChantierProps from './Responsables.interface';

const mailTo = (label: string, mail: string | null) => (
  mail ?
    <a href={`mailto:${mail}`}>
      {label}
    </a>
    : label
);

export default function ResponsablesPageChantier({ responsables }: ResponsablesPageChantierProps) {
   
  return (
    <ResponsablesPageChantierStyled>
      <Bloc titre="National">
        <ResponsablesLigne
          contenu={responsables.porteur ? [responsables.porteur.nom] : []}
          libellé="Ministère porteur"
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          contenu={responsables.coporteurs.map(coporteur => coporteur.nom)}
          libellé="Autres ministères co-porteurs"
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          contenu={responsables.directeursAdminCentrale.map(directeur => (`${directeur.nom} (${directeur.direction})`))}
          libellé="Directeur(s) / directrice(s) d’Administration Centrale"
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          contenu={responsables.directeursProjet.map(directeur => (mailTo(directeur.nom, directeur.email)))}
          libellé="Directeur(s) / directrice(s) du projet"
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          contenu={[]}
          libellé="Responsable local"
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          contenu={[]}
          libellé="Référent pilote du territoire"
        />
      </Bloc>
    </ResponsablesPageChantierStyled>
  );
}
