import { SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { axeCommandSchema } from "@/server/metadataAxe/handlers/EnregistrerAxeHandler";

export type AxeForm = z.infer<typeof axeCommandSchema>;

export const defaultAxeVide = (): AxeForm => ({
  axeId: "",
  axeName: "",
  axeDesc: null,
  estUneCréation: true,
});

export const useAxeForm = ({
  defaultValues,
  estUneCréation,
}: {
  defaultValues: AxeForm;
  estUneCréation: boolean;
}) => {
  const router = useRouter();

  const reactHookForm = useForm<AxeForm>({
    resolver: zodResolver(axeCommandSchema),
    defaultValues,
  });

  const mutation = api.metadataAxe.enregistrer.useMutation({
    onSuccess: () => {
      toast.success(
        estUneCréation ? "Axe créé avec succès." : "Axe modifié avec succès.",
        { position: "bottom-right", richColors: true },
      );
      if (estUneCréation) {
        void router.push("/panel-administrateur/referentiels-deprecies/axes");
      }
    },
    onError: (error) =>
      toast.error(error.message, {
        position: "bottom-right",
        richColors: true,
      }),
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
    isPending: mutation.isPending,
  };
};
