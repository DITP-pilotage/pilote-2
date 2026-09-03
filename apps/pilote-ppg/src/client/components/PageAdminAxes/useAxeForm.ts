import { SubmitHandler, useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/router";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { axeCommandSchema } from "@/server/metadataAxe/handlers/EnregistrerAxeHandler";
import AlerteProps from "@/components/_commons/Alerte/Alerte.interface";

export type AxeForm = z.infer<typeof axeCommandSchema>;

export const defaultAxeVide = (): AxeForm => ({
  axeId: "",
  axeName: "",
  axeDesc: null,
  estUneCréation: true,
});

export const useAxeForm = ({
  defaultValues,
  axeId,
  estUneCréation,
}: {
  defaultValues: AxeForm;
  axeId: string;
  estUneCréation: boolean;
}) => {
  const router = useRouter();
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);

  const reactHookForm = useForm<AxeForm>({
    resolver: zodResolver(axeCommandSchema),
    defaultValues,
  });

  const mutation = api.metadataAxe.enregistrer.useMutation({
    onSuccess: () => {
      if (estUneCréation) {
        void router.push(
          "/panel-administrateur/referentiels-deprecies/axes?_action=creation-reussie",
        );
      } else {
        void router.push(
          `/panel-administrateur/referentiels-deprecies/axes/${axeId}?_action=modification-reussie`,
        );
      }
    },
    onError: (error) => setAlerte({ type: "erreur", titre: error.message }),
  });

  const enregistrer: SubmitHandler<AxeForm> = (data) => {
    mutation.mutate({
      csrf: récupérerUnCookie("csrf") ?? "",
      ...data,
      axeDesc: data.axeDesc || null,
    });
  };

  return {
    reactHookForm,
    enregistrer,
    alerte,
    isPending: mutation.isPending,
  };
};
