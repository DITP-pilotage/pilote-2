import Titre from '@/components/_commons/Titre/Titre';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import useDétailsMetadataParametreIndicateurNationaleForm
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurNationale/useDétailsMetadataParametreIndicateurNationaleForm';
import SectionDétailsMetadataParametreIndicateurNationaleStyled
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurNationale/SectionDétailsMetadataParametreIndicateurNationale.styled';
import { MapInformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';

export default function SectionDétailsMetadataParametreIndicateurNationale({
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
}: {
  estEnCoursDeModification: boolean
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat
}) {
  const { register, getValues, errors } = useDétailsMetadataParametreIndicateurNationaleForm();

  return (
    <SectionDétailsMetadataParametreIndicateurNationaleStyled>
      <Titre
        baliseHtml='h2'
        className='fr-h5'
      >
        Paramétrages - Maille nationale
      </Titre>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vi_nat_from.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='viNatFrom'>
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
                {mapInformationMetadataIndicateur.vi_nat_from.acceptedValues.find(acceptedValue => acceptedValue.valeur === getValues('viNatFrom'))?.libellé}
              </span>
            )}
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pl-2w fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.va_nat_from.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='vaNatFrom'>
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
                {mapInformationMetadataIndicateur.va_nat_from.acceptedValues.find(acceptedValue => acceptedValue.valeur === getValues('vaNatFrom'))?.libellé}
              </span>
            )}
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vc_nat_from.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='vcNatFrom'>
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
                {mapInformationMetadataIndicateur.vc_nat_from.acceptedValues.find(acceptedValue => acceptedValue.valeur === getValues('vcNatFrom'))?.libellé}
              </span>
            )}
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vi_nat_op.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='viNatOp'>
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
                {mapInformationMetadataIndicateur.vi_nat_op.acceptedValues.find(acceptedValue => acceptedValue.valeur === getValues('viNatOp'))?.libellé}
              </span>
            )}
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pl-2w fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.va_nat_op.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='vaNatOp'>
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
                {mapInformationMetadataIndicateur.va_nat_op.acceptedValues.find(acceptedValue => acceptedValue.valeur === getValues('vaNatOp'))?.libellé}
              </span>
            )}
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.vc_nat_op.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='vcNatOp'>
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
                {mapInformationMetadataIndicateur.vc_nat_op.acceptedValues.find(acceptedValue => acceptedValue.valeur === getValues('vcNatOp'))?.libellé}
              </span>
            )}
        </div>
      </div>
      <hr className='fr-hr fr-mt-3w' />
    </SectionDétailsMetadataParametreIndicateurNationaleStyled>
  );
}







