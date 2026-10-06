import { SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/server/framework/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { engagementCommandSchema } from "@/server/referentiels/engagement/handlers/SaveEngagementHandler";

export type EngagementForm = z.infer<typeof engagementCommandSchema>;

export const defaultEngagementVide = (
  engagementId: string,
): EngagementForm => ({
  engagementId,
  engagementShort: "",
  engagementName: "",
  isCreation: true,
});

export const useEngagementForm = ({
  defaultValues,
  isCreation,
}: {
  defaultValues: EngagementForm;
  isCreation: boolean;
}) => {
  const router = useRouter();

  const reactHookForm = useForm<EngagementForm>({
    resolver: zodResolver(engagementCommandSchema),
    defaultValues,
  });

  const mutation = api.referentielEngagement.save.useMutation({
    onSuccess: () => {
      toast.success(
        isCreation
          ? "Engagement créé avec succès."
          : "Engagement modifié avec succès.",
        { position: "bottom-right", richColors: true },
      );
      if (isCreation) {
        void router.push(
          "/panel-administrateur/referentiels-deprecies/engagements",
        );
      }
    },
    onError: (error) =>
      toast.error(error.message, {
        position: "bottom-right",
        richColors: true,
      }),
  });

  const enregistrer: SubmitHandler<EngagementForm> = (data) => {
    mutation.mutate({
      csrf: récupérerUnCookie("csrf") ?? "",
      ...data,
    });
  };

  return {
    reactHookForm,
    enregistrer,
    isPending: mutation.isPending,
  };
};
