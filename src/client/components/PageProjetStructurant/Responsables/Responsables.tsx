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
          estEnTeteDePageChantier={false}
          libellé='Ministère porteur'
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          contenu={responsables.ministèresCoporteurs}
          estEnTeteDePageChantier={false}
          libellé='Autres ministères co-porteurs'
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          contenu={responsables.directionAdmininstration}
          estEnTeteDePageChantier={false}
          libellé='Direction de l’administration porteuse du projet'
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          contenu={responsables.chefferieDeProjet}
          estEnTeteDePageChantier={false}
          libellé='Chefferie de projet'
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          contenu={responsables.coporteurs}
          estEnTeteDePageChantier={false}
          libellé='Co-porteur(s) du projet'
        />
      </Bloc>
    </ResponsablesPageProjetStructurantStyled>
  );
}
