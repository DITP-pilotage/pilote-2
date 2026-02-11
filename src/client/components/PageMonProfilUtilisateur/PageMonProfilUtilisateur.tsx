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
import useMonProfilFormulaire from "./useMonProfilFormulaire";
import SelectMinistere from "./SelectMinistere";
import SelectService from "./SelectService";
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

      <SelectMinistere />

      <SelectService />

      {serviceSelectionne === "autre" && (
        <div>
          <InputAvecLabel
            className="fr-mb-1w"
            htmlName="serviceAutre"
            libellé="Précisez votre service"
            register={register("serviceAutre")}
            erreur={formState.errors.serviceAutre}
            type="text"
          />
          <p className="fr-mb-0 !text-sm">
            Afin de nous aider à compléter cette liste, merci de nous indiquer
            votre rattachement. Cette information ne sera pas publiée dans un
            premier temps.
          </p>
        </div>
      )}

      <InputAvecLabel
        erreur={formState.errors.fonction}
        htmlName="fonction"
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

  const soumettreFormulaire = (data: MonProfilUtilisateurFormInputs) => {
    mutationModifierMonProfil.mutate({
      ...data,
      csrf: récupérerUnCookie("csrf") ?? "",
    });
  };

  return (
    <div className="max-w-screen-xl mx-auto py-10">
      <div className="flex flex-col gap-6">
        <Titre baliseHtml="h1" className="fr-h2 mb-0">
          Mes informations PILOTE
        </Titre>

        {alerte ? <Alerte {...alerte} /> : null}

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(soumettreFormulaire)}>
            <Bloc titre="Mon identité">
              <div className="flex flex-col gap-4">
                <PageMonProfilUtilisateurContent />
              </div>
            </Bloc>

            <div className="flex justify-end">
              <SubmitBouton
                disabled={mutationModifierMonProfil.isPending}
                label="Enregistrer"
              />
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};
