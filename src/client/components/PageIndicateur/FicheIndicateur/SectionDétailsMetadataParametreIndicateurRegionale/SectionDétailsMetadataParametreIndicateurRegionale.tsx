import { FunctionComponent } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import SectionDétailsMetadataParametreCalculIndicateurStyled
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreCalculIndicateur/SectionDétailsMetadataParametreCalculIndicateur.styled';
import useDétailsMetadataParametreIndicateurRegionaleForm 
, { MetadataParametrageParametreIndicateurRegionaleForm }  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurRegionale/useDétailsMetadataParametreIndicateurRegionaleForm';
import { MapInformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import {
  MetadataIndicateurSelecteur,
} from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurSelecteur';
import {
  mappingAcceptedValues,
  mappingDisplayAcceptedValues,
} from '@/components/PageIndicateur/FicheIndicateur/commons/utils';

const SectionDétailsMetadataParametreIndicateurRegionale: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat
  estEnCoursDeModification: boolean
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat
}> = ({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
}) => {
  const { register, getValues, errors, setValue } = useDétailsMetadataParametreIndicateurRegionaleForm();

  const valeursRegFromDesactiveRegOp = new Set(['_', 'user_input']);
  const ALaModificationValeurRegFrom = (variableFrom: keyof MetadataParametrageParametreIndicateurRegionaleForm, valeurFrom: string, variableOp: keyof MetadataParametrageParametreIndicateurRegionaleForm, variableParDefautOp: string) => {
    setValue(variableFrom, valeurFrom);
    if (valeursRegFromDesactiveRegOp.has(valeurFrom)) {
      setValue(variableOp, variableParDefautOp);
    }
  };

  return (
    <SectionDétailsMetadataParametreCalculIndicateurStyled>
      <Titre
        baliseHtml='h2'
        className='fr-h5'
      >
        Maille régionale
      </Titre>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.viRegFrom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vi_reg_from}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_reg_from')}
            register={register('viRegFrom')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_reg_from', 'viRegFrom')}
            valeurModifiéeCallback={valeur => { 
              ALaModificationValeurRegFrom('viRegFrom', valeur, 'viRegOp', mapInformationMetadataIndicateur.vi_reg_op.metaPiloteDefaultValue as string); 
            }}
            values={getValues('viRegFrom')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.vaRegFrom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.va_reg_from}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_reg_from')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_reg_from', 'vaRegFrom')}
            valeurModifiéeCallback={valeur => { 
              ALaModificationValeurRegFrom('vaRegFrom', valeur, 'vaRegOp', mapInformationMetadataIndicateur.va_reg_op.metaPiloteDefaultValue as string); 
            }}
            values={getValues('vaRegFrom')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.vcRegFrom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vc_reg_from}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vc_reg_from')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vc_reg_from', 'vcRegFrom')}
            valeurModifiéeCallback={valeur => { 
              ALaModificationValeurRegFrom('vcRegFrom', valeur, 'vcRegOp', mapInformationMetadataIndicateur.vc_reg_op.metaPiloteDefaultValue as string); 
            }}           
            values={getValues('vcRegFrom')}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.viRegOp?.message}
            estDesactive={valeursRegFromDesactiveRegOp.has(getValues('viRegFrom'))}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vi_reg_op}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_reg_op')}
            register={register('viRegOp')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_reg_op', 'viRegOp')}
            values={getValues('viRegOp')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.vaRegOp?.message}
            estDesactive={valeursRegFromDesactiveRegOp.has(getValues('vaRegFrom'))}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.va_reg_op}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_reg_op')}
            register={register('vaRegOp')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_reg_op', 'vaRegOp')}
            values={getValues('vaRegOp')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.vcRegOp?.message}
            estDesactive={valeursRegFromDesactiveRegOp.has(getValues('vcRegFrom'))}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vc_reg_op}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vc_reg_op')}
            register={register('vcRegOp')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vc_reg_op', 'vcRegOp')}
            values={getValues('vcRegOp')}
          />
        </div>
      </div>
      <hr className='fr-hr fr-mt-3w' />
    </SectionDétailsMetadataParametreCalculIndicateurStyled>
  );
};

export default SectionDétailsMetadataParametreIndicateurRegionale;
