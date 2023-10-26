import '@gouvfr/dsfr/dist/component/table/table.min.css';
import FicheIndicateurStyled from '@/components/PageIndicateur/FicheIndicateur/FicheIndicateur.styled';
import SectionTableauIndicateur from '@/components/PageIndicateur/FicheIndicateur/SectionTableauIndicateur/SectionTableauIndicateur';
import SectionDétailsMetadataIndicateur from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataIndicateur/SectionDétailsMetadataIndicateur';
import SectionDétailsMetadataParametreIndicateur
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateur/SectionDétailsMetadataParametreIndicateur';
import SectionSelectionIndicateur
  from '@/components/PageIndicateur/FicheIndicateur/SectionSelectionIndicateur/SectionSelectionIndicateur';
import SectionDétailsMetadataAutresIndicateur
  from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataAutresIndicateur/SectionDétailsMetadataAutresIndicateur';
import FicheIndicateurProps from './FicheIndicateur.interface';

export default function FicheIndicateur({ indicateur, estEnCoursDeModification, mapInformationMetadataIndicateur }: FicheIndicateurProps) {
  return (
    <FicheIndicateurStyled>
      <SectionSelectionIndicateur
        estEnCoursDeModification={estEnCoursDeModification}
      />
      <SectionTableauIndicateur indicateur={indicateur} />
      <SectionDétailsMetadataIndicateur
        estEnCoursDeModification={estEnCoursDeModification}
        indicateur={indicateur}
        mapInformationMetadataIndicateur={mapInformationMetadataIndicateur}
      />
      <SectionDétailsMetadataParametreIndicateur
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
