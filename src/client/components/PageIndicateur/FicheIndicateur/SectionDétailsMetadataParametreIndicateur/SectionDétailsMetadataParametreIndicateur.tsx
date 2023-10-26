import Titre from '@/components/_commons/Titre/Titre';
import SectionDétailsMetadataParametreIndicateurStyled
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateur/SectionDétailsMetadataParametreIndicateur.styled';
import DétailsMetadataParametreIndicateurProps
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateur/SectionDétailsMetadataParametreIndicateur.interface';
import useDetailMetadataParametreIndicateurForm
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateur/useDetailMetadataParametreIndicateurForm';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import Input from '@/components/_commons/Input/Input';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';

export default function SectionDétailsMetadataParametreIndicateur({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
}: DétailsMetadataParametreIndicateurProps) {
  const { register, getValues, errors } = useDetailMetadataParametreIndicateurForm();

  return (
    <SectionDétailsMetadataParametreIndicateurStyled>
      <Titre
        baliseHtml='h2'
        className='fr-h5'
      >
        Détail des paramètres de l&apos;indicateur
      </Titre>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vi_dept_from.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="viDeptFrom">
                {mapInformationMetadataIndicateur.vi_dept_from.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.viDeptFrom}
                htmlName='viDeptFrom'
                options={mapInformationMetadataIndicateur.vi_dept_from.acceptedValues.map(acceptedValue => ({
                  valeur: acceptedValue.valeur,
                  libellé: acceptedValue.libellé,
                }))}
                register={register('viDeptFrom')}
                valeurSélectionnée={`${getValues('viDeptFrom')}`}
              />
            : (
              <span>
                {indicateur.viDeptFrom === '_' ? 'Aucune saisie' : 'Saisie utilisateur'}
              </span>
            )}
        </div>
        <div className="fr-col-12 fr-col-md-4 fr-pr-2w  fr-pl-2w">
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.va_dept_from.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="vaDeptFrom">
                {mapInformationMetadataIndicateur.va_dept_from.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.vaDeptFrom}
                htmlName='vaDeptFrom'
                options={mapInformationMetadataIndicateur.va_dept_from.acceptedValues.map(acceptedValue => ({
                  valeur: acceptedValue.valeur,
                  libellé: acceptedValue.libellé,
                }))}
                register={register('vaDeptFrom')}
                valeurSélectionnée={`${getValues('vaDeptFrom')}`}
              />
            : (
              <span>
                {indicateur.vaDeptFrom === '_' ? 'Aucune saisie' : 'Saisie utilisateur'}
              </span>
            )}
        </div>
        <div className="fr-col-12 fr-col-md-4 fr-pl-2w">
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vc_dept_from.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="vcDeptFrom">
                {mapInformationMetadataIndicateur.vc_dept_from.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.vcDeptFrom}
                htmlName='vcDeptFrom'
                options={mapInformationMetadataIndicateur.vc_dept_from.acceptedValues.map(acceptedValue => ({
                  valeur: acceptedValue.valeur,
                  libellé: acceptedValue.libellé,
                }))}
                register={register('vcDeptFrom')}
                valeurSélectionnée={`${getValues('vcDeptFrom')}`}
              />
            : (
              <span>
                {indicateur.vcDeptFrom === '_' ? 'Aucune saisie' : 'Saisie utilisateur'}
              </span>
            )}
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vi_dept_op.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="viDeptOp">
                {mapInformationMetadataIndicateur.vi_dept_op.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.viDeptOp}
                htmlName='viDeptOp'
                options={mapInformationMetadataIndicateur.vi_dept_op.acceptedValues.map(acceptedValue => ({
                  valeur: acceptedValue.valeur,
                  libellé: acceptedValue.libellé,
                }))}
                register={register('viDeptOp')}
                valeurSélectionnée={`${getValues('viDeptOp')}`}
              />
            : (
              <span>
                {indicateur.viDeptOp === '_' ? 'Aucune saisie' : 'Saisie utilisateur'}
              </span>
            )}
        </div>
        <div className="fr-col-12 fr-col-md-4 fr-pr-2w fr-pl-2w">
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.va_dept_op.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="vaDeptOp">
                {mapInformationMetadataIndicateur.va_dept_op.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.vaDeptOp}
                htmlName='vaDeptOp'
                options={mapInformationMetadataIndicateur.va_dept_op.acceptedValues.map(acceptedValue => ({
                  valeur: acceptedValue.valeur,
                  libellé: acceptedValue.libellé,
                }))}
                register={register('vaDeptOp')}
                valeurSélectionnée={`${getValues('vaDeptOp')}`}
              />
            : (
              <span>
                {indicateur.vaDeptOp === '_' ? 'Aucune saisie' : 'Saisie utilisateur'}
              </span>
            )}
        </div>
        <div className="fr-col-12 fr-col-md-4 fr-pl-2w">
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vc_dept_op.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="vcDeptOp">
                {mapInformationMetadataIndicateur.vc_dept_op.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.vcDeptOp}
                htmlName='vcDeptOp'
                options={mapInformationMetadataIndicateur.vc_dept_op.acceptedValues.map(acceptedValue => ({
                  valeur: acceptedValue.valeur,
                  libellé: acceptedValue.libellé,
                }))}
                register={register('vcDeptOp')}
                valeurSélectionnée={`${getValues('vcDeptOp')}`}
              />
            : (
              <span>
                {indicateur.vcDeptOp === '_' ? 'Aucune saisie' : 'Saisie utilisateur'}
              </span>
            )}
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vi_reg_from.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="viRegFrom">
                {mapInformationMetadataIndicateur.vi_reg_from.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.viRegFrom}
                htmlName='viRegFrom'
                options={mapInformationMetadataIndicateur.vi_reg_from.acceptedValues.map(acceptedValue => ({
                  valeur: acceptedValue.valeur,
                  libellé: acceptedValue.libellé,
                }))}
                register={register('viRegFrom')}
                valeurSélectionnée={`${getValues('viRegFrom')}`}
              />
            : (
              <span>
                {indicateur.viRegFrom === '_' ? 'Aucune saisie' : 'Saisie utilisateur'}
              </span>
            )}
        </div>
        <div className="fr-col-12 fr-col-md-4 fr-pr-2w  fr-pl-2w">
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.va_reg_from.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="vaRegFrom">
                {mapInformationMetadataIndicateur.va_reg_from.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.vaRegFrom}
                htmlName='vaRegFrom'
                options={mapInformationMetadataIndicateur.va_reg_from.acceptedValues.map(acceptedValue => ({
                  valeur: acceptedValue.valeur,
                  libellé: acceptedValue.libellé,
                }))}
                register={register('vaRegFrom')}
                valeurSélectionnée={`${getValues('vaRegFrom')}`}
              />
            : (
              <span>
                {indicateur.vaRegFrom === '_' ? 'Aucune saisie' : 'Saisie utilisateur'}
              </span>
            )}
        </div>
        <div className="fr-col-12 fr-col-md-4 fr-pl-2w">
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vc_reg_from.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="vcRegFrom">
                {mapInformationMetadataIndicateur.vc_reg_from.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.vcRegFrom}
                htmlName='vcRegFrom'
                options={mapInformationMetadataIndicateur.vc_reg_from.acceptedValues.map(acceptedValue => ({
                  valeur: acceptedValue.valeur,
                  libellé: acceptedValue.libellé,
                }))}
                register={register('vcRegFrom')}
                valeurSélectionnée={`${getValues('vcRegFrom')}`}
              />
            : (
              <span>
                {indicateur.vcRegFrom === '_' ? 'Aucune saisie' : 'Saisie utilisateur'}
              </span>
            )}
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vi_reg_op.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="viRegOp">
                {mapInformationMetadataIndicateur.vi_reg_op.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.viRegOp}
                htmlName='viRegOp'
                options={mapInformationMetadataIndicateur.vi_reg_op.acceptedValues.map(acceptedValue => ({
                  valeur: acceptedValue.valeur,
                  libellé: acceptedValue.libellé,
                }))}
                register={register('viRegOp')}
                valeurSélectionnée={`${getValues('viRegOp')}`}
              />
            : (
              <span>
                {indicateur.viRegOp === '_' ? 'Aucune saisie' : 'Saisie utilisateur'}
              </span>
            )}
        </div>
        <div className="fr-col-12 fr-col-md-4 fr-pr-2w  fr-pl-2w">
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.va_reg_op.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="vaRegOp">
                {mapInformationMetadataIndicateur.va_reg_op.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.vaRegOp}
                htmlName='vaRegOp'
                options={mapInformationMetadataIndicateur.va_reg_op.acceptedValues.map(acceptedValue => ({
                  valeur: acceptedValue.valeur,
                  libellé: acceptedValue.libellé,
                }))}
                register={register('vaRegOp')}
                valeurSélectionnée={`${getValues('vaRegOp')}`}
              />
            : (
              <span>
                {indicateur.vaRegOp === '_' ? 'Aucune saisie' : 'Saisie utilisateur'}
              </span>
            )}
        </div>
        <div className="fr-col-12 fr-col-md-4 fr-pl-2w">
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vc_reg_op.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="vcRegOp">
                {mapInformationMetadataIndicateur.vc_reg_op.description}
              </Infobulle>
            ) : null}

          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.vcRegOp}
                htmlName='vcRegOp'
                options={mapInformationMetadataIndicateur.vc_reg_op.acceptedValues.map(acceptedValue => ({
                  valeur: acceptedValue.valeur,
                  libellé: acceptedValue.libellé,
                }))}
                register={register('vcRegOp')}
                valeurSélectionnée={`${getValues('vcRegOp')}`}
              />
            : (
              <span>
                {indicateur.vcRegOp === '_' ? 'Aucune saisie' : 'Saisie utilisateur'}
              </span>
            )}
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vi_nat_from.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="viNatFrom">
                {mapInformationMetadataIndicateur.vi_nat_from.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.viNatFrom}
                htmlName='viNatFrom'
                options={mapInformationMetadataIndicateur.vi_nat_from.acceptedValues.map(acceptedValue => ({
                  valeur: acceptedValue.valeur,
                  libellé: acceptedValue.libellé,
                }))}
                register={register('viNatFrom')}
                valeurSélectionnée={`${getValues('viNatFrom')}`}
              />
            : (
              <span>
                {indicateur.viNatFrom === '_' ? 'Aucune saisie' : 'Saisie utilisateur'}
              </span>
            )}
        </div>
        <div className="fr-col-12 fr-col-md-4 fr-pr-2w  fr-pl-2w">
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vi_nat_op.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="viNatOp">
                {mapInformationMetadataIndicateur.vi_nat_op.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.viNatOp}
                htmlName='viNatOp'
                options={mapInformationMetadataIndicateur.vi_nat_op.acceptedValues.map(acceptedValue => ({
                  valeur: acceptedValue.valeur,
                  libellé: acceptedValue.libellé,
                }))}
                register={register('viNatOp')}
                valeurSélectionnée={`${getValues('viNatOp')}`}
              />
            : (
              <span>
                {indicateur.viNatOp === '_' ? 'Aucune saisie' : 'Saisie utilisateur'}
              </span>
            )}
        </div>
        <div className="fr-col-12 fr-col-md-4 fr-pl-2w">
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.va_nat_from.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="vaNatFrom">
                {mapInformationMetadataIndicateur.va_nat_from.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.vaNatFrom}
                htmlName='vaNatFrom'
                options={mapInformationMetadataIndicateur.va_nat_from.acceptedValues.map(acceptedValue => ({
                  valeur: acceptedValue.valeur,
                  libellé: acceptedValue.libellé,
                }))}
                register={register('vaNatFrom')}
                valeurSélectionnée={`${getValues('vaNatFrom')}`}
              />
            : (
              <span>
                {indicateur.vaNatFrom === '_' ? 'Aucune saisie' : 'Saisie utilisateur'}
              </span>
            )}
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.va_nat_op.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="vaNatOp">
                {mapInformationMetadataIndicateur.va_nat_op.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.vaNatOp}
                htmlName='vaNatOp'
                options={mapInformationMetadataIndicateur.va_nat_op.acceptedValues.map(acceptedValue => ({
                  valeur: acceptedValue.valeur,
                  libellé: acceptedValue.libellé,
                }))}
                register={register('vaNatOp')}
                valeurSélectionnée={`${getValues('vaNatOp')}`}
              />
            : (
              <span>
                {indicateur.vaNatOp === '_' ? 'Aucune saisie' : 'Saisie utilisateur'}
              </span>
            )}
        </div>
        <div className="fr-col-12 fr-col-md-4 fr-pr-2w  fr-pl-2w">
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vc_nat_from.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="vcNatFrom">
                {mapInformationMetadataIndicateur.vc_nat_from.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.vcNatFrom}
                htmlName='vcNatFrom'
                options={mapInformationMetadataIndicateur.vc_nat_from.acceptedValues.map(acceptedValue => ({
                  valeur: acceptedValue.valeur,
                  libellé: acceptedValue.libellé,
                }))}
                register={register('vcNatFrom')}
                valeurSélectionnée={`${getValues('vcNatFrom')}`}
              />
            : (
              <span>
                {indicateur.vcNatFrom === '_' ? 'Aucune saisie' : 'Saisie utilisateur'}
              </span>
            )}
        </div>
        <div className="fr-col-12 fr-col-md-4 fr-pl-2w">
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vc_nat_op.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="vcNatOp">
                {mapInformationMetadataIndicateur.vc_nat_op.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.vcNatOp}
                htmlName='vcNatOp'
                options={mapInformationMetadataIndicateur.vc_nat_op.acceptedValues.map(acceptedValue => ({
                  valeur: acceptedValue.valeur,
                  libellé: acceptedValue.libellé,
                }))}
                register={register('vcNatOp')}
                valeurSélectionnée={`${getValues('vcNatOp')}`}
              />
            : (
              <span>
                {indicateur.vcNatOp === '_' ? 'Aucune saisie' : 'Saisie utilisateur'}
              </span>
            )}
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.param_vaca_decumul_from.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="paramVacaDecumulFrom">
                {mapInformationMetadataIndicateur.param_vaca_decumul_from.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.paramVacaDecumulFrom}
                htmlName="paramVacaDecumulFrom"
                libellé="paramVacaDecumulFrom"
                register={register('paramVacaDecumulFrom', { value: indicateur?.paramVacaDecumulFrom })}
                type="text"
              />
            : (
              <span>
                {indicateur.paramVacaDecumulFrom || 'Non renseigné'}
              </span>
            )}

        </div>
        <div className="fr-col-12 fr-col-md-4 fr-pr-2w fr-pl-2w">
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.param_vaca_partition_date.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="paramVacaPartitionDate">
                {mapInformationMetadataIndicateur.param_vaca_partition_date.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.paramVacaPartitionDate}
                htmlName="paramVacaPartitionDate"
                libellé="paramVacaPartitionDate"
                register={register('paramVacaPartitionDate', { value: indicateur?.paramVacaPartitionDate })}
                type="text"
              />
            : (
              <span>
                {indicateur.paramVacaPartitionDate || 'Non renseigné'}
              </span>
            )}
        </div>
        <div className="fr-col-12 fr-col-md-4 fr-pl-2w">
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.param_vaca_op.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="paramVacaOp">
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
                {indicateur.paramVacaOp === '_' ? 'Aucune saisie' : 'Saisie utilisateur'}
              </span>
            )}
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.param_vacg_decumul_from.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="paramVacgDecumulFrom">
                {mapInformationMetadataIndicateur.param_vacg_decumul_from.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.paramVacgDecumulFrom}
                htmlName="paramVacgDecumulFrom"
                libellé="paramVacgDecumulFrom"
                register={register('paramVacgDecumulFrom', { value: indicateur?.paramVacgDecumulFrom })}
                type="text"
              />
            : (
              <span>
                {indicateur.paramVacgDecumulFrom || 'Non renseigné'}
              </span>
            )}
        </div>
        <div className="fr-col-12 fr-col-md-4 fr-pr-2w  fr-pl-2w">
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.param_vacg_partition_date.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="paramVacgPartitionDate">
                {mapInformationMetadataIndicateur.param_vacg_partition_date.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.paramVacgPartitionDate}
                htmlName="paramVacgPartitionDate"
                libellé="paramVacgPartitionDate"
                register={register('paramVacgPartitionDate', { value: indicateur?.paramVacgPartitionDate })}
                type="text"
              />
            : (
              <span>
                {indicateur.paramVacgPartitionDate || 'Non renseigné'}
              </span>
            )}
        </div>
        <div className="fr-col-12 fr-col-md-4 fr-pl-2w">
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.param_vacg_op.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="paramVacgOp">
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
                {indicateur.paramVacgOp === '_' ? 'Aucune saisie' : 'Saisie utilisateur'}
              </span>
            )}
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.poids_pourcent_dept.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="poidsPourcentDept">
                {mapInformationMetadataIndicateur.poids_pourcent_dept.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.poidsPourcentDept}
                htmlName="poidsPourcentDept"
                key="poidsPourcentDept"
                libellé="poidsPourcentDept"
                register={register('poidsPourcentDept', { value: indicateur?.poidsPourcentDept })}
                type="number"
              />
            : (
              <span>
                {indicateur.poidsPourcentDept}
              </span>
            )}
        </div>
        <div className="fr-col-12 fr-col-md-4 fr-pr-2w  fr-pl-2w">
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.poids_pourcent_reg.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="poidsPourcentReg">
                {mapInformationMetadataIndicateur.poids_pourcent_reg.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.poidsPourcentReg}
                htmlName="poidsPourcentReg"
                key="poidsPourcentReg"
                libellé="poidsPourcentReg"
                register={register('poidsPourcentReg', { value: indicateur?.poidsPourcentReg })}
                type="number"
              />
            : (
              <span>
                {indicateur.poidsPourcentReg}
              </span>
            )}
        </div>
        <div className="fr-col-12 fr-col-md-4 fr-pl-2w">
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.poids_pourcent_nat.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="poidsPourcentNat">
                {mapInformationMetadataIndicateur.poids_pourcent_nat.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.poidsPourcentNat}
                htmlName="poidsPourcentNat"
                key="poidsPourcentNat"
                libellé="poidsPourcentNat"
                register={register('poidsPourcentNat', { value: indicateur?.poidsPourcentNat })}
                type="number"
              />
            : (
              <span>
                {indicateur.poidsPourcentNat}
              </span>
            )}
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.tendance.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="tendance">
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
    </SectionDétailsMetadataParametreIndicateurStyled>
  );
}







