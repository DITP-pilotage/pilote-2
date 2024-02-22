import Titre from '@/components/_commons/Titre/Titre';
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


export default function SectionDétailsMetadataIndicateur({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
  chantiers,
}: {
  indicateur: MetadataParametrageIndicateurContrat
  estEnCoursDeModification: boolean
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat
  chantiers: ChantierSynthétisé[]
}) {
  const { register, getValues, errors, metadataIndicateurs, optionsIndicateurParent } = useDetailMetadataIndicateurForm();
  const optionsParentCh = [...chantiers.map(chantier => ({
    valeur: chantier.id,
    libellé: `${chantier.id} - ${chantier.nom}`,
  })), { valeur: '_', libellé: 'Aucun chantier selectionné' }];

  function displayParentIndic(indicParentIndic: string) {
    return indicParentIndic ? `${indicParentIndic} - ${metadataIndicateurs.find(metadataIndicateur => metadataIndicateur.indicId === indicParentIndic)?.indicNom}` : "Pas d'indicateur parent";
  }

  return (
    <SectionDétailsMetadataIndicateurStyled>
      <Titre
        baliseHtml='h2'
        className='fr-h5'
      >
        Identité indicateur
      </Titre>
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
          <MetadataIndicateurSelecteur
            erreurMessage={errors.indicParentCh?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.indic_parent_ch}
            listeValeur={optionsParentCh}
            register={register('indicParentCh')}
            valeurAffiché={`${indicateur.indicParentCh} - ${chantiers.find(chantier => chantier.id === indicateur.indicParentCh)?.nom}`}
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
          <MetadataIndicateurInput
            erreurMessage={errors.zgApplicable?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='zgApplicable'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.zg_applicable}
            register={register('zgApplicable', { value: indicateur?.zgApplicable })}
            valeurAffiché={indicateur.zgApplicable || '_'}
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
      <hr className='fr-hr fr-mt-3w' />
    </SectionDétailsMetadataIndicateurStyled>
  );
}
