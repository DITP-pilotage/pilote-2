import useSelectionIndicateurForm
  from '@/components/PageIndicateur/FicheIndicateur/SectionSelectionIndicateur/useSelectionIndicateurForm';
import SélecteurIndicateurActif
  from '@/components/PageIndicateur/FicheIndicateur/SectionSelectionIndicateur/SélecteurIndicateurActif/SélecteurIndicateurActif';

interface SectionSelectionIndicateurProps {
  estEnCoursDeModification: boolean
}

export default function SectionSelectionIndicateur({ estEnCoursDeModification }: SectionSelectionIndicateurProps) {
  const { setValue, getValues } = useSelectionIndicateurForm();


  return (
    <SélecteurIndicateurActif
      estEnCoursDeModification={estEnCoursDeModification}
      etatIndicateurSélectionné={getValues('indicHiddenPilote')}
      setEtatIndicateurSélectionné={setValue}
    />
  );
}
