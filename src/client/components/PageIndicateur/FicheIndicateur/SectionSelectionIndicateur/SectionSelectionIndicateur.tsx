import { FunctionComponent } from "react";
import useSelectionIndicateurForm from "@/components/PageIndicateur/FicheIndicateur/SectionSelectionIndicateur/useSelectionIndicateurForm";
import SélecteurIndicateurActif from "@/components/PageIndicateur/FicheIndicateur/SectionSelectionIndicateur/SélecteurIndicateurActif/SélecteurIndicateurActif";

interface SectionSelectionIndicateurProps {
  estEnCoursDeModification: boolean;
}

const SectionSelectionIndicateur: FunctionComponent<
  SectionSelectionIndicateurProps
> = ({ estEnCoursDeModification }) => {
  const { setValue, getValues } = useSelectionIndicateurForm();

  return (
    <div className="flex w-full justify-between align-center">
      <SélecteurIndicateurActif
        estEnCoursDeModification={estEnCoursDeModification}
        etatIndicateurSélectionné={getValues("indicHiddenPilote")}
        setEtatIndicateurSélectionné={setValue}
      />
    </div>
  );
};

export default SectionSelectionIndicateur;
