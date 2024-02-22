import Titre from '@/components/_commons/Titre/Titre';
import SectionDétailsMetadataParametreCalculIndicateurStyled
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreCalculIndicateur/SectionDétailsMetadataParametreCalculIndicateur.styled';
import useDétailsMetadataParametreCalculIndicateurForm
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreCalculIndicateur/useDétailsMetadataParametreCalculIndicateurForm';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import { MapInformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import {
  MetadataIndicateurSelecteur,
} from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurSelecteur';
import {
  mappingAcceptedValues,
  mappingDisplayAcceptedValues,
} from '@/components/PageIndicateur/FicheIndicateur/commons/utils';

export default function SectionDétailsMetadataParametreCalculIndicateur({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
}: {
  indicateur: MetadataParametrageIndicateurContrat
  estEnCoursDeModification: boolean
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat
}) {
  const { register, getValues, errors } = useDétailsMetadataParametreCalculIndicateurForm();

  return (
    <SectionDétailsMetadataParametreCalculIndicateurStyled>
      <Titre
        baliseHtml='h2'
        className='fr-h5'
      >
        Paramétrages - Calcul de la valeur actuelle
      </Titre>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.paramVacaDecumulFrom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.param_vaca_decumul_from}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vaca_decumul_from')}
            register={register('paramVacaDecumulFrom', { value: indicateur?.paramVacaDecumulFrom })}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vaca_decumul_from', 'paramVacaDecumulFrom')}
            values={getValues('paramVacaDecumulFrom')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w fr-pl-2w'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.paramVacaPartitionDate?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.param_vaca_partition_date}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vaca_partition_date')}
            register={register('paramVacaPartitionDate', { value: indicateur?.paramVacaPartitionDate })}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vaca_partition_date', 'paramVacaPartitionDate')}
            values={getValues('paramVacaPartitionDate')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pl-2w'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.paramVacaOp?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.param_vaca_op}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vaca_op')}
            register={register('paramVacaOp')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vaca_op', 'paramVacaOp')}
            values={getValues('paramVacaOp')}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.paramVacgDecumulFrom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.param_vacg_decumul_from}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vacg_decumul_from')}
            register={register('paramVacgDecumulFrom', { value: indicateur?.paramVacgDecumulFrom })}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vacg_decumul_from', 'paramVacgDecumulFrom')}
            values={getValues('paramVacgDecumulFrom')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w  fr-pl-2w'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.paramVacgPartitionDate?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.param_vacg_partition_date}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vacg_partition_date')}
            register={register('paramVacgPartitionDate', { value: indicateur?.paramVacgPartitionDate })}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vacg_partition_date', 'paramVacgPartitionDate')}
            values={getValues('paramVacgPartitionDate')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pl-2w'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.paramVacgOp?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.param_vacg_op}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vacg_op')}
            register={register('paramVacgOp')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vacg_op', 'paramVacgOp')}
            values={getValues('paramVacgOp')}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>

          <MetadataIndicateurSelecteur
            erreurMessage={errors.tendance?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.tendance}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'tendance')}
            register={register('tendance')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'tendance', 'tendance')}
            values={getValues('tendance')}
          />
        </div>
      </div>
      <hr className='fr-hr fr-mt-3w' />
    </SectionDétailsMetadataParametreCalculIndicateurStyled>
  );
}







