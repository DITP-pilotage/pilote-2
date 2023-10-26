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
      <hr className='fr-hr fr-mt-3w' />
    </SectionDétailsMetadataAutresIndicateurStyled>
  );
}
