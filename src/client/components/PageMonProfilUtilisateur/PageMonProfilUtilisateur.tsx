import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { z } from "zod";
import Bloc from "@/components/_commons/Bloc/Bloc";
import Titre from "@/components/_commons/Titre/Titre";
import InputAvecLabel from "@/components/_commons/InputAvecLabel/InputAvecLabel";
import { SubmitBouton } from "@/components/_commons/SubmitBouton/SubmitBouton";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { validationModifierMonProfil } from "@/validation/monProfil";
import type AlerteProps from "@/components/_commons/Alerte/Alerte.interface";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { useProfilUtilisateurConnecte } from "@/client/hooks/useProfilUtilisateurConnecte";

type MonProfilUtilisateurFormInputs = z.infer<
  typeof validationModifierMonProfil
>;

function useModifierProfilUtilisateur(setAlert: (props: AlerteProps) => void) {
  const { refetch } = api.profilUtilisateur.getUtilisateurConnecte.useQuery();
  return api.utilisateur.modifierMonProfil.useMutation({
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

export const PageMonProfilUtilisateur = () => {
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);
  const mutationModifierMonProfil = useModifierProfilUtilisateur(setAlerte);
  const utilisateur = useProfilUtilisateurConnecte();

  const soumettreFormulaire = (data: MonProfilUtilisateurFormInputs) => {
    mutationModifierMonProfil.mutate({
      ...data,
      csrf: récupérerUnCookie("csrf") ?? "",
    });
  };

  const form = useForm<MonProfilUtilisateurFormInputs & { email: string }>({
    resolver: zodResolver(validationModifierMonProfil),
    defaultValues: {
      email: utilisateur.email,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      fonction: utilisateur.fonction,
    },
  });

  return (
    <div className="max-w-screen-xl mx-auto py-10">
      <div className="flex flex-col gap-6">
        <Titre baliseHtml="h1" className="fr-h2 mb-0">
          Mes informations PILOTE
        </Titre>

        {alerte ? <Alerte {...alerte} /> : null}

        <Bloc titre="Mon identité">
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit(soumettreFormulaire)}
          >
            <InputAvecLabel
              disabled
              erreur={undefined}
              htmlName="email"
              isRequired
              libellé="Adresse électronique"
              register={form.register("email")}
              type="email"
            />

            <InputAvecLabel
              erreur={form.formState.errors.prenom}
              htmlName="prénom"
              isRequired
              libellé="Prénom"
              register={form.register("prenom")}
              type="text"
            />

            <InputAvecLabel
              erreur={form.formState.errors.nom}
              htmlName="nom"
              isRequired
              libellé="Nom"
              register={form.register("nom")}
              type="text"
            />

            <InputAvecLabel
              erreur={form.formState.errors.fonction}
              htmlName="fonction"
              libellé="Fonction"
              register={form.register("fonction")}
              type="text"
            />

            <div className="flex justify-end">
              <SubmitBouton
                disabled={mutationModifierMonProfil.isLoading}
                label="Enregistrer"
              />
            </div>
          </form>
        </Bloc>
      </div>
    </div>
  );
};
