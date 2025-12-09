import { FunctionComponent } from "react";
import Interrupteur from "@/components/_commons/Interrupteur/Interrupteur";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import { useMessageInformationForm } from "@/components/PageAdminGestionContenus/MessageInformationForm/useMessageInformationForm";
import TextArea from "@/components/_commons/TextArea/TextArea";

const MessageInformationForm: FunctionComponent<{}> = () => {
  const { errors, register, getValues, setValue } = useMessageInformationForm();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-column">
        <p className="fr-text--md bold fr-mb-1v relative">
          Type de message et de bannière
        </p>
        <div className="flex">
          <Sélecteur
            htmlName="bandeauType"
            options={[
              { valeur: "WARNING", libellé: "Alerte (fond rouge)" },
              { valeur: "INFO", libellé: "Information (fond bleu)" },
            ].map((acceptedValue) => ({
              valeur: acceptedValue.valeur,
              libellé: acceptedValue.libellé,
            }))}
            register={register("bandeauType")}
            valeurSélectionnée={`${getValues("bandeauType")}`}
          />
        </div>
      </div>
      <div>
        <p className="fr-text--md bold fr-mb-1v relative">Rédigez le message</p>
        <TextArea
          className="h-40"
          erreur={errors.bandeauTexte}
          htmlName="bandeauTexte"
          register={register("bandeauTexte")}
        />
      </div>
      <Interrupteur
        checked={getValues("isBandeauActif")}
        libellé="Activer la bannière"
        messageSecondaire="Activer la bannière pour la rendre visible à tous les utilisateurs de PILOTE"
        onChange={(isChecked) => setValue("isBandeauActif", isChecked)}
      />
      <div className="w-full flex justify-end">
        <button
          className="fr-btn fr-mr-2w"
          key="submit-bandeau-indispobilite"
          type="submit"
        >
          Valider les modifications
        </button>
      </div>
    </div>
  );
};

export default MessageInformationForm;
