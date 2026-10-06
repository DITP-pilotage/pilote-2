import { SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/server/framework/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { axeCommandSchema } from "@/server/referentiels/axe/handlers/SaveAxeHandler";

export type AxeForm = z.infer<typeof axeCommandSchema>;

export const defaultAxeVide = (): AxeForm => ({
  axeId: "",
  axeName: "",
  axeDesc: null,
  isCreation: true,
});

export const useAxeForm = ({
  defaultValues,
  isCreation,
}: {
  defaultValues: AxeForm;
  isCreation: boolean;
}) => {
  const router = useRouter();

  const reactHookForm = useForm<AxeForm>({
    resolver: zodResolver(axeCommandSchema),
    defaultValues,
  });

  const mutation = api.referentielAxe.save.useMutation({
    onSuccess: () => {
      toast.success(
        isCreation ? "Axe créé avec succès." : "Axe modifié avec succès.",
        { position: "bottom-right", richColors: true },
      );
      if (isCreation) {
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
