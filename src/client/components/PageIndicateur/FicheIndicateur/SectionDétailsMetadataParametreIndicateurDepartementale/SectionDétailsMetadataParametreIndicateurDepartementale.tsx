import Titre from '@/components/_commons/Titre/Titre';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import SectionDétailsMetadataParametreIndicateurDepartementaleStyled
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurDepartementale/SectionDétailsMetadataParametreIndicateurDepartementale.styled';
import useDétailsMetadataParametreIndicateurDepartementaleForm
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurDepartementale/useDétailsMetadataParametreIndicateurDepartementaleForm';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import { MapInformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';

export default function SectionDétailsMetadataParametreIndicateurDepartementale({
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
}: {
  indicateur: MetadataParametrageIndicateurContrat
  estEnCoursDeModification: boolean
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat
}) {
  const { register, getValues, errors } = useDétailsMetadataParametreIndicateurDepartementaleForm();

  return (
    <SectionDétailsMetadataParametreIndicateurDepartementaleStyled>
      <Titre
        baliseHtml='h2'
        className='fr-h5'
      >
        Paramétrages - Maille départementale
      </Titre>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vi_dept_from.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='viDeptFrom'>
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
                {mapInformationMetadataIndicateur.vi_dept_from.acceptedValues.find(acceptedValue => acceptedValue.valeur === getValues('viDeptFrom'))?.libellé}
              </span>
            )}
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w  fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.va_dept_from.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='vaDeptFrom'>
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
                {mapInformationMetadataIndicateur.va_dept_from.acceptedValues.find(acceptedValue => acceptedValue.valeur === getValues('vaDeptFrom'))?.libellé}
              </span>
            )}
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vc_dept_from.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='vcDeptFrom'>
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
                {mapInformationMetadataIndicateur.vc_dept_from.acceptedValues.find(acceptedValue => acceptedValue.valeur === getValues('vcDeptFrom'))?.libellé}
              </span>
            )}
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vi_dept_op.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='viDeptOp'>
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
                {mapInformationMetadataIndicateur.vi_dept_op.acceptedValues.find(acceptedValue => acceptedValue.valeur === getValues('viDeptOp'))?.libellé}
              </span>
            )}
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.va_dept_op.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='vaDeptOp'>
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
                {mapInformationMetadataIndicateur.va_dept_op.acceptedValues.find(acceptedValue => acceptedValue.valeur === getValues('vaDeptOp'))?.libellé}
              </span>
            )}
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vc_dept_op.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='vcDeptOp'>
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
                {mapInformationMetadataIndicateur.vc_dept_op.acceptedValues.find(acceptedValue => acceptedValue.valeur === getValues('vcDeptOp'))?.libellé}
              </span>
            )}
        </div>
      </div>
      <hr className='fr-hr fr-mt-3w' />
    </SectionDétailsMetadataParametreIndicateurDepartementaleStyled>
  );
}







