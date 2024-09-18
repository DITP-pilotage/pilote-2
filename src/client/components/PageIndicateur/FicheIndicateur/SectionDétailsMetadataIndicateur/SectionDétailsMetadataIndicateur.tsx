import { FunctionComponent } from 'react';
import SectionDétailsMetadataIndicateurStyled
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataIndicateur/SectionDétailsMetadataIndicateur.styled';
import useDetailMetadataIndicateurForm
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataIndicateur/useDetailMetadataIndicateurForm';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import { MapInformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';
import {
  MetadataIndicateurSelecteur,
} from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurSelecteur';
import {
  MetadataIndicateurTextArea,
} from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurTextArea';
import { MetadataIndicateurInput } from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurInput';
import {
  mappingAcceptedValues,
  mappingDisplayAcceptedValues,
} from '@/components/PageIndicateur/FicheIndicateur/commons/utils';
import {
  MetadataIndicateurInterrupteur,
} from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurInterrupteur';
import {
  MetadataIndicateurSelecteurAvecRecherche,
} from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurSelecteurAvecRecherche';

const SectionDétailsMetadataIndicateur: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat
  estEnCoursDeModification: boolean
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat
  chantiers: ChantierSynthétisé[]
}> = ({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
  chantiers,
}) => {
  const {
    register,
    getValues,
    setValue,
    errors,
    metadataIndicateurs,
    optionsIndicateurParent,
  } = useDetailMetadataIndicateurForm();
  const optionsParentCh = [...chantiers.map(chantier => ({
    valeur: chantier.id,
    libellé: `${chantier.id} - ${chantier.nom}`,
  })), { valeur: '_', libellé: 'Aucun chantier selectionné' }];

  function displayParentIndic(indicParentIndic: string | null) {
    return indicParentIndic ? `${indicParentIndic} - ${metadataIndicateurs.find(metadataIndicateur => metadataIndicateur.indicId === indicParentIndic)?.indicNom}` : 'Pas d\'indicateur parent';
  }

  return (
    <SectionDétailsMetadataIndicateurStyled>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurTextArea
            erreurMessage={errors.indicNom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='indicNom'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.indic_nom}
            register={register('indicNom', { value: indicateur?.indicNom })}
            valeurAffiché={indicateur.indicNom || '_'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurTextArea
            erreurMessage={errors.indicDescr?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='indicDescr'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.indic_descr}
            register={register('indicDescr', { value: indicateur?.indicDescr })}
            valeurAffiché={indicateur.indicDescr}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurSelecteurAvecRecherche
            erreurMessage={errors.indicParentCh?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.indic_parent_ch}
            listeValeur={optionsParentCh}
            valeurAffiché={`${indicateur.indicParentCh} - ${chantiers.find(chantier => chantier.id === indicateur.indicParentCh)?.nom}`}
            valeurModifiéeCallback={valeur => setValue('indicParentCh', valeur)}
            values={getValues('indicParentCh')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.indicParentIndic?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.indic_parent_indic}
            listeValeur={optionsIndicateurParent}
            register={register('indicParentIndic')}
            valeurAffiché={displayParentIndic(indicateur.indicParentIndic)}
            values={getValues('indicParentIndic')}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.indicSchema?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.indic_schema}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'indic_schema')}
            register={register('indicSchema')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'indic_schema', 'indicSchema')}
            values={getValues('indicSchema')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.indicType?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.indic_type}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'indic_type')}
            register={register('indicType')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'indic_type', 'indicType')}
            values={getValues('indicType')}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurInput
            erreurMessage={errors.indicUnite?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='indicUnite'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.indic_unite}
            register={register('indicUnite', { value: indicateur?.indicUnite })}
            valeurAffiché={indicateur.indicUnite || '_'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.zgApplicable?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.zg_applicable}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'zg_applicable')}
            register={register('zgApplicable')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'zg_applicable', 'zgApplicable')}
            values={getValues('zgApplicable')}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurInterrupteur
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='indicTerritorialise'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.indic_territorialise}
            isChecked={getValues('indicTerritorialise')}
            register={register('indicTerritorialise')}
            valeurAffiché={indicateur.indicTerritorialise ? 'Oui' : 'Non'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6'>
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
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurInput
            disabled={!getValues('indicIsBaro')}
            erreurMessage={errors.indicNomBaro?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='indicNomBaro'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.indic_nom_baro}
            register={register('indicNomBaro', { value: indicateur?.indicNomBaro })}
            valeurAffiché={indicateur.indicNomBaro || '_'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurInput
            disabled={!getValues('indicIsBaro')}
            erreurMessage={errors.indicDescrBaro?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='indicDescrBaro'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.indic_descr_baro}
            register={register('indicDescrBaro', { value: indicateur?.indicDescrBaro })}
            valeurAffiché={indicateur.indicDescrBaro || '_'}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurTextArea
            erreurMessage={errors.indicSource?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='indicSource'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.indic_source}
            register={register('indicSource', { value: indicateur?.indicSource })}
            valeurAffiché={indicateur.indicSource || '_'}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6'>
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
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.periodicite?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.periodicite}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'periodicite')}
            register={register('periodicite')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'periodicite', 'periodicite')}
            values={getValues('periodicite')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-6'>
          <MetadataIndicateurInput
            erreurMessage={errors.delaiDisponibilite?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='delaiDisponibilite'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.delai_disponibilite}
            register={register('delaiDisponibilite', { value: `${indicateur?.delaiDisponibilite}` })}
            valeurAffiché={`${indicateur.delaiDisponibilite}`}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-6'>
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
    </SectionDétailsMetadataIndicateurStyled>
  );
};

export default SectionDétailsMetadataIndicateur;
