import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { z } from "zod";
import { useSession } from "next-auth/react";
import Bloc from "@/components/_commons/Bloc/Bloc";
import Titre from "@/components/_commons/Titre/Titre";
import InputAvecLabel from "@/components/_commons/InputAvecLabel/InputAvecLabel";
import { SubmitBouton } from "@/components/_commons/SubmitBouton/SubmitBouton";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { validationModifierMonProfil } from "@/validation/monProfil";
import type AlerteProps from "@/components/_commons/Alerte/Alerte.interface";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";

type MonProfilUtilisateurFormInputs = z.infer<
  typeof validationModifierMonProfil
>;

export const PageMonProfilUtilisateur = ({
  utilisateur,
}: {
  utilisateur: {
    email: string;
    nom: string;
    prenom: string;
    fonction: string | null;
  };
}) => {
  const session = useSession();
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);

  const mutationModifierMonProfil =
    api.utilisateur.modifierMonProfil.useMutation({
      onSuccess: async () => {
        await session.update();
        setAlerte({
          type: "succès",
          titre: "Vos informations ont été modifiées avec succès",
        });
      },
      onError: (error) => {
        setAlerte({
          type: "erreur",
          titre: error.message,
        });
      },
    });

  const soumettreFormulaire = (data: MonProfilUtilisateurFormInputs) => {
    mutationModifierMonProfil.mutate({
      ...data,
      csrf: récupérerUnCookie("csrf") ?? "",
    });
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MonProfilUtilisateurFormInputs & { email: string }>({
    resolver: zodResolver(validationModifierMonProfil),
    defaultValues: {
      email: utilisateur.email,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      fonction: utilisateur.fonction,
    },
  });

  return (
    <div className="fr-container py-10">
      <div className="flex flex-col gap-6">
        <Titre baliseHtml="h1" className="fr-h2 mb-0">
          Mes informations PILOTE
        </Titre>

        {alerte ? <Alerte {...alerte} /> : null}

        <Bloc titre="Mon identité">
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit(soumettreFormulaire)}
          >
            <InputAvecLabel
              disabled
              erreur={undefined}
              htmlName="email"
              libellé="Adresse électronique"
              register={register("email")}
              type="email"
            />

            <InputAvecLabel
              erreur={errors.prenom}
              htmlName="prénom"
              libellé="Prénom"
              register={register("prenom")}
              type="text"
            />

            <InputAvecLabel
              erreur={errors.nom}
              htmlName="nom"
              libellé="Nom"
              register={register("nom")}
              type="text"
            />

            <InputAvecLabel
              erreur={errors.fonction}
              htmlName="fonction"
              libellé="Fonction"
              register={register("fonction")}
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
