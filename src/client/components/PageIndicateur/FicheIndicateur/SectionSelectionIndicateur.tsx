import { FunctionComponent } from "react";
import { Controller } from "react-hook-form";
import { SélecteurIndicateurActif } from "@/components/PageIndicateur/FicheIndicateur/commons/SélecteurIndicateurActif";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";

interface SectionSelectionIndicateurProps {
  estEnCoursDeModification: boolean;
}

const SectionSelectionIndicateur: FunctionComponent<
  SectionSelectionIndicateurProps
> = ({ estEnCoursDeModification }) => {
  const form = useMetadataIndicateurForm();

  return (
    <div className="flex w-full justify-between align-center m-4">
      <Controller
        control={form.control}
        name="indicHiddenPilote"
        render={({ field }) => (
          <SélecteurIndicateurActif
            estEnCoursDeModification={estEnCoursDeModification}
            onChange={field.onChange}
            value={field.value}
          />
        )}
      />
    </div>
  );
};

export default SectionSelectionIndicateur;
