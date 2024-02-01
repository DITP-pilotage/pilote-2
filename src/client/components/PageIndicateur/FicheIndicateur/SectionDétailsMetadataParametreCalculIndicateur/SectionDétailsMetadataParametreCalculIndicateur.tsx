import Titre from '@/components/_commons/Titre/Titre';
import SectionDétailsMetadataParametreCalculIndicateurStyled
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreCalculIndicateur/SectionDétailsMetadataParametreCalculIndicateur.styled';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import Input from '@/components/_commons/Input/Input';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import useDétailsMetadataParametreCalculIndicateurForm
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreCalculIndicateur/useDétailsMetadataParametreCalculIndicateurForm';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import { MapInformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';

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
          <div className='fr-text--md bold fr-mb-1v relative flex items-center'>
            <p className='titre-input-metadata overflow-ellipsis'>
              {mapInformationMetadataIndicateur.param_vaca_decumul_from.metaPiloteAlias}
            </p>
            {estEnCoursDeModification ? (
              <Infobulle idHtml='paramVacaDecumulFrom'>
                {mapInformationMetadataIndicateur.param_vaca_decumul_from.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.paramVacaDecumulFrom}
                htmlName='paramVacaDecumulFrom'
                libellé='paramVacaDecumulFrom'
                register={register('paramVacaDecumulFrom', { value: indicateur?.paramVacaDecumulFrom })}
                type='text'
              />
            : (
              <span>
                {indicateur.paramVacaDecumulFrom || '_'}
              </span>
            )}

        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative flex items-center'>
            <p className='titre-input-metadata overflow-ellipsis'>
              {mapInformationMetadataIndicateur.param_vaca_partition_date.metaPiloteAlias}
            </p>
            {estEnCoursDeModification ? (
              <Infobulle idHtml='paramVacaPartitionDate'>
                {mapInformationMetadataIndicateur.param_vaca_partition_date.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.paramVacaPartitionDate}
                htmlName='paramVacaPartitionDate'
                libellé='paramVacaPartitionDate'
                register={register('paramVacaPartitionDate', { value: indicateur?.paramVacaPartitionDate })}
                type='text'
              />
            : (
              <span>
                {indicateur.paramVacaPartitionDate || '_'}
              </span>
            )}
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative flex items-center'>
            <p className='titre-input-metadata overflow-ellipsis'>
              {mapInformationMetadataIndicateur.param_vaca_op.metaPiloteAlias}
            </p>
            {estEnCoursDeModification ? (
              <Infobulle idHtml='paramVacaOp'>
                {mapInformationMetadataIndicateur.param_vaca_op.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.paramVacaOp}
                htmlName='paramVacaOp'
                options={mapInformationMetadataIndicateur.param_vaca_op.acceptedValues.map(acceptedValue => ({
                  valeur: acceptedValue.valeur,
                  libellé: acceptedValue.libellé,
                }))}
                register={register('paramVacaOp')}
                valeurSélectionnée={`${getValues('paramVacaOp')}`}
              />
            : (
              <span>
                {mapInformationMetadataIndicateur.param_vaca_op.acceptedValues.find(acceptedValue => acceptedValue.valeur === getValues('paramVacaOp'))?.libellé}
              </span>
            )}
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative flex items-center'>
            <p className='titre-input-metadata overflow-ellipsis'>
              {mapInformationMetadataIndicateur.param_vacg_decumul_from.metaPiloteAlias}
            </p>
            {estEnCoursDeModification ? (
              <Infobulle idHtml='paramVacgDecumulFrom'>
                {mapInformationMetadataIndicateur.param_vacg_decumul_from.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.paramVacgDecumulFrom}
                htmlName='paramVacgDecumulFrom'
                libellé='paramVacgDecumulFrom'
                register={register('paramVacgDecumulFrom', { value: indicateur?.paramVacgDecumulFrom })}
                type='text'
              />
            : (
              <span>
                {indicateur.paramVacgDecumulFrom || '_'}
              </span>
            )}
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w  fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative flex items-center'>
            <p className='titre-input-metadata overflow-ellipsis'>
              {mapInformationMetadataIndicateur.param_vacg_partition_date.metaPiloteAlias}
            </p>
            {estEnCoursDeModification ? (
              <Infobulle idHtml='paramVacgPartitionDate'>
                {mapInformationMetadataIndicateur.param_vacg_partition_date.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.paramVacgPartitionDate}
                htmlName='paramVacgPartitionDate'
                libellé='paramVacgPartitionDate'
                register={register('paramVacgPartitionDate', { value: indicateur?.paramVacgPartitionDate })}
                type='text'
              />
            : (
              <span>
                {indicateur.paramVacgPartitionDate || '_'}
              </span>
            )}
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative flex items-center'>
            <p className='titre-input-metadata overflow-ellipsis'>
              {mapInformationMetadataIndicateur.param_vacg_op.metaPiloteAlias}
            </p>
            {estEnCoursDeModification ? (
              <Infobulle idHtml='paramVacgOp'>
                {mapInformationMetadataIndicateur.param_vacg_op.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.paramVacgOp}
                htmlName='paramVacgOp'
                options={mapInformationMetadataIndicateur.param_vacg_op.acceptedValues.map(acceptedValue => ({
                  valeur: acceptedValue.valeur,
                  libellé: acceptedValue.libellé,
                }))}
                register={register('paramVacgOp')}
                valeurSélectionnée={`${getValues('paramVacgOp')}`}
              />
            : (
              <span>
                {mapInformationMetadataIndicateur.param_vacg_op.acceptedValues.find(acceptedValue => acceptedValue.valeur === getValues('paramVacgOp'))?.libellé}
              </span>
            )}
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative flex items-center'>
            <p className='titre-input-metadata overflow-ellipsis'>
              {mapInformationMetadataIndicateur.tendance.metaPiloteAlias}
            </p>
            {estEnCoursDeModification ? (
              <Infobulle idHtml='tendance'>
                {mapInformationMetadataIndicateur.tendance.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.tendance}
                htmlName='tendance'
                options={[{ libellé: 'Hausse', valeur: 'HAUSSE' }, { libellé: 'Baisse', valeur: 'BAISSE' }]}
                register={register('tendance')}
                valeurSélectionnée={`${getValues('tendance')}`}
              />
            : (
              <span>
                {indicateur.tendance === 'HAUSSE' ? 'Hausse' : 'Baisse'}
              </span>
            )}
        </div>
      </div>
      <hr className='fr-hr fr-mt-3w' />
    </SectionDétailsMetadataParametreCalculIndicateurStyled>
  );
}







