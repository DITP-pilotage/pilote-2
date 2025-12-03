import { toast } from "sonner";
import { useId, useState } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import { Icone } from "@/components/_commons/Icone";
import { CheckLineIcon } from "@/components/_commons/Icones/CheckLineIcon";
import { clsxm } from "@/utils/clsxm";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { Switch } from "@/components/shared/Switch";

export const BoutonTraitementEvaluation = ({
  evaluationId,
  typeEvaluation,
  dateTraitement,
  disabled,
}: {
  evaluationId: string;
  typeEvaluation: "OBJECTIF" | "MANIERE_DE_SERVIR";
  dateTraitement: string | null;
  disabled: boolean;
}) => {
  const id = useId();
  const [complete, setComplete] = useState(dateTraitement != null);
  const refreshRouter = useRefreshRouter();
  const setTraitement = api.evaluation.setTraitementEvaluation.useMutation({
    onMutate: (payload) => {
      setComplete(payload.statut === "TRAITEE");
    },
    onSuccess: async (_, payload) => {
      toast.success(
        payload.statut === "NON_TRAITEE"
          ? "Évaluation marquée comme non complétée"
          : "Évaluation marquée comme complétée",
        {
          position: "top-right",
          richColors: true,
        },
      );
      return refreshRouter();
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour", {
        position: "top-right",
        richColors: true,
      });
    },
  });

  const handleClick = async () => {
    await setTraitement.mutateAsync({
      evaluationId,
      typeEvaluation,
      statut: complete ? "NON_TRAITEE" : "TRAITEE",
    });
  };

  return (
    <div className="flex flex-col gap-2 items-center">
      <Switch.Root
        checked={complete}
        disabled={disabled}
        id={id}
        onCheckedChange={handleClick}
      >
        <Switch.Thumb disabled={disabled} />
      </Switch.Root>

      <label
        className={clsxm("text-sm", {
          "text-primary": complete,
        })}
        htmlFor={id}
      >
        {complete ? "traité" : "non traité"}
      </label>
    </div>
  );
};
