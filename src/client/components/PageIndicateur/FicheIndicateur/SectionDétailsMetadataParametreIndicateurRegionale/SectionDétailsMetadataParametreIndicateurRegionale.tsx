import Titre from '@/components/_commons/Titre/Titre';
import SectionDétailsMetadataParametreCalculIndicateurStyled
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreCalculIndicateur/SectionDétailsMetadataParametreCalculIndicateur.styled';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import useDétailsMetadataParametreIndicateurRegionaleForm
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurRegionale/useDétailsMetadataParametreIndicateurRegionaleForm';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import { MapInformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';

export default function SectionDétailsMetadataParametreIndicateurRegionale({
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
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vi_reg_from.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='viRegFrom'>
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
                {mapInformationMetadataIndicateur.vi_reg_from.acceptedValues.find(acceptedValue => acceptedValue.valeur === getValues('viRegFrom'))?.libellé}
              </span>
            )}
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w  fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.va_reg_from.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='vaRegFrom'>
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
                {mapInformationMetadataIndicateur.va_reg_from.acceptedValues.find(acceptedValue => acceptedValue.valeur === getValues('vaRegFrom'))?.libellé}
              </span>
            )}
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vc_reg_from.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='vcRegFrom'>
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
                {mapInformationMetadataIndicateur.vc_reg_from.acceptedValues.find(acceptedValue => acceptedValue.valeur === getValues('vcRegFrom'))?.libellé}
              </span>
            )}
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vi_reg_op.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='viRegOp'>
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
                {mapInformationMetadataIndicateur.vi_reg_op.acceptedValues.find(acceptedValue => acceptedValue.valeur === getValues('viRegOp'))?.libellé}
              </span>
            )}
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w  fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.va_reg_op.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='vaRegOp'>
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
                {mapInformationMetadataIndicateur.va_reg_op.acceptedValues.find(acceptedValue => acceptedValue.valeur === getValues('vaRegOp'))?.libellé}
              </span>
            )}
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vc_reg_op.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='vcRegOp'>
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
                {mapInformationMetadataIndicateur.vc_reg_op.acceptedValues.find(acceptedValue => acceptedValue.valeur === getValues('vcRegOp'))?.libellé}
              </span>
            )}
        </div>
      </div>
      <hr className='fr-hr fr-mt-3w' />
    </SectionDétailsMetadataParametreCalculIndicateurStyled>
  );
}







