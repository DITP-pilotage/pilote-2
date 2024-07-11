import Bloc from '@/components/_commons/Bloc/Bloc';
import ResponsablesLigne from '@/client/components/_commons/ResponsablesLigne/ResponsablesLigne';
import ResponsablesPageProjetStructurantStyled from './Responsables.styled';
import ResponsablesPageProjetStructurantProps from './Responsables.interface';

export default function ResponsablesPageProjetStructurant({ responsables, nomTerritoire }: ResponsablesPageProjetStructurantProps) {
   
  return (
    <ResponsablesPageProjetStructurantStyled>
      <Bloc titre={nomTerritoire}>
        <ResponsablesLigne
          estEnTeteDePageChantier={false}
          estNomResponsable={[responsables.ministèrePorteur]}
          libellé='Ministère porteur'
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          estEnTeteDePageChantier={false}
          estNomResponsable={responsables.ministèresCoporteurs}
          libellé='Autres ministères co-porteurs'
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          estEnTeteDePageChantier={false}
          estNomResponsable={responsables.directionAdmininstration}
          libellé='Direction de l’administration porteuse du projet'
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          estEnTeteDePageChantier={false}
          estNomResponsable={responsables.chefferieDeProjet}
          libellé='Chefferie de projet'
        />
        <hr className='fr-hr fr-py-1w' />
        <ResponsablesLigne
          estEnTeteDePageChantier={false}
          estNomResponsable={responsables.coporteurs}
          libellé='Co-porteur(s) du projet'
        />
      </Bloc>
    </ResponsablesPageProjetStructurantStyled>
  );
}
