import { FunctionComponent } from "react";
import { Controller } from "react-hook-form";
import SélecteurIndicateurActif from "@/components/PageIndicateur/FicheIndicateur/SectionSelectionIndicateur/SélecteurIndicateurActif/SélecteurIndicateurActif";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";

interface SectionSelectionIndicateurProps {
  estEnCoursDeModification: boolean;
}

const SectionSelectionIndicateur: FunctionComponent<
  SectionSelectionIndicateurProps
> = ({ estEnCoursDeModification }) => {
  const form = useMetadataIndicateurForm();

  return (
    <div className="flex w-full justify-between align-center">
      <Controller
        control={form.control}
        name="indicHiddenPilote"
        render={({ field }) => {
          return (
            <SélecteurIndicateurActif
              estEnCoursDeModification={estEnCoursDeModification}
              etatIndicateurSélectionné={field.value}
              setEtatIndicateurSélectionné={field.onChange}
            />
          );
        }}
      />
    </div>
  );
};

export default SectionSelectionIndicateur;
