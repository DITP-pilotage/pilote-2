import { FormProvider } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import Bloc from "@/components/_commons/Bloc/Bloc";
import Titre from "@/components/_commons/Titre/Titre";
import InputAvecLabel from "@/components/_commons/InputAvecLabel/InputAvecLabel";
import { SubmitBouton } from "@/components/_commons/SubmitBouton/SubmitBouton";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { validationModifierMonProfil } from "@/validation/mon-profil";
import type AlerteProps from "@/components/_commons/Alerte/Alerte.interface";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";
import { useProfilUtilisateurConnecte } from "@/client/hooks/useProfilUtilisateurConnecte";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { useMonProfilFormulaire } from "./useMonProfilFormulaire";
import { SelectService } from "./SelectService";
import { useMonProfilForm } from "./form";

type MonProfilUtilisateurFormInputs = z.infer<
  typeof validationModifierMonProfil
>;

function useModifierProfilUtilisateur(setAlert: (props: AlerteProps) => void) {
  const { refetch } = api.profilUtilisateur.getUtilisateurConnecte.useQuery();
  return api.profilUtilisateur.modifierMonProfil.useMutation({
    onSuccess: async () => {
      await refetch();
      setAlert({
        type: "succès",
        titre: "Vos informations ont été modifiées avec succès",
      });
    },
    onError: (error) => {
      setAlert({
        type: "erreur",
        titre: error.message,
      });
    },
  });
}

const PageMonProfilUtilisateurContent = () => {
  const { watch, register, formState } = useMonProfilForm();
  const serviceSelectionne = watch("service");

  return (
    <>
      <InputAvecLabel
        disabled
        erreur={undefined}
        htmlName="email"
        isRequired
        libellé="Adresse électronique"
        register={register("email")}
        type="email"
      />

      <InputAvecLabel
        erreur={formState.errors.prenom}
        htmlName="prénom"
        isRequired
        libellé="Prénom"
        register={register("prenom")}
        type="text"
      />

      <InputAvecLabel
        erreur={formState.errors.nom}
        htmlName="nom"
        isRequired
        libellé="Nom"
        register={register("nom")}
        type="text"
      />

      <SelectService />

      {serviceSelectionne === "autre" && (
        <div>
          <InputAvecLabel
            className="fr-mb-1w"
            htmlName="serviceAutre"
            isRequired
            libellé="Précisez votre service"
            register={register("serviceAutre")}
            erreur={formState.errors.serviceAutre}
            type="text"
          />
          <p className="!text-sm">
            Afin de nous aider à compléter cette liste, merci de nous indiquer
            votre rattachement. Cette information ne sera pas publiée dans un
            premier temps.
          </p>
        </div>
      )}

      <InputAvecLabel
        erreur={formState.errors.fonction}
        htmlName="fonction"
        isRequired
        libellé="Fonction"
        register={register("fonction")}
        type="text"
      />
    </>
  );
};

export const PageMonProfilUtilisateur = () => {
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);
  const mutationModifierMonProfil = useModifierProfilUtilisateur(setAlerte);
  const form = useMonProfilFormulaire();
  const profilUtilisateur = useProfilUtilisateurConnecte();

  const soumettreFormulaire = (data: MonProfilUtilisateurFormInputs) => {
    mutationModifierMonProfil.mutate({
      ...data,
      csrf: récupérerUnCookie("csrf") ?? "",
    });
  };

  return (
    <div className="bg-dsfr-alt-blue-france">
      <div className="fr-container py-10">
        <div className="flex flex-col gap-6">
          <Titre baliseHtml="h1" className="fr-h1 text-primary fr-mt-4w mb-0">
            Mon profil utilisateur
          </Titre>

          {alerte ? <Alerte {...alerte} /> : null}

          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(soumettreFormulaire)}>
              <Bloc className="fr-px-10w fr-py-6w flex flex-col gap-4">
                <div>
                  <h2 className="!mb-2 !text-lg">Identification</h2>
                  <p className="!text-xs !text-dsfr-mention-grey !mb-8">
                    Tous les champs sont obligatoires.
                  </p>
                </div>

                <PageMonProfilUtilisateurContent />

                <div className="flex flex-col items-end gap-2">
                  <SubmitBouton
                    disabled={mutationModifierMonProfil.isPending}
                    label="Enregistrer"
                    iconRight={
                      <Icone
                        className="text-current h-4 w-4"
                        icone={ArrowLine1Icon}
                      />
                    }
                  />
                  <p className="!text-sm !text-dsfr-mention-grey !mb-0">
                    {`Modifié le ${PiloteDateFormatter.isoDateTimeFranceMetropolitaine(profilUtilisateur.dateModification)}`}
                  </p>
                </div>
              </Bloc>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
};
