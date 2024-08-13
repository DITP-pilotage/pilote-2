import { FunctionComponent } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import SectionDétailsMetadataParametrePonderationIndicateurStyled
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametrePonderationIndicateur/SectionDétailsMetadataParametrePonderationIndicateur.styled';
import useDétailsMetadataParametrePonderationIndicateurForm
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametrePonderationIndicateur/useDétailsMetadataParametrePonderationndicateurForm';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import { MapInformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import { MetadataIndicateurInput } from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurInput';

const SectionDétailsMetadataParametrePonderationIndicateur: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat
  estEnCoursDeModification: boolean
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat
}> = ({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
}) => {
  const { register, errors } = useDétailsMetadataParametrePonderationIndicateurForm();

  return (
    <SectionDétailsMetadataParametrePonderationIndicateurStyled>
      <Titre
        baliseHtml='h2'
        className='fr-h5'
      >
        Paramétrages - Pondération de l'indicateur dans le calcul du taux d'avancement global
      </Titre>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurInput
            erreurMessage={errors.poidsPourcentDept?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='poidsPourcentDept'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.poids_pourcent_dept_declaree}
            register={register('poidsPourcentDept', { value: `${indicateur.poidsPourcentDept}` })}
            valeurAffiché={`${indicateur.poidsPourcentDept}`}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurInput
            erreurMessage={errors.poidsPourcentReg?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='poidsPourcentReg'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.poids_pourcent_reg_declaree}
            register={register('poidsPourcentReg', { value: `${indicateur.poidsPourcentReg}` })}
            valeurAffiché={`${indicateur.poidsPourcentReg}`}
          />
        </div>
        <div className='fr-col-12 fr-col-md-4'>
          <MetadataIndicateurInput
            erreurMessage={errors.poidsPourcentNat?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName='poidsPourcentNat'
            informationMetadataIndicateur={mapInformationMetadataIndicateur.poids_pourcent_nat_declaree}
            register={register('poidsPourcentNat', { value: `${indicateur.poidsPourcentNat}` })}
            valeurAffiché={`${indicateur.poidsPourcentNat}`}
          />
        </div>
      </div>
      <hr className='fr-hr fr-mt-3w' />
    </SectionDétailsMetadataParametrePonderationIndicateurStyled>
  );
};

export default SectionDétailsMetadataParametrePonderationIndicateur;
