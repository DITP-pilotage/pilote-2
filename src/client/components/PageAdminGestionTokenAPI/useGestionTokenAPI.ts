import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { validationCreationTokenAPI } from "@/validation/gestion-token-api";
import { Toaster } from "@/client/utils/toaster";

export type TokenAPIForm = {
  email: string;
};

export const useGestionTokenAPI = () => {
  const router = useRouter();

  const reactHookForm = useForm<TokenAPIForm>({
    resolver: zodResolver(validationCreationTokenAPI),
  });

  const mutationCreerTokenAPI = api.gestionTokenAPI.creerTokenAPI.useMutation({
    onSuccess: async (result) => {
      try {
        await navigator.clipboard.writeText(result);
      } catch (error) {
        return error;
      }

      Toaster.success(
        "Le token d'authentification est généré pour cet utilisateur et est sauvegardé dans votre presse-papier.",
      );
    },
    onError: (error) => {
      Toaster.error(error.message);
    },
  });

  const mutationSupprimerTokenAPI =
    api.gestionTokenAPI.supprimerTokenAPI.useMutation({
      onSuccess: () => {
        Toaster.success(
          "Le token a correctement été supprimé, le consommateur ne pourra plus l'utiliser",
        );
        router.push("/admin/gestion-token-api");
      },
      onError: (error) => {
        if (error.data?.code === "INTERNAL_SERVER_ERROR") {
          Toaster.error(error.message);
        }
      },
    });

  const creerTokenAPI: SubmitHandler<TokenAPIForm> = async (data) => {
    const inputs = {
      csrf: récupérerUnCookie("csrf") ?? "",
      ...data,
    };

    mutationCreerTokenAPI.mutate(inputs);
  };

  const supprimerTokenAPI: SubmitHandler<TokenAPIForm> = async (data) => {
    const inputs = {
      csrf: récupérerUnCookie("csrf") ?? "",
      ...data,
    };

    mutationSupprimerTokenAPI.mutate(inputs);
  };

  return { creerTokenAPI, supprimerTokenAPI, reactHookForm };
};
