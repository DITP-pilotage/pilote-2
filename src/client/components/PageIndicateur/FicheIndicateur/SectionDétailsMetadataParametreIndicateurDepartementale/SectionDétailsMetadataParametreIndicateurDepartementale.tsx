import Titre from '@/components/_commons/Titre/Titre';
import SectionDétailsMetadataParametreIndicateurDepartementaleStyled
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurDepartementale/SectionDétailsMetadataParametreIndicateurDepartementale.styled';
import useDétailsMetadataParametreIndicateurDepartementaleForm
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurDepartementale/useDétailsMetadataParametreIndicateurDepartementaleForm';
import { MapInformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import {
  MetadataIndicateurSelecteur,
} from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurSelecteur';
import {
  mappingAcceptedValues,
  mappingDisplayAcceptedValues,
} from '@/components/PageIndicateur/FicheIndicateur/commons/utils';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';

export default function SectionDétailsMetadataParametreIndicateurDepartementale({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
}: {
  indicateur: MetadataParametrageIndicateurContrat
  estEnCoursDeModification: boolean
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat
}) {
  const { register, getValues, errors } = useDétailsMetadataParametreIndicateurDepartementaleForm();

  return (
    <SectionDétailsMetadataParametreIndicateurDepartementaleStyled>
      <Titre
        baliseHtml='h2'
        className='fr-h5'
      >
        Paramétrages - Maille départementale
      </Titre>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.viDeptFrom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vi_dept_from}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_dept_from')}
            register={register('viDeptFrom')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_dept_from', 'viDeptFrom')}
            values={getValues('viDeptFrom')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w  fr-pl-2w'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.vaDeptFrom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.va_dept_from}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_dept_from')}
            register={register('vaDeptFrom')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_dept_from', 'vaDeptFrom')}
            values={getValues('vaDeptFrom')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pl-2w'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.vcDeptFrom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vc_dept_from}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vc_dept_from')}
            register={register('vcDeptFrom')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vc_dept_from', 'vcDeptFrom')}
            values={getValues('vcDeptFrom')}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.viDeptOp?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vi_dept_op}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_dept_op')}
            register={register('viDeptOp')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_dept_op', 'viDeptOp')}
            values={getValues('viDeptOp')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w fr-pl-2w'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.vaDeptOp?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.va_dept_op}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_dept_op')}
            register={register('vaDeptOp')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_dept_op', 'vaDeptOp')}
            values={getValues('vaDeptOp')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pl-2w'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.vcDeptOp?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vc_dept_op}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vc_dept_op')}
            register={register('vcDeptOp')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vc_dept_op', 'vcDeptOp')}
            values={getValues('vcDeptOp')}
          />
        </div>
      </div>
      <hr className='fr-hr fr-mt-3w' />
    </SectionDétailsMetadataParametreIndicateurDepartementaleStyled>
  );
}







