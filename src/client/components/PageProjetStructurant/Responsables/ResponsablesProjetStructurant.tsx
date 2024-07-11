import { FunctionComponent } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import ResponsablesLigneProjetStructurant
  from '@/components/_commons/ResponsablesLigneProjetStructurant/ResponsablesLigneProjetStructurant';
import ResponsablesProjetStructurantStyled from './ResponsablesProjetStructurant.styled';
import ResponsablesPageProjetStructurantProps from './ResponsablesProjetStructurant.interface';

const ResponsablesProjetStructurant: FunctionComponent<ResponsablesPageProjetStructurantProps> = ({
  responsables,
  nomTerritoire,
}) => {
  return (
    <ResponsablesProjetStructurantStyled>
      <Bloc titre={nomTerritoire}>
        <ResponsablesLigneProjetStructurant
          libellé='Ministère porteur'
          listeNomsResponsables={[responsables.ministèrePorteur]}
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigneProjetStructurant
          libellé='Autres ministères co-porteurs'
          listeNomsResponsables={responsables.ministèresCoporteurs}
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigneProjetStructurant
          libellé='Direction de l’administration porteuse du projet'
          listeNomsResponsables={responsables.directionAdmininstration}
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigneProjetStructurant
          libellé='Chefferie de projet'
          listeNomsResponsables={responsables.chefferieDeProjet}
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigneProjetStructurant
          libellé='Co-porteur(s) du projet'
          listeNomsResponsables={responsables.coporteurs}
        />
      </Bloc>
    </ResponsablesProjetStructurantStyled>
  );
};

export default ResponsablesProjetStructurant;
