import { FunctionComponent } from 'react';
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


const SectionDétailsMetadataAutresIndicateur: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat
  estEnCoursDeModification: boolean
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat
}> = ({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
}) => {
  const { register, getValues, errors } = useSectionDétailsMetadataAutresIndicateurForm();
  return (
    <SectionDétailsMetadataAutresIndicateurStyled>
      <Titre
        baliseHtml='h2'
        className='fr-h5'
      >
        Autres informations
      </Titre>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurInput
            erreurMessage={errors.mailles?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='mailles'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.mailles}
            register={register('mailles', { value: indicateur?.mailles })}
            valeurAffiché={indicateur.mailles || '_'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurInput
            erreurMessage={errors.frequenceTerritoriale?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='frequenceTerritoriale'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.frequence_territoriale}
            register={register('frequenceTerritoriale', { value: `${indicateur?.frequenceTerritoriale}` })}
            valeurAffiché={`${indicateur.frequenceTerritoriale}`}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurInput
            erreurMessage={errors.adminSource?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='adminSource'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.admin_source}
            register={register('adminSource', { value: indicateur?.adminSource })}
            valeurAffiché={indicateur.adminSource || '_'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurInput
            erreurMessage={errors.siSource?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='siSource'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.si_source}
            register={register('siSource', { value: indicateur?.siSource })}
            valeurAffiché={indicateur.siSource || '_'}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurInterrupteur
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='donneeOuverte'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.donnee_ouverte}
            isChecked={getValues('donneeOuverte')}
            register={register('donneeOuverte')}
            valeurAffiché={indicateur.donneeOuverte ? 'Oui' : 'Non'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurInput
            erreurMessage={errors.modalitesDonneeOuverte?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='modalitesDonneeOuverte'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.modalites_donnee_ouverte}
            register={register('modalitesDonneeOuverte', { value: indicateur?.modalitesDonneeOuverte })}
            valeurAffiché={indicateur.modalitesDonneeOuverte || '_'}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurInput
            erreurMessage={errors.respDonnees?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='respDonnees'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.resp_donnees}
            register={register('respDonnees', { value: indicateur?.respDonnees })}
            valeurAffiché={indicateur.respDonnees || '_'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurInput
            erreurMessage={errors.respDonneesEmail?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='respDonneesEmail'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.resp_donnees_email}
            register={register('respDonneesEmail', { value: indicateur?.respDonneesEmail })}
            valeurAffiché={indicateur.respDonneesEmail || '_'}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurInput
            erreurMessage={errors.contactTechnique?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='contactTechnique'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.contact_technique}
            register={register('contactTechnique', { value: indicateur?.contactTechnique })}
            valeurAffiché={indicateur.contactTechnique || '_'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6'>
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
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurInterrupteur
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='indicIsPerseverant'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.indic_is_perseverant}
            isChecked={getValues('indicIsPerseverant')}
            register={register('indicIsPerseverant')}
            valeurAffiché={indicateur.indicIsPerseverant ? 'Oui' : 'Non'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurInput
            erreurMessage={errors.reformePrioritaire?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='reformePrioritaire'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.reforme_prioritaire}
            register={register('reformePrioritaire', { value: indicateur?.reformePrioritaire })}
            valeurAffiché={indicateur.reformePrioritaire || '_'}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurInterrupteur
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='projetAnnuelPerf'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.projet_annuel_perf}
            isChecked={getValues('projetAnnuelPerf')}
            register={register('projetAnnuelPerf')}
            valeurAffiché={indicateur.projetAnnuelPerf ? 'Oui' : 'Non'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurInput
            erreurMessage={errors.detailProjetAnnuelPerf?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='detailProjetAnnuelPerf'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.detail_projet_annuel_perf}
            register={register('detailProjetAnnuelPerf', { value: indicateur?.detailProjetAnnuelPerf })}
            valeurAffiché={indicateur.detailProjetAnnuelPerf || '_'}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurTextArea
            erreurMessage={errors.commentaire?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='commentaire'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.commentaire}
            register={register('commentaire', { value: indicateur?.commentaire })}
            valeurAffiché={indicateur.commentaire || '_'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6'>
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
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-6'>
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
    </SectionDétailsMetadataAutresIndicateurStyled>
  );
};

export default SectionDétailsMetadataAutresIndicateur;
