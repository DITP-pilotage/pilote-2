import Titre from '@/components/_commons/Titre/Titre';
import TextArea from '@/components/_commons/TextArea/TextArea';
import Input from '@/components/_commons/Input/Input';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import SectionDétailsMetadataAutresIndicateurProps
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataAutresIndicateur/SectionDétailsMetadataAutresIndicateur.interface';
import SectionDétailsMetadataAutresIndicateurStyled
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataAutresIndicateur/SectionDétailsMetadataAutresIndicateur.styled';
import useSectionDétailsMetadataAutresIndicateurForm
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataAutresIndicateur/useDétailsMetadataAutresIndicateurForm';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';

export default function SectionDétailsMetadataAutresIndicateur({ indicateur, estEnCoursDeModification, mapInformationMetadataIndicateur }: SectionDétailsMetadataAutresIndicateurProps) {
  const { register, getValues, errors } = useSectionDétailsMetadataAutresIndicateurForm();
  return (
    <SectionDétailsMetadataAutresIndicateurStyled>
      <Titre
        baliseHtml='h2'
        className='fr-h5'
      >
        Autres informations
      </Titre>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.indic_nom_baro.metaPiloteAlias}
            {' '}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="indicNomBaro">
                {mapInformationMetadataIndicateur.indic_nom_baro.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.indicNomBaro}
                htmlName="indicNomBaro"
                libellé="indicNomBaro"
                register={register('indicNomBaro', { value: indicateur?.indicNomBaro })}
                type="text"
              />
            : (
              <span>
                {indicateur.indicNomBaro || 'Non renseigné'}
              </span>
            )}

        </div>
        <div className="fr-col-12 fr-col-md-6 fr-pl-2w">
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.indic_descr_baro.metaPiloteAlias}
            {' '}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="indicDescrBaro">
                {mapInformationMetadataIndicateur.indic_descr_baro.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <TextArea
                htmlName="indicDescrBaro"
                libellé="indicDescrBaro"
                register={register('indicDescrBaro', { value: indicateur?.indicDescrBaro })}
              />
            : (
              <span>
                {indicateur.indicDescrBaro || 'Non renseigné'}
              </span>
            )}

        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.indic_is_baro.metaPiloteAlias}
            {' '}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="indicIsBaro">
                {mapInformationMetadataIndicateur.indic_is_baro.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                htmlName='indicIsBaro'
                options={[{ libellé: 'Oui', valeur: 'true' }, { libellé: 'Non', valeur: 'false' }]}
                register={register('indicIsBaro')}
                texteFantôme='Sélectionner un profil'
                valeurSélectionnée={`${getValues('indicIsBaro')}`}
              />
            : (
              <span>
                {indicateur.indicIsBaro ? 'Oui' : 'Non' }
              </span>
            )}

        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>

        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <p className='fr-text--md bold fr-mb-1v relative'>
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
          <p className='fr-text--md bold fr-mb-1v relative'>
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
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.indic_source.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml="indicSource">
                {mapInformationMetadataIndicateur.indic_source.description}
              </Infobulle>
            ) : null}
          </div>
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
          <p className='fr-text--md bold fr-mb-1v relative'>
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
      <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
        <div className='fr-text--md bold fr-mb-1v relative'>
          {mapInformationMetadataIndicateur.indic_methode_calcul.metaPiloteAlias}
          {estEnCoursDeModification ? (
            <Infobulle idHtml="indicMethodeCalcul">
              {mapInformationMetadataIndicateur.indic_methode_calcul.description}
            </Infobulle>
          ) : null}
        </div>
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
      <hr className='fr-hr fr-mt-3w' />
    </SectionDétailsMetadataAutresIndicateurStyled>
  );
}
