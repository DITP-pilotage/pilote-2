import { FunctionComponent } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import useDétailsMetadataParametreIndicateurNationaleForm
, { MetadataParametrageParametreIndicateurNationaleForm }  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurNationale/useDétailsMetadataParametreIndicateurNationaleForm';
import SectionDétailsMetadataParametreIndicateurNationaleStyled
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurNationale/SectionDétailsMetadataParametreIndicateurNationale.styled';
import { MapInformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import {
  MetadataIndicateurSelecteur,
} from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurSelecteur';
import {
  mappingAcceptedValues,
  mappingDisplayAcceptedValues,
} from '@/components/PageIndicateur/FicheIndicateur/commons/utils';

const SectionDétailsMetadataParametreIndicateurNationale: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat
  estEnCoursDeModification: boolean
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat
}> = ({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
}) => {
  const { register, getValues, errors, setValue } = useDétailsMetadataParametreIndicateurNationaleForm();

  const valeursNatFromDesactiveRegOp = new Set(['DEPT', 'REG', 'sub_indic']);
  const ALaModificationValeurNatFrom = (variableFrom: keyof MetadataParametrageParametreIndicateurNationaleForm, valeurFrom: string, variableOp: keyof MetadataParametrageParametreIndicateurNationaleForm, variableParDefautOp: string) => {
    setValue(variableFrom, valeurFrom);
    if (valeursNatFromDesactiveRegOp.has(valeurFrom)) {
      setValue(variableOp, variableParDefautOp);
    }
  };

  return (
    <SectionDétailsMetadataParametreIndicateurNationaleStyled>
      <Titre
        baliseHtml='h2'
        className='fr-h5'
      >
        Maille nationale
      </Titre>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.viNatFrom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vi_nat_from}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_nat_from')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_nat_from', 'viNatFrom')}
            valeurModifiéeCallback={valeur => {
              ALaModificationValeurNatFrom('viNatFrom', valeur, 'viNatOp', mapInformationMetadataIndicateur.vi_nat_op.metaPiloteDefaultValue as string);
            }}
            values={getValues('viNatFrom')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.vaNatFrom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.va_nat_from}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_nat_from')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_nat_from', 'vaNatFrom')}
            valeurModifiéeCallback={valeur => {
              ALaModificationValeurNatFrom('vaNatFrom', valeur, 'vaNatOp', mapInformationMetadataIndicateur.va_nat_op.metaPiloteDefaultValue as string);
            }}
            values={getValues('vaNatFrom')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.vcNatFrom?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vc_nat_from}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vc_nat_from')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vc_nat_from', 'vcNatFrom')}
            valeurModifiéeCallback={valeur => {
              ALaModificationValeurNatFrom('vcNatFrom', valeur, 'vcNatOp', mapInformationMetadataIndicateur.va_nat_op.metaPiloteDefaultValue as string);              
            }}
            values={getValues('vcNatFrom')}
          />
        </div>
      </div>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.viNatOp?.message}
            estDesactive={valeursNatFromDesactiveRegOp.has(getValues('viNatFrom'))}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vi_nat_op}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_nat_op')}
            register={register('viNatOp')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vi_nat_op', 'viNatOp')}
            values={getValues('viNatOp')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.vaNatOp?.message}
            estDesactive={valeursNatFromDesactiveRegOp.has(getValues('vaNatFrom'))}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.va_nat_op}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_nat_op')}
            register={register('vaNatOp')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'va_nat_op', 'vaNatOp')}
            values={getValues('vaNatOp')}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurSelecteur
            erreurMessage={errors.vcNatOp?.message}
            estDesactive={valeursNatFromDesactiveRegOp.has(getValues('vcNatFrom'))}
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={mapInformationMetadataIndicateur.vc_nat_op}
            listeValeur={mappingAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vc_nat_op')}
            register={register('vcNatOp')}
            valeurAffiché={mappingDisplayAcceptedValues(mapInformationMetadataIndicateur, indicateur, 'vc_nat_op', 'vcNatOp')}
            values={getValues('vcNatOp')}
          />
        </div>
      </div>
      <hr className='fr-hr fr-mt-3w' />
    </SectionDétailsMetadataParametreIndicateurNationaleStyled>
  );
};

export default SectionDétailsMetadataParametreIndicateurNationale;
