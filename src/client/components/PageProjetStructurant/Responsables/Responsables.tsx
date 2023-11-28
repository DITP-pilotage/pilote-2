import Bloc from '@/components/_commons/Bloc/Bloc';
import ResponsablesLigne from '@/client/components/_commons/ResponsablesLigne/ResponsablesLigne';
import ResponsablesPageProjetStructurantStyled from './Responsables.styled';
import ResponsablesPageProjetStructurantProps from './Responsables.interface';

export default function ResponsablesPageProjetStructurant({ responsables, nomTerritoire }: ResponsablesPageProjetStructurantProps) {
   
  return (
    <ResponsablesPageProjetStructurantStyled>
      <Bloc titre={nomTerritoire}>
        <ResponsablesLigne
          contenu={[responsables.ministèrePorteur]}
          libellé='Ministère porteur'
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          contenu={responsables.ministèresCoporteurs}
          libellé='Autres ministères co-porteurs'
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          contenu={responsables.directionAdmininstration}
          libellé='Direction de l’administration porteuse du projet'
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          contenu={responsables.chefferieDeProjet}
          libellé='Chefferie de projet'
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          contenu={responsables.coporteurs}
          libellé='Co-porteur(s) du projet'
        />
      </Bloc>
    </ResponsablesPageProjetStructurantStyled>
  );
}
