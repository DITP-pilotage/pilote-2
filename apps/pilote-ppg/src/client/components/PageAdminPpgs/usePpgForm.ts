import { SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { ppgCommandSchema } from "@/server/metadataPpg/handlers/EnregistrerPpgHandler";

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
  estUneCréation,
}: {
  defaultValues: PpgForm;
  estUneCréation: boolean;
}) => {
  const router = useRouter();

  const reactHookForm = useForm<PpgForm>({
    resolver: zodResolver(ppgCommandSchema),
    defaultValues,
  });

  const mutation = api.metadataPpg.enregistrer.useMutation({
    onSuccess: () => {
      toast.success(
        estUneCréation ? "PPG créé avec succès." : "PPG modifié avec succès.",
        { position: "top-right", richColors: true },
      );
      if (estUneCréation) {
        void router.push("/panel-administrateur/referentiels-deprecies/ppgs");
      }
    },
    onError: (error) =>
      toast.error(error.message, { position: "top-right", richColors: true }),
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
    isPending: mutation.isPending,
  };
};
