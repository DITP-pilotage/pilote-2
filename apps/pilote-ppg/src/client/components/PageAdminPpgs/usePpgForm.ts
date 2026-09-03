import { SubmitHandler, useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/router";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { ppgCommandSchema } from "@/server/metadataPpg/handlers/EnregistrerPpgHandler";
import AlerteProps from "@/components/_commons/Alerte/Alerte.interface";

export type PpgForm = z.infer<typeof ppgCommandSchema>;

export const defaultPpgVide = (): PpgForm => ({
  ppgId: "",
  ppgNom: "",
  ppgDesc: null,
  ppgAxe: null,
  estUneCréation: true,
});

export const usePpgForm = ({
  defaultValues,
  ppgId,
  estUneCréation,
}: {
  defaultValues: PpgForm;
  ppgId: string;
  estUneCréation: boolean;
}) => {
  const router = useRouter();
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);

  const reactHookForm = useForm<PpgForm>({
    resolver: zodResolver(ppgCommandSchema),
    defaultValues,
  });

  const mutation = api.metadataPpg.enregistrer.useMutation({
    onSuccess: () => {
      if (estUneCréation) {
        void router.push(
          "/panel-administrateur/referentiels-deprecies/ppgs?_action=creation-reussie",
        );
      } else {
        void router.push(
          `/panel-administrateur/referentiels-deprecies/ppgs/${ppgId}?_action=modification-reussie`,
        );
      }
    },
    onError: (error) => setAlerte({ type: "erreur", titre: error.message }),
  });

  const enregistrer: SubmitHandler<PpgForm> = (data) => {
    mutation.mutate({
      csrf: récupérerUnCookie("csrf") ?? "",
      ...data,
      ppgDesc: data.ppgDesc || null,
      ppgAxe: data.ppgAxe || null,
    });
  };

  return {
    reactHookForm,
    enregistrer,
    alerte,
    isPending: mutation.isPending,
  };
};
