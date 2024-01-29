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
        {' '}

      </Titre>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative overflow-ellipsis'>
            {mapInformationMetadataIndicateur.indic_nom_baro.metaPiloteAlias}
            {' '}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='indicNomBaro'>
                {mapInformationMetadataIndicateur.indic_nom_baro.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.indicNomBaro}
                htmlName='indicNomBaro'
                libellé='indicNomBaro'
                register={register('indicNomBaro', { value: indicateur?.indicNomBaro })}
                type='text'
              />
            : (
              <span>
                {indicateur.indicNomBaro || '_'}
              </span>
            )}

        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.indic_descr_baro.metaPiloteAlias}
            {' '}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='indicDescrBaro'>
                {mapInformationMetadataIndicateur.indic_descr_baro.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <TextArea
                htmlName='indicDescrBaro'
                libellé='indicDescrBaro'
                register={register('indicDescrBaro', { value: indicateur?.indicDescrBaro })}
              />
            : (
              <span>
                {indicateur.indicDescrBaro || '_'}
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
              <Infobulle idHtml='indicIsBaro'>
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
                {indicateur.indicIsBaro ? 'Oui' : 'Non'}
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
            ? <Sélecteur
                erreur={errors.indicIsPerseverant}
                htmlName='indicIsPerseverant'
                options={[{ libellé: 'Oui', valeur: 'true' }, { libellé: 'Non', valeur: 'false' }]}
                register={register('indicIsPerseverant')}
                valeurSélectionnée={`${getValues('indicIsPerseverant')}`}
              />
            : (
              <span>
                {indicateur.indicIsPerseverant ? 'Oui' : 'Non'}
              </span>
            )}

        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
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
                {indicateur.indicIsPhare ? 'Oui' : 'Non'}
              </span>
            )}

        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.indic_source.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='indicSource'>
                {mapInformationMetadataIndicateur.indic_source.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.indicSource}
                htmlName='indicSource'
                libellé='indicSource'
                register={register('indicSource', { value: indicateur?.indicSource })}
                type='text'
              />
            : (
              <span>
                {indicateur.indicSource || '_'}
              </span>
            )}

        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <p className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.indic_source_url.metaPiloteAlias}
          </p>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.indicSourceUrl}
                htmlName='indicSourceUrl'
                libellé='indicSourceUrl'
                register={register('indicSourceUrl', { value: indicateur?.indicSourceUrl })}
                type='text'
              />
            : (
              <span>
                {indicateur.indicSourceUrl || '_'}
              </span>
            )}

        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.indic_methode_calcul.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='indicMethodeCalcul'>
                {mapInformationMetadataIndicateur.indic_methode_calcul.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <TextArea
                erreur={errors.indicMethodeCalcul}
                htmlName='indicMethodeCalcul'
                libellé='indicMethodeCalcul'
                register={register('indicMethodeCalcul', { value: indicateur?.indicMethodeCalcul })}
              />
            : (
              <span>
                {indicateur.indicMethodeCalcul || '_'}
              </span>
            )}

        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.reforme_prioritaire.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='reformePrioritaire'>
                {mapInformationMetadataIndicateur.reforme_prioritaire.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.reformePrioritaire}
                htmlName='reformePrioritaire'
                libellé='reformePrioritaire'
                register={register('reformePrioritaire', { value: indicateur?.reformePrioritaire })}
                type='text'
              />
            : (
              <span>
                {indicateur.reformePrioritaire || '_'}
              </span>
            )}

        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.projet_annuel_perf.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='reformePrioritaire'>
                {mapInformationMetadataIndicateur.projet_annuel_perf.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                htmlName='projetAnnuelPerf'
                options={[{ libellé: 'Oui', valeur: 'true' }, { libellé: 'Non', valeur: 'false' }]}
                register={register('projetAnnuelPerf')}
                texteFantôme='Sélectionner un profil'
                valeurSélectionnée={`${getValues('projetAnnuelPerf')}`}
              />
            : (
              <span>
                {indicateur.projetAnnuelPerf ? 'Oui' : 'Non'}
              </span>
            )}

        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.detail_projet_annuel_perf.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='reformePrioritaire'>
                {mapInformationMetadataIndicateur.detail_projet_annuel_perf.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.detailProjetAnnuelPerf}
                htmlName='detailProjetAnnuelPerf'
                libellé='detailProjetAnnuelPerf'
                register={register('detailProjetAnnuelPerf', { value: indicateur?.detailProjetAnnuelPerf })}
                type='text'
              />
            : (
              <span>
                {indicateur.detailProjetAnnuelPerf || '_'}
              </span>
            )}

        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.periodicite.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='reformePrioritaire'>
                {mapInformationMetadataIndicateur.periodicite.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.periodicite}
                htmlName='periodicite'
                libellé='periodicite'
                register={register('periodicite', { value: indicateur?.periodicite })}
                type='text'
              />
            : (
              <span>
                {indicateur.periodicite || '_'}
              </span>
            )}

        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.delai_disponibilite.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='reformePrioritaire'>
                {mapInformationMetadataIndicateur.delai_disponibilite.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.delaiDisponibilite}
                htmlName='delaiDisponibilite'
                libellé='delaiDisponibilite'
                register={register('delaiDisponibilite', { value: `${indicateur?.delaiDisponibilite}` })}
                type='text'
              />
            : (
              <span>
                {indicateur.delaiDisponibilite || '_'}
              </span>
            )}

        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.commentaire.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='reformePrioritaire'>
                {mapInformationMetadataIndicateur.commentaire.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.commentaire}
                htmlName='commentaire'
                libellé='commentaire'
                register={register('commentaire', { value: indicateur?.commentaire })}
                type='text'
              />
            : (
              <span>
                {indicateur.commentaire || '_'}
              </span>
            )}

        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.frequence_territoriale.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='reformePrioritaire'>
                {mapInformationMetadataIndicateur.frequence_territoriale.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.frequenceTerritoriale}
                htmlName='frequenceTerritoriale'
                libellé='frequenceTerritoriale'
                register={register('frequenceTerritoriale', { value: indicateur?.frequenceTerritoriale })}
                type='text'
              />
            : (
              <span>
                {indicateur.frequenceTerritoriale || '_'}
              </span>
            )}

        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.mailles.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='reformePrioritaire'>
                {mapInformationMetadataIndicateur.mailles.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.mailles}
                htmlName='mailles'
                libellé='mailles'
                register={register('mailles', { value: indicateur?.mailles })}
                type='text'
              />
            : (
              <span>
                {indicateur.mailles || '_'}
              </span>
            )}

        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.admin_source.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='reformePrioritaire'>
                {mapInformationMetadataIndicateur.admin_source.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.adminSource}
                htmlName='adminSource'
                libellé='adminSource'
                register={register('adminSource', { value: indicateur?.adminSource })}
                type='text'
              />
            : (
              <span>
                {indicateur.adminSource || '_'}
              </span>
            )}

        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.methode_collecte.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='reformePrioritaire'>
                {mapInformationMetadataIndicateur.methode_collecte.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.methodeCollecte}
                htmlName='methodeCollecte'
                libellé='methodeCollecte'
                register={register('methodeCollecte', { value: indicateur?.methodeCollecte })}
                type='text'
              />
            : (
              <span>
                {indicateur.methodeCollecte || '_'}
              </span>
            )}

        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.si_source.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='reformePrioritaire'>
                {mapInformationMetadataIndicateur.si_source.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.siSource}
                htmlName='siSource'
                libellé='siSource'
                register={register('siSource', { value: indicateur?.siSource })}
                type='text'
              />
            : (
              <span>
                {indicateur.siSource || '_'}
              </span>
            )}

        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.donnee_ouverte.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='reformePrioritaire'>
                {mapInformationMetadataIndicateur.donnee_ouverte.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Sélecteur
                htmlName='donneeOuverte'
                options={[{ libellé: 'Oui', valeur: 'true' }, { libellé: 'Non', valeur: 'false' }]}
                register={register('donneeOuverte')}
                texteFantôme='Sélectionner un profil'
                valeurSélectionnée={`${getValues('donneeOuverte')}`}
              />
            : (
              <span>
                {indicateur.donneeOuverte ? 'Oui' : 'Non'}
              </span>
            )}

        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.modalites_donnee_ouverte.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='reformePrioritaire'>
                {mapInformationMetadataIndicateur.modalites_donnee_ouverte.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.modalitesDonneeOuverte}
                htmlName='modalitesDonneeOuverte'
                libellé='modalitesDonneeOuverte'
                register={register('modalitesDonneeOuverte', { value: indicateur?.modalitesDonneeOuverte })}
                type='text'
              />
            : (
              <span>
                {indicateur.modalitesDonneeOuverte || '_'}
              </span>
            )}

        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.resp_donnees.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='reformePrioritaire'>
                {mapInformationMetadataIndicateur.resp_donnees.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.respDonnees}
                htmlName='respDonnees'
                libellé='respDonnees'
                register={register('respDonnees', { value: indicateur?.respDonnees })}
                type='text'
              />
            : (
              <span>
                {indicateur.respDonnees || '_'}
              </span>
            )}

        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.resp_donnees_email.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='reformePrioritaire'>
                {mapInformationMetadataIndicateur.resp_donnees_email.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.respDonneesEmail}
                htmlName='respDonneesEmail'
                libellé='respDonneesEmail'
                register={register('respDonneesEmail', { value: indicateur?.respDonneesEmail })}
                type='text'
              />
            : (
              <span>
                {indicateur.respDonneesEmail || '_'}
              </span>
            )}

        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.contact_technique.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='reformePrioritaire'>
                {mapInformationMetadataIndicateur.contact_technique.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.contactTechnique}
                htmlName='contactTechnique'
                libellé='contactTechnique'
                register={register('contactTechnique', { value: indicateur?.contactTechnique })}
                type='text'
              />
            : (
              <span>
                {indicateur.contactTechnique || '_'}
              </span>
            )}

        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.contact_technique_email.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='reformePrioritaire'>
                {mapInformationMetadataIndicateur.contact_technique_email.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.contactTechniqueEmail}
                htmlName='contactTechniqueEmail'
                libellé='contactTechniqueEmail'
                register={register('contactTechniqueEmail', { value: indicateur?.contactTechniqueEmail })}
                type='text'
              />
            : (
              <span>
                {indicateur.contactTechniqueEmail || '_'}
              </span>
            )}

        </div>
      </div>
      <hr className='fr-hr fr-mt-3w' />
    </SectionDétailsMetadataAutresIndicateurStyled>
  );
}
