import '@gouvfr/dsfr/dist/component/table/table.min.css';
import FicheIndicateurStyled from '@/components/PageIndicateur/FicheIndicateur/FicheIndicateur.styled';
import SectionTableauIndicateur
  from '@/components/PageIndicateur/FicheIndicateur/SectionTableauIndicateur/SectionTableauIndicateur';
import SectionDétailsMetadataIndicateur
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataIndicateur/SectionDétailsMetadataIndicateur';
import SectionDétailsMetadataParametreCalculIndicateur
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreCalculIndicateur/SectionDétailsMetadataParametreCalculIndicateur';
import SectionSelectionIndicateur
  from '@/components/PageIndicateur/FicheIndicateur/SectionSelectionIndicateur/SectionSelectionIndicateur';
import SectionDétailsMetadataAutresIndicateur
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataAutresIndicateur/SectionDétailsMetadataAutresIndicateur';
import SectionDétailsMetadataParametreIndicateurDepartementale
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurDepartementale/SectionDétailsMetadataParametreIndicateurDepartementale';
import SectionDétailsMetadataParametreIndicateurRegionale
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurRegionale/SectionDétailsMetadataParametreIndicateurRegionale';
import SectionDétailsMetadataParametreIndicateurNationale
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurNationale/SectionDétailsMetadataParametreIndicateurNationale';
import SectionDétailsMetadataParametrePonderationIndicateur
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametrePonderationIndicateur/SectionDétailsMetadataParametrePonderationIndicateur';
import FicheIndicateurProps from './FicheIndicateur.interface';

export default function FicheIndicateur({ indicateur, estEnCoursDeModification, mapInformationMetadataIndicateur, chantiers }: FicheIndicateurProps) {
  return (
    <FicheIndicateurStyled>
      <SectionSelectionIndicateur
        estEnCoursDeModification={estEnCoursDeModification}
      />
      <SectionTableauIndicateur indicateur={indicateur} />
      <SectionDétailsMetadataIndicateur
        chantiers={chantiers}
        estEnCoursDeModification={estEnCoursDeModification}
        indicateur={indicateur}
        mapInformationMetadataIndicateur={mapInformationMetadataIndicateur}
      />
      <SectionDétailsMetadataParametreIndicateurDepartementale
        estEnCoursDeModification={estEnCoursDeModification}         
        indicateur={indicateur}
        mapInformationMetadataIndicateur={mapInformationMetadataIndicateur}
      />
      <SectionDétailsMetadataParametreIndicateurRegionale
        estEnCoursDeModification={estEnCoursDeModification}
        indicateur={indicateur}
        mapInformationMetadataIndicateur={mapInformationMetadataIndicateur}
      />
      <SectionDétailsMetadataParametreIndicateurNationale
        estEnCoursDeModification={estEnCoursDeModification}
        indicateur={indicateur}
        mapInformationMetadataIndicateur={mapInformationMetadataIndicateur}
      />
      <SectionDétailsMetadataParametreCalculIndicateur
        estEnCoursDeModification={estEnCoursDeModification}
        indicateur={indicateur}
        mapInformationMetadataIndicateur={mapInformationMetadataIndicateur}
      />
      <SectionDétailsMetadataParametrePonderationIndicateur
        estEnCoursDeModification={estEnCoursDeModification}
        indicateur={indicateur}
        mapInformationMetadataIndicateur={mapInformationMetadataIndicateur}
      />
      <SectionDétailsMetadataAutresIndicateur
        estEnCoursDeModification={estEnCoursDeModification}
        indicateur={indicateur}
        mapInformationMetadataIndicateur={mapInformationMetadataIndicateur}
      />

    </FicheIndicateurStyled>
  );
}
