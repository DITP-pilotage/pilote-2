import { useFormContext } from "react-hook-form";
import { useRouter } from "next/router";
import { récupérerUnCookie } from "@/client/utils/cookies";
import api from "@/server/infrastructure/api/trpc/api";
import { UtilisateurFormInputs } from "@/client/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire.interface";
import { Toaster } from "@/client/utils/toaster";

export default function useRécapitulatifUtilisateur() {
  const { getValues } = useFormContext<UtilisateurFormInputs>();
  const utilisateur = getValues();

  const router = useRouter();

  const mutationCréerUtilisateur = api.utilisateur.créer.useMutation({
    onSuccess: () => {
      Toaster.success("Bravo, le compte a bien été créé !");
      router.push("/admin/utilisateurs");
    },
    onError: (error) => {
      Toaster.error(error.message);
    },
  });

  const mutationModifierUtilisateur = api.utilisateur.modifier.useMutation({
    onSuccess: () => {
      Toaster.success("Bravo, le compte a bien été modifié !");
      router.push("/admin/utilisateurs");
    },
    onError: (error) => {
      Toaster.error(error.message);
    },
  });

  const envoyerFormulaireUtilisateur = (utilisateurExistant: boolean) => {
    if (utilisateurExistant)
      mutationModifierUtilisateur.mutate({
        ...utilisateur,
        csrf: récupérerUnCookie("csrf") ?? "",
      });
    else
      mutationCréerUtilisateur.mutate({
        ...utilisateur,
        csrf: récupérerUnCookie("csrf") ?? "",
      });
  };

  return {
    utilisateur,
    envoyerFormulaireUtilisateur,
  };
}
