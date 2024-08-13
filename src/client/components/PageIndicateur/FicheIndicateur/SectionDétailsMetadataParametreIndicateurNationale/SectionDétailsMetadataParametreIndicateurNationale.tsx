import { FunctionComponent } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import useDétailsMetadataParametreIndicateurNationaleForm
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurNationale/useDétailsMetadataParametreIndicateurNationaleForm';
import SectionDétailsMetadataParametreIndicateurNationaleStyled
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurNationale/SectionDétailsMetadataParametreIndicateurNationale.styled';
import { MapInformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import {
  MetadataIndicateurSelecteur,
} from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurSelecteur';
import {
  mappingAcceptedValues,
  mappingDisplayAcceptedValues,
} from '@/components/PageIndicateur/FicheIndicateur/commons/utils';

const SectionDétailsMetadataParametreIndicateurNationale: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat
  estEnCoursDeModification: boolean
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat
}> = ({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
}) => {
  const { register, getValues, errors } = useDétailsMetadataParametreIndicateurNationaleForm();

  return (
    <SectionDétailsMetadataParametreIndicateurNationaleStyled>
      <Titre
        baliseHtml='h2'
        className='fr-h5'
      >
        Paramétrages - Maille nationale
      </Titre>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.viNatFrom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vi_nat_from}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_nat_from')}
            register={register('viNatFrom')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_nat_from', 'viNatFrom')}
            values={getValues('viNatFrom')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.vaNatFrom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.va_nat_from}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_nat_from')}
            register={register('vaNatFrom')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_nat_from', 'vaNatFrom')}
            values={getValues('vaNatFrom')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.vcNatFrom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vc_nat_from}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vc_nat_from')}
            register={register('vcNatFrom')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vc_nat_from', 'vcNatFrom')}
            values={getValues('vcNatFrom')}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.viNatOp?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vi_nat_op}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_nat_op')}
            register={register('viNatOp')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_nat_op', 'viNatOp')}
            values={getValues('viNatOp')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.vaNatOp?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.va_nat_op}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_nat_op')}
            register={register('vaNatOp')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_nat_op', 'vaNatOp')}
            values={getValues('vaNatOp')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.vcNatOp?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vc_nat_op}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vc_nat_op')}
            register={register('vcNatOp')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vc_nat_op', 'vcNatOp')}
            values={getValues('vcNatOp')}
          />
        </div>
      </div>
      <hr className='fr-hr fr-mt-3w' />
    </SectionDétailsMetadataParametreIndicateurNationaleStyled>
  );
};

export default SectionDétailsMetadataParametreIndicateurNationale;
