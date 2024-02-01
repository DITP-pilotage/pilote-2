import Titre from '@/components/_commons/Titre/Titre';
import SectionDétailsMetadataParametrePonderationIndicateurStyled
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametrePonderationIndicateur/SectionDétailsMetadataParametrePonderationIndicateur.styled';
import Input from '@/components/_commons/Input/Input';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import useDétailsMetadataParametrePonderationIndicateurForm
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametrePonderationIndicateur/useDétailsMetadataParametrePonderationndicateurForm';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import { MapInformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';

export default function SectionDétailsMetadataParametrePonderationIndicateur({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
}: {
  indicateur: MetadataParametrageIndicateurContrat
  estEnCoursDeModification: boolean
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat
}) {
  const { register, errors } = useDétailsMetadataParametrePonderationIndicateurForm();

  return (
    <SectionDétailsMetadataParametrePonderationIndicateurStyled>
      <Titre
        baliseHtml='h2'
        className='fr-h5'
      >
        Paramétrages - Pondération de l'indicateur dans le calcul du taux d'avancement global
      </Titre>
      <div className='fr-grid-row fr-mb-2w'>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.poids_pourcent_dept.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='poidsPourcentDept'>
                {mapInformationMetadataIndicateur.poids_pourcent_dept.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.poidsPourcentDept}
                htmlName='poidsPourcentDept'
                key='poidsPourcentDept'
                libellé='poidsPourcentDept'
                register={register('poidsPourcentDept', { value: `${indicateur?.poidsPourcentDept}` })}
                type='number'
              />
            : (
              <span>
                {indicateur.poidsPourcentDept}
              </span>
            )}
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pr-2w  fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.poids_pourcent_reg.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='poidsPourcentReg'>
                {mapInformationMetadataIndicateur.poids_pourcent_reg.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.poidsPourcentReg}
                htmlName='poidsPourcentReg'
                key='poidsPourcentReg'
                libellé='poidsPourcentReg'
                register={register('poidsPourcentReg', { value: `${indicateur?.poidsPourcentReg}` })}
                type='number'
              />
            : (
              <span>
                {indicateur.poidsPourcentReg}
              </span>
            )}
        </div>
        <div className='fr-col-12 fr-col-md-4 fr-pl-2w'>
          <div className='fr-text--md bold fr-mb-1v relative'>
            {mapInformationMetadataIndicateur.poids_pourcent_nat.metaPiloteAlias}
            {estEnCoursDeModification ? (
              <Infobulle idHtml='poidsPourcentNat'>
                {mapInformationMetadataIndicateur.poids_pourcent_nat.description}
              </Infobulle>
            ) : null}
          </div>
          {estEnCoursDeModification
            ? <Input
                erreur={errors.poidsPourcentNat}
                htmlName='poidsPourcentNat'
                key='poidsPourcentNat'
                libellé='poidsPourcentNat'
                register={register('poidsPourcentNat', { value: `${indicateur?.poidsPourcentNat}` })}
                type='number'
              />
            : (
              <span>
                {indicateur.poidsPourcentNat}
              </span>
            )}
        </div>
      </div>
      <hr className='fr-hr fr-mt-3w' />
    </SectionDétailsMetadataParametrePonderationIndicateurStyled>
  );
}







