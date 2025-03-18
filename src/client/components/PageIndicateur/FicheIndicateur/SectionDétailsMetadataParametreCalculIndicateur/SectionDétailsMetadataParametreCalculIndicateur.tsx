import { FunctionComponent } from 'react';
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

const SectionDétailsMetadataParametreCalculIndicateur: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat
  estEnCoursDeModification: boolean
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat
}> = ({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
}) => {
  const { register, getValues, errors, setValue } = useDétailsMetadataParametreCalculIndicateurForm();

  return (
    <SectionDétailsMetadataParametreCalculIndicateurStyled>
      <Titre
        baliseHtml='h2'
        className='fr-h5'
      >
        Calcul de la valeur d'avancement
      </Titre>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.paramVacaDecumulFrom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.param_vaca_decumul_from}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vaca_decumul_from')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vaca_decumul_from', 'paramVacaDecumulFrom')}
            valeurModifiéeCallback={(valeur) => {
              setValue('paramVacgDecumulFrom', valeur);
              setValue('paramVacaDecumulFrom', valeur);
            }}
            values={getValues('paramVacaDecumulFrom')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.paramVacaPartitionDate?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.param_vaca_partition_date}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vaca_partition_date')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vaca_partition_date', 'paramVacaPartitionDate')}
            valeurModifiéeCallback={(valeur) => {
              setValue('paramVacaPartitionDate', valeur);
              setValue('paramVacgPartitionDate', valeur);
              setValue('paramVacaOp', valeur === '_' ? 'current_value' : 'sum');
              setValue('paramVacgOp', valeur === '_' ? 'current_value' : 'sum');
            }}
            values={getValues('paramVacaPartitionDate')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.paramVacaOp?.message}
            estDesactive
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.param_vaca_op}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vaca_op')}
            register={register('paramVacaOp')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vaca_op', 'paramVacaOp')}
            values={getValues('paramVacaOp')}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.paramVacgDecumulFrom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.param_vacg_decumul_from}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vacg_decumul_from')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vacg_decumul_from', 'paramVacgDecumulFrom')}
            valeurModifiéeCallback={(valeur) => {
              setValue('paramVacgDecumulFrom', valeur);
              setValue('paramVacaDecumulFrom', valeur);
            }}
            values={getValues('paramVacgDecumulFrom')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.paramVacgPartitionDate?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.param_vacg_partition_date}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vacg_partition_date')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vacg_partition_date', 'paramVacgPartitionDate')}
            valeurModifiéeCallback={(valeur) => {
              setValue('paramVacaPartitionDate', valeur);
              setValue('paramVacaOp', valeur === '_' ? 'current_value' : 'sum');
              setValue('paramVacgPartitionDate', valeur);
              setValue('paramVacgOp', valeur === '_' ? 'current_value' : 'sum');
            }}
            values={getValues('paramVacgPartitionDate')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.paramVacgOp?.message}
            estDesactive
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.param_vacg_op}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vacg_op')}
            register={register('paramVacgOp')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'param_vacg_op', 'paramVacgOp')}
            values={getValues('paramVacgOp')}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-4'>

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
};

export default SectionDétailsMetadataParametreCalculIndicateur;
