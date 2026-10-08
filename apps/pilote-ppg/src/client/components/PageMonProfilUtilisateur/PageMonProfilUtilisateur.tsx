import { FormProvider } from "react-hook-form";
import { FIELD_GROUP_SPACING } from "@/components/shared/fieldGroupSpacing";
import { TextField } from "@/components/shared/TextField";
import { Button } from "@/components/shared/Button";
import { useState } from "react";
import { z } from "zod";
import Bloc from "@/components/_commons/Bloc/Bloc";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { validationModifierMonProfil } from "@/validation/mon-profil";
import type AlerteProps from "@/components/_commons/Alerte/Alerte.interface";
import { api } from "@/server/framework/trpc/api";
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
      <TextField
        className={FIELD_GROUP_SPACING}
        disabled
        id="email"
        required
        label="Adresse électronique"
        type="email"
        {...register("email")}
      />

      <TextField
        className={FIELD_GROUP_SPACING}
        errorMessage={formState.errors.prenom?.message?.toString()}
        id="prénom"
        required
        label="Prénom"
        type="text"
        {...register("prenom")}
      />

      <TextField
        className={FIELD_GROUP_SPACING}
        errorMessage={formState.errors.nom?.message?.toString()}
        id="nom"
        required
        label="Nom"
        type="text"
        {...register("nom")}
      />

      <SelectService />

      {serviceSelectionne === "autre" && (
        <div>
          <TextField
            className="mb-2"
            id="serviceAutre"
            required
            label="Précisez votre service"
            errorMessage={formState.errors.serviceAutre?.message?.toString()}
            type="text"
            {...register("serviceAutre")}
          />
          <p className="!text-sm">
            Afin de nous aider à compléter cette liste, merci de nous indiquer
            votre rattachement. Cette information ne sera pas publiée dans un
            premier temps.
          </p>
        </div>
      )}

      <TextField
        className={FIELD_GROUP_SPACING}
        errorMessage={formState.errors.fonction?.message?.toString()}
        id="fonction"
        required
        label="Fonction"
        type="text"
        {...register("fonction")}
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
          <h1 className="text-h1 md:text-h1-md text-primary mt-8 mb-0">
            Mon profil utilisateur
          </h1>

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
                  <Button
                    disabled={mutationModifierMonProfil.isPending}
                    iconRight={
                      <Icone
                        className="text-current h-4 w-4"
                        icone={ArrowLine1Icon}
                      />
                    }
                    title="Enregistrer"
                    type="submit"
                  >
                    Enregistrer
                  </Button>
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
