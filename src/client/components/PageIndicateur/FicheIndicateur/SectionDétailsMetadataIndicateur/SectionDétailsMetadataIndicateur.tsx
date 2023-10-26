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

export default function SectionDétailsMetadataIndicateur({ indicateur, estEnCoursDeModification, mapInformationMetadataIndicateur }: SectionDétailsMetadataIndicateurProps) {
  const { register, getValues, errors } = useDetailMetadataIndicateurForm();
  return (
    <SectionDétailsMetadataIndicateurStyled>
      <Titre
        baliseHtml='h2'
        className='fr-h5'
      >
        Détail de l&apos;indicateur 
      </Titre>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <p className='fr-text--md bold fr-mb-1v'>
            {mapInformationMetadataIndicateur.indic_nom.metaPiloteAlias}
          </p>
          {estEnCoursDeModification
            ? <TextArea
                erreur={errors.indicNom}
                htmlName="indicNom"
                libellé="indicNom"
                register={register('indicNom', { value: indicateur?.indicNom })}
              />
            : (
              <span>
                { indicateur.indicNom || 'Non renseigné'}
              </span>
            )}

        </div>
        <div className="fr-col-12 fr-col-md-6 fr-pl-2w">
          <p className='fr-text--md bold fr-mb-1v'>
            {mapInformationMetadataIndicateur.indic_descr.metaPiloteAlias}
          </p>
          {estEnCoursDeModification
            ? <TextArea
                erreur={errors.indicDescr}
                htmlName="indicDescr"
                libellé="indicDescr"
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
          <p className='fr-text--md bold fr-mb-1v'>
            {mapInformationMetadataIndicateur.indic_parent_indic.metaPiloteAlias}
          </p>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.indicParentIndic}
                htmlName="indicParentIndic"
                libellé="indicParentIndic"
                register={register('indicParentIndic', { value: indicateur?.indicParentIndic })}
                type="text"
              />
            : (
              <span>
                {indicateur.indicParentIndic || 'Non renseigné'}
              </span>
            )}
        </div>
        <div className="fr-col-12 fr-col-md-6 fr-pl-2w">
          <p className='fr-text--md bold fr-mb-1v'>
            {mapInformationMetadataIndicateur.indic_parent_ch.metaPiloteAlias}
          </p>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.indicParentCh}
                htmlName="indicParentCh"
                libellé="indicParentCh"
                register={register('indicParentCh', { value: indicateur?.indicParentCh })}
                type="text"
              />
            : (
              <span>
                {indicateur.indicParentCh || 'Non renseigné'}
              </span>
            )}

        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <p className='fr-text--md bold fr-mb-1v'>
            {mapInformationMetadataIndicateur.indic_is_perseverant.metaPiloteAlias}
          </p>
          {estEnCoursDeModification
            ?  <Sélecteur
                erreur={errors.indicIsPerseverant}
                htmlName='indicIsPerseverant'
                options={[{ libellé: 'Oui', valeur: 'true' }, { libellé: 'Non', valeur: 'false' }]}
                register={register('indicIsPerseverant')}
                valeurSélectionnée={`${getValues('indicIsPerseverant')}`}
               />
            : (
              <span>
                {indicateur.indicIsPerseverant ? 'Oui' : 'Non' }
              </span>
            )}

        </div>
        <div className="fr-col-12 fr-col-md-6 fr-pl-2w">
          <p className='fr-text--md bold fr-mb-1v'>
            {mapInformationMetadataIndicateur.indic_is_phare.metaPiloteAlias}
          </p>
          {estEnCoursDeModification
            ? <Sélecteur
                erreur={errors.indicIsPhare}
                htmlName='indicIsPhare'
                options={[{ libellé: 'Oui', valeur: 'true' }, { libellé: 'Non', valeur: 'false' }]}
                register={register('indicIsPhare')}
                texteFantôme='Sélectionner un profil'
                valeurSélectionnée={`${getValues('indicIsPhare')}`}
              />
            : (
              <span>
                {indicateur.indicIsPhare ? 'Oui' : 'Non' }
              </span>
            )}

        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <p className='fr-text--md bold fr-mb-1v'>
            {mapInformationMetadataIndicateur.indic_source.metaPiloteAlias}
          </p>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.indicSource}
                htmlName="indicSource"
                libellé="indicSource"
                register={register('indicSource', { value: indicateur?.indicSource })}
                type="text"
              />
            : (
              <span>
                {indicateur.indicSource || 'Non renseigné'}
              </span>
            )}

        </div>
        <div className="fr-col-12 fr-col-md-6 fr-pl-2w">
          <p className='fr-text--md bold fr-mb-1v'>
            {mapInformationMetadataIndicateur.indic_source_url.metaPiloteAlias}
          </p>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.indicSourceUrl}
                htmlName="indicSourceUrl"
                libellé="indicSourceUrl"
                register={register('indicSourceUrl', { value: indicateur?.indicSourceUrl })}
                type="text"
              />
            : (
              <span>
                {indicateur.indicSourceUrl || 'Non renseigné'}
              </span>
            )}

        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className="fr-col-12 fr-col-md-6 fr-pr-2w">
          <p className='fr-text--md bold fr-mb-1v'>
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
        <div className="fr-col-12 fr-col-md-6 fr-pl-2w">
          <p className='fr-text--md bold fr-mb-1v'>
            {mapInformationMetadataIndicateur.indic_type.metaPiloteAlias}
          </p>
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
          <p className='fr-text--md bold fr-mb-1v'>
            {mapInformationMetadataIndicateur.indic_methode_calcul.metaPiloteAlias}
          </p>
          {estEnCoursDeModification
            ? <TextArea
                erreur={errors.indicMethodeCalcul}
                htmlName="indicMethodeCalcul"
                libellé="indicMethodeCalcul"
                register={register('indicMethodeCalcul', { value: indicateur?.indicMethodeCalcul })}
              />
            : (
              <span>
                {indicateur.indicMethodeCalcul || 'Non renseigné'}
              </span>
            )}

        </div>
        <div className="fr-col-12 fr-col-md-6 fr-pl-2w">
          <p className='fr-text--md bold fr-mb-1v'>
            {mapInformationMetadataIndicateur.indic_unite.metaPiloteAlias}
          </p>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.indicUnite}
                htmlName="indicUnite"
                libellé="indicUnite"
                register={register('indicUnite', { value: indicateur?.indicUnite })}
                type="text"
              />
            : (
              <span>
                {indicateur.indicUnite || 'Non renseigné'}
              </span>
            )}
        </div>
      </div>
      <hr className='fr-hr fr-mt-3w' />
    </SectionDétailsMetadataIndicateurStyled>
  );
}
