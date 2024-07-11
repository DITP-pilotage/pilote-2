import Bloc from '@/components/_commons/Bloc/Bloc';
import ResponsablesLigne from '@/client/components/_commons/ResponsablesLigne/ResponsablesLigne';
import ResponsablesPageProjetStructurantStyled from './Responsables.styled';
import ResponsablesPageProjetStructurantProps from './Responsables.interface';

export default function ResponsablesPageProjetStructurant({ responsables, nomTerritoire }: ResponsablesPageProjetStructurantProps) {
   
  return (
    <ResponsablesPageProjetStructurantStyled>
      <Bloc titre={nomTerritoire}>
        <ResponsablesLigne
          libellé='Ministère porteur'
          listeNomsResponsables={[responsables.ministèrePorteur]}
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          libellé='Autres ministères co-porteurs'
          listeNomsResponsables={responsables.ministèresCoporteurs}
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          libellé='Direction de l’administration porteuse du projet'
          listeNomsResponsables={responsables.directionAdmininstration}
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          libellé='Chefferie de projet'
          listeNomsResponsables={responsables.chefferieDeProjet}
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          libellé='Co-porteur(s) du projet'
          listeNomsResponsables={responsables.coporteurs}
        />
      </Bloc>
    </ResponsablesPageProjetStructurantStyled>
  );
}
