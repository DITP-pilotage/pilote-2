import { FunctionComponent } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import SectionDétailsMetadataParametreIndicateurDepartementaleStyled
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurDepartementale/SectionDétailsMetadataParametreIndicateurDepartementale.styled';
import useDétailsMetadataParametreIndicateurDepartementaleForm
, { MetadataParametrageParametreIndicateurDepartementaleForm }  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurDepartementale/useDétailsMetadataParametreIndicateurDepartementaleForm';
import { MapInformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import {
  MetadataIndicateurSelecteur,
} from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurSelecteur';
import {
  mappingAcceptedValues,
  mappingDisplayAcceptedValues,
} from '@/components/PageIndicateur/FicheIndicateur/commons/utils';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';

const SectionDétailsMetadataParametreIndicateurDepartementale: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat
  estEnCoursDeModification: boolean
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat
}> = ({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
}) => {
  const { register, getValues, errors, setValue } = useDétailsMetadataParametreIndicateurDepartementaleForm();

  const valeursDeptFromDesactiveDeptOp = new Set(['_', 'user_input']);
  const ALaModificationValeurDeptFrom = (variableFrom: keyof MetadataParametrageParametreIndicateurDepartementaleForm, valeurFrom: string, variableOp: keyof MetadataParametrageParametreIndicateurDepartementaleForm, variableParDefautOp: string) => {
    setValue(variableFrom, valeurFrom);
    if (valeursDeptFromDesactiveDeptOp.has(valeurFrom)) {
      setValue(variableOp, variableParDefautOp);
    }
  };

  return (
    <SectionDétailsMetadataParametreIndicateurDepartementaleStyled>
      <Titre
        baliseHtml='h2'
        className='fr-h5'
      >
        Maille départementale
      </Titre>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.viDeptFrom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vi_dept_from}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_dept_from')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_dept_from', 'viDeptFrom')}
            valeurModifiéeCallback={valeur => {
              ALaModificationValeurDeptFrom('viDeptFrom', valeur, 'viDeptOp', mapInformationMetadataIndicateur.vi_dept_from.metaPiloteDefaultValue as string);
            }}
            values={getValues('viDeptFrom')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.vaDeptFrom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.va_dept_from}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_dept_from')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_dept_from', 'vaDeptFrom')}
            valeurModifiéeCallback={valeur => {
              ALaModificationValeurDeptFrom('vaDeptFrom', valeur, 'vaDeptOp', mapInformationMetadataIndicateur.va_dept_from.metaPiloteDefaultValue as string);
            }}
            values={getValues('vaDeptFrom')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.vcDeptFrom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vc_dept_from}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vc_dept_from')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vc_dept_from', 'vcDeptFrom')}
            valeurModifiéeCallback={valeur => {
              ALaModificationValeurDeptFrom('vcDeptFrom', valeur, 'vcDeptOp', mapInformationMetadataIndicateur.vc_dept_from.metaPiloteDefaultValue as string);
            }}
            values={getValues('vcDeptFrom')}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.viDeptOp?.message}
            estDesactive={valeursDeptFromDesactiveDeptOp.has(getValues('viDeptFrom'))}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vi_dept_op}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_dept_op')}
            register={register('viDeptOp')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_dept_op', 'viDeptOp')}
            values={getValues('viDeptOp')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.vaDeptOp?.message}
            estDesactive={valeursDeptFromDesactiveDeptOp.has(getValues('vaDeptFrom'))}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.va_dept_op}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_dept_op')}
            register={register('vaDeptOp')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_dept_op', 'vaDeptOp')}
            values={getValues('vaDeptOp')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.vcDeptOp?.message}
            estDesactive={valeursDeptFromDesactiveDeptOp.has(getValues('vcDeptFrom'))}
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
};

export default SectionDétailsMetadataParametreIndicateurDepartementale;
