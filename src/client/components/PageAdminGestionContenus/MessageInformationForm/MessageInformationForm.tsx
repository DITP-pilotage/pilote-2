import { FunctionComponent } from "react";
import { Controller } from "react-hook-form";
import Interrupteur from "@/components/_commons/Interrupteur/Interrupteur";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import { useMessageInformationForm } from "@/components/PageAdminGestionContenus/MessageInformationForm/useMessageInformationForm";
import TextArea from "@/components/_commons/TextArea/TextArea";

const MessageInformationForm: FunctionComponent = () => {
  const form = useMessageInformationForm();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-column">
        <p className="fr-text--md bold fr-mb-1v relative">
          Type de message et de bannière
        </p>
        <div className="flex">
          <Controller
            control={form.control}
            name="bandeauType"
            render={({ field }) => {
              return (
                <Sélecteur
                  htmlName="bandeauType"
                  onChange={field.onChange}
                  options={[
                    { valeur: "WARNING", libellé: "Alerte (fond rouge)" },
                    { valeur: "INFO", libellé: "Information (fond bleu)" },
                  ].map((acceptedValue) => ({
                    valeur: acceptedValue.valeur,
                    libellé: acceptedValue.libellé,
                  }))}
                  valeurSélectionnée={field.value}
                />
              );
            }}
          />
        </div>
      </div>
      <div>
        <p className="fr-text--md bold fr-mb-1v relative">Rédigez le message</p>
        <Controller
          control={form.control}
          name="bandeauTexte"
          render={({ field }) => {
            return (
              <TextArea
                className="h-40"
                erreurMessage={form.formState.errors.bandeauTexte?.message}
                htmlName="bandeauTexte"
                onChange={field.onChange}
                value={field.value}
              />
            );
          }}
        />
      </div>

      <Controller
        control={form.control}
        name="isBandeauActif"
        render={({ field }) => {
          return (
            <Interrupteur
              checked={field.value}
              libellé="Activer la bannière"
              messageSecondaire="Activer la bannière pour la rendre visible à tous les utilisateurs de PILOTE"
              onChange={field.onChange}
            />
          );
        }}
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
