import Titre from '@/components/_commons/Titre/Titre';
import SectionDétailsMetadataParametreCalculIndicateurStyled
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreCalculIndicateur/SectionDétailsMetadataParametreCalculIndicateur.styled';
import useDétailsMetadataParametreIndicateurRegionaleForm
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurRegionale/useDétailsMetadataParametreIndicateurRegionaleForm';
import { MapInformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import {
  MetadataIndicateurSelecteur,
} from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurSelecteur';
import {
  mappingAcceptedValues,
  mappingDisplayAcceptedValues,
} from '@/components/PageIndicateur/FicheIndicateur/commons/utils';

export default function SectionDétailsMetadataParametreIndicateurRegionale({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
}: {
  indicateur: MetadataParametrageIndicateurContrat
  estEnCoursDeModification: boolean
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat
}) {
  const { register, getValues, errors } = useDétailsMetadataParametreIndicateurRegionaleForm();

  return (
    <SectionDétailsMetadataParametreCalculIndicateurStyled>
      <Titre
        baliseHtml='h2'
        className='fr-h5'
      >
        Paramétrages - Maille régionale
      </Titre>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <MetadataIndicateurSelecteur
            errorMessage={errors.viRegFrom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vi_reg_from}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_reg_from')}
            register={register('viRegFrom')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_reg_from', 'viRegFrom')}
            values={getValues('viRegFrom')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w  fr-pl-2w'>
          <MetadataIndicateurSelecteur
            errorMessage={errors.vaRegFrom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.va_reg_from}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_reg_from')}
            register={register('vaRegFrom')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_reg_from', 'vaRegFrom')}
            values={getValues('vaRegFrom')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pl-2w'>
          <MetadataIndicateurSelecteur
            errorMessage={errors.vcRegFrom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vc_reg_from}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vc_reg_from')}
            register={register('vcRegFrom')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vc_reg_from', 'vcRegFrom')}
            values={getValues('vcRegFrom')}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <MetadataIndicateurSelecteur
            errorMessage={errors.viRegOp?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vi_reg_op}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_reg_op')}
            register={register('viRegOp')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_reg_op', 'viRegOp')}
            values={getValues('viRegOp')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w  fr-pl-2w'>
          <MetadataIndicateurSelecteur
            errorMessage={errors.vaRegOp?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.va_reg_op}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_reg_op')}
            register={register('vaRegOp')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_reg_op', 'vaRegOp')}
            values={getValues('vaRegOp')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pl-2w'>
          <MetadataIndicateurSelecteur
            errorMessage={errors.vcRegOp?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vc_reg_op}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vc_reg_op')}
            register={register('vcRegOp')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vc_reg_op', 'vcRegOp')}
            values={getValues('vcRegOp')}
          />
        </div>
      </div>
      <hr className='fr-hr fr-mt-3w' />
    </SectionDétailsMetadataParametreCalculIndicateurStyled>
  );
}







