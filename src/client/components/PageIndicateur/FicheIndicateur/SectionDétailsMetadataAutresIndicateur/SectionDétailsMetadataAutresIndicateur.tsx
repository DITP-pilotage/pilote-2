import Titre from '@/components/_commons/Titre/Titre';
import SectionDétailsMetadataAutresIndicateurStyled
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataAutresIndicateur/SectionDétailsMetadataAutresIndicateur.styled';
import useSectionDétailsMetadataAutresIndicateurForm
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataAutresIndicateur/useDétailsMetadataAutresIndicateurForm';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import { MapInformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import { MetadataIndicateurInput } from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurInput';
import {
  MetadataIndicateurTextArea,
} from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurTextArea';
import {
  MetadataIndicateurInterrupteur,
} from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurInterrupteur';

export default function SectionDétailsMetadataAutresIndicateur({ indicateur, estEnCoursDeModification, mapInformationMetadataIndicateur }: {
  indicateur: MetadataParametrageIndicateurContrat
  estEnCoursDeModification: boolean
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat
}) { 
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
          <MetadataIndicateurInput
            erreurMessage={errors.indicNomBaro?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='indicNomBaro'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.indic_nom_baro}
            register={register('indicNomBaro', { value: indicateur?.indicNomBaro })}
            valeurAffiché={indicateur.indicNomBaro || '_'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <MetadataIndicateurInput
            erreurMessage={errors.indicDescrBaro?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='indicDescrBaro'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.indic_descr_baro}
            register={register('indicDescrBaro', { value: indicateur?.indicDescrBaro })}
            valeurAffiché={indicateur.indicDescrBaro || '_'}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <MetadataIndicateurInterrupteur
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='indicIsBaro'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.indic_is_baro}
            isChecked={getValues('indicIsBaro')}
            register={register('indicIsBaro')}
            valeurAffiché={indicateur.indicIsBaro ? 'Oui' : 'Non'}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <MetadataIndicateurInterrupteur
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='indicIsPerseverant'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.indic_is_perseverant}
            isChecked={getValues('indicIsPerseverant')}
            register={register('indicIsPerseverant')}
            valeurAffiché={indicateur.indicIsPerseverant ? 'Oui' : 'Non'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <MetadataIndicateurInterrupteur
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='indicIsPhare'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.indic_is_phare}
            isChecked={getValues('indicIsPhare')}
            register={register('indicIsPhare')}
            valeurAffiché={indicateur.indicIsPhare ? 'Oui' : 'Non'}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <MetadataIndicateurInput
            erreurMessage={errors.indicSource?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='indicSource'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.indic_source}
            register={register('indicSource', { value: indicateur?.indicSource })}
            valeurAffiché={indicateur.indicSource || '_'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <MetadataIndicateurInput
            erreurMessage={errors.indicSourceUrl?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='indicSourceUrl'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.indic_source_url}
            register={register('indicSourceUrl', { value: indicateur?.indicSourceUrl })}
            valeurAffiché={indicateur.indicSourceUrl || '_'}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <MetadataIndicateurTextArea
            erreurMessage={errors.indicMethodeCalcul?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='indicMethodeCalcul'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.indic_methode_calcul}
            register={register('indicMethodeCalcul', { value: indicateur?.indicMethodeCalcul })}
            valeurAffiché={indicateur.indicMethodeCalcul || '_'}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <MetadataIndicateurInput
            erreurMessage={errors.reformePrioritaire?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='reformePrioritaire'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.reforme_prioritaire}
            register={register('reformePrioritaire', { value: indicateur?.reformePrioritaire })}
            valeurAffiché={indicateur.reformePrioritaire || '_'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <MetadataIndicateurInterrupteur
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='projetAnnuelPerf'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.projet_annuel_perf}
            isChecked={getValues('projetAnnuelPerf')}
            register={register('projetAnnuelPerf')}
            valeurAffiché={indicateur.projetAnnuelPerf ? 'Oui' : 'Non'}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <MetadataIndicateurInput
            erreurMessage={errors.detailProjetAnnuelPerf?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='detailProjetAnnuelPerf'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.detail_projet_annuel_perf}
            register={register('detailProjetAnnuelPerf', { value: indicateur?.detailProjetAnnuelPerf })}
            valeurAffiché={indicateur.detailProjetAnnuelPerf || '_'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <MetadataIndicateurInput
            erreurMessage={errors.periodicite?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='periodicite'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.periodicite}
            register={register('periodicite', { value: indicateur?.periodicite })}
            valeurAffiché={indicateur.periodicite || '_'}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <MetadataIndicateurInput
            erreurMessage={errors.delaiDisponibilite?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='delaiDisponibilite'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.delai_disponibilite}
            register={register('delaiDisponibilite', { value: `${indicateur?.delaiDisponibilite}` })}
            valeurAffiché={`${indicateur.delaiDisponibilite}` || '_'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <MetadataIndicateurInput
            erreurMessage={errors.commentaire?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='commentaire'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.commentaire}
            register={register('commentaire', { value: indicateur?.commentaire })}
            valeurAffiché={indicateur.commentaire || '_'}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <MetadataIndicateurInput
            erreurMessage={errors.frequenceTerritoriale?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='frequenceTerritoriale'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.frequence_territoriale}
            register={register('frequenceTerritoriale', { value: indicateur?.frequenceTerritoriale })}
            valeurAffiché={indicateur.frequenceTerritoriale || '_'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <MetadataIndicateurInput
            erreurMessage={errors.mailles?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='mailles'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.mailles}
            register={register('mailles', { value: indicateur?.mailles })}
            valeurAffiché={indicateur.mailles || '_'}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <MetadataIndicateurInput
            erreurMessage={errors.adminSource?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='adminSource'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.admin_source}
            register={register('adminSource', { value: indicateur?.adminSource })}
            valeurAffiché={indicateur.adminSource || '_'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <MetadataIndicateurInput
            erreurMessage={errors.methodeCollecte?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='methodeCollecte'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.methode_collecte}
            register={register('methodeCollecte', { value: indicateur?.methodeCollecte })}
            valeurAffiché={indicateur.methodeCollecte || '_'}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <MetadataIndicateurInput
            erreurMessage={errors.siSource?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='siSource'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.si_source}
            register={register('siSource', { value: indicateur?.siSource })}
            valeurAffiché={indicateur.siSource || '_'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <MetadataIndicateurInterrupteur
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='donneeOuverte'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.donnee_ouverte}
            isChecked={getValues('donneeOuverte')}
            register={register('donneeOuverte')}
            valeurAffiché={indicateur.donneeOuverte ? 'Oui' : 'Non'}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <MetadataIndicateurInput
            erreurMessage={errors.modalitesDonneeOuverte?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='modalitesDonneeOuverte'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.modalites_donnee_ouverte}
            register={register('modalitesDonneeOuverte', { value: indicateur?.modalitesDonneeOuverte })}
            valeurAffiché={indicateur.modalitesDonneeOuverte || '_'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <MetadataIndicateurInput
            erreurMessage={errors.respDonnees?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='respDonnees'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.resp_donnees}
            register={register('respDonnees', { value: indicateur?.respDonnees })}
            valeurAffiché={indicateur.respDonnees || '_'}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <MetadataIndicateurInput
            erreurMessage={errors.respDonneesEmail?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='respDonneesEmail'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.resp_donnees_email}
            register={register('respDonneesEmail', { value: indicateur?.respDonneesEmail })}
            valeurAffiché={indicateur.respDonneesEmail || '_'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6 fr-pl-2w'>
          <MetadataIndicateurInput
            erreurMessage={errors.contactTechnique?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='contactTechnique'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.contact_technique}
            register={register('contactTechnique', { value: indicateur?.contactTechnique })}
            valeurAffiché={indicateur.contactTechnique || '_'}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-6 fr-pr-2w'>
          <MetadataIndicateurInput
            erreurMessage={errors.contactTechniqueEmail?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='contactTechniqueEmail'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.contact_technique_email}
            register={register('contactTechniqueEmail', { value: indicateur?.contactTechniqueEmail })}
            valeurAffiché={indicateur.contactTechniqueEmail || '_'}
          />
        </div>
      </div>
      <hr className='fr-hr fr-mt-3w' />
    </SectionDétailsMetadataAutresIndicateurStyled>
  );
}
