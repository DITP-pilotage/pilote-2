import Titre from '@/components/_commons/Titre/Titre';
import SectionDétailsMetadataIndicateurProps
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataIndicateur/SectionDétailsMetadataIndicateur.interface';
import SectionDétailsMetadataIndicateurStyled
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataIndicateur/SectionDétailsMetadataIndicateur.styled';
import useDetailMetadataIndicateurForm
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataIndicateur/useDetailMetadataIndicateurForm';
import TextArea from '@/components/_commons/TextArea/TextArea';
import Input from '@/components/_commons/Input/Input';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';

export default function SectionDétailsMetadataIndicateur({ indicateur, estEnCoursDeModification, mapInformationMetadataIndicateur, chantiers }: SectionDétailsMetadataIndicateurProps) {
  const { register, getValues, errors, metadataIndicateurs, optionsIndicateurParent } = useDetailMetadataIndicateurForm();

  return (
    <SectionDétailsMetadataIndicateurStyled>
      <Titre
        baliseHtml='h2'
        className='fr-h5'
      >
        Identité indicateur
      </Titre>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <p className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.indic_nom.metaPiloteAlias}
          </p>
          {estEnCoursDeModification
            ? <TextArea
                erreur={errors.indicNom}
                htmlName='indicNom'
                libellé='indicNom'
                register={register('indicNom', { value: indicateur?.indicNom })}
              />
            : (
              <span>
                { indicateur.indicNom || 'Non renseigné'}
              </span>
            )}

        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.indic_descr.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='indicDescr'>
                {mapInformationMetadataIndicateur.indic_descr.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <TextArea
                erreur={errors.indicDescr}
                htmlName='indicDescr'
                libellé='indicDescr'
                register={register('indicDescr', { value: indicateur?.indicDescr })}
              />
            : (
              <span>
                {indicateur.indicDescr || 'Non renseigné'}
              </span>
            )}

        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.indic_parent_ch.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='indicParentCh'>
                {mapInformationMetadataIndicateur.indic_parent_ch.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.indicParentCh}
                htmlName='indicParentCh'
                options={[{ valeur: '_', libellé: 'Aucun chantier selectionné' }, ...chantiers.map(chantier => ({
                  valeur: chantier.id,
                  libellé: `${chantier.id} - ${chantier.nom}`,
                }))]}
                register={register('indicParentCh')}
                valeurSélectionnée={`${getValues('indicParentCh') || '_'}`}
              />
            : (
              <span>
                {`${indicateur.indicParentCh} - ${chantiers.find(chantier => chantier.id === indicateur.indicParentCh)?.nom}`}
              </span>
            )}
        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <p className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.indic_parent_indic.metaPiloteAlias}
          </p>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.indicParentIndic}
                htmlName='indicParentIndic'
                options={optionsIndicateurParent}
                register={register('indicParentIndic')}
                valeurSélectionnée={`${getValues('indicParentIndic') || '_'}`}
              />
            : (indicateur.indicParentIndic ? (
              <span>
                {`${indicateur.indicParentIndic} - ${metadataIndicateurs.find(metadataIndicateur => metadataIndicateur.indicId === indicateur.indicParentIndic)?.indicNom}`}
              </span>
            ) : (
              <span>
                Pas d&apos;indicateur parent
              </span>
            )
            )}
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <p className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.indic_schema.metaPiloteAlias}
          </p>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.indicSchema}
                htmlName='indicSchema'
                options={mapInformationMetadataIndicateur.indic_schema.acceptedValues.map(acceptedValue => ({ valeur: acceptedValue.valeur, libellé: acceptedValue.libellé }))}
                register={register('indicSchema')}
                valeurSélectionnée={`${getValues('indicSchema')}`}
              />
            : (
              <span>
                { mapInformationMetadataIndicateur.indic_schema.acceptedValues.find(acceptedValue => acceptedValue.valeur === indicateur.indicSchema)?.libellé || 'Non renseigné'}
              </span>
            )}
        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.indic_type.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='indicType'>
                {mapInformationMetadataIndicateur.indic_type.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.indicType}
                htmlName='indicType'
                options={mapInformationMetadataIndicateur.indic_type.acceptedValues.map(acceptedValue => ({ valeur: acceptedValue.valeur, libellé: acceptedValue.libellé }))}
                register={register('indicType')}
                valeurSélectionnée={`${getValues('indicType')}`}
              />
            : (
              <span>
                { mapInformationMetadataIndicateur.indic_type.acceptedValues.find(acceptedValue => acceptedValue.valeur === indicateur.indicType)?.libellé || 'Non renseigné'}
              </span>
            )}

        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <p className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.indic_unite.metaPiloteAlias}
          </p>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.indicUnite}
                htmlName='indicUnite'
                libellé='indicUnite'
                register={register('indicUnite', { value: indicateur?.indicUnite })}
                type='text'
              />
            : (
              <span>
                {indicateur.indicUnite || 'Non renseigné'}
              </span>
            )}
        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <p className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.zg_applicable.metaPiloteAlias}
          </p>
          {estEnCoursDeModification 
            ? <Input
                erreur={errors.zgApplicable}
                htmlName='zgApplicable'
                libellé='zgApplicable'
                register={register('zgApplicable', { value: indicateur?.zgApplicable })}
                type='text'
              />
            : (
              <span>
                {indicateur.zgApplicable || 'Non renseigné'}
              </span>
            )}
        </div>
      </div>
      <hr className='fr-hr fr-mt-3w' />
    </SectionDétailsMetadataIndicateurStyled>
  );
}
