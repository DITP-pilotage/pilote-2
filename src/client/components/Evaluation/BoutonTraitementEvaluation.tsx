import { toast } from "sonner";
import { useId, useState } from "react";
import { Switch } from "radix-ui";
import api from "@/server/infrastructure/api/trpc/api";
import { Icone } from "@/components/_commons/Icone";
import { CheckLineIcon } from "@/components/_commons/Icones/CheckLineIcon";
import { clsxm } from "@/utils/clsxm";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";

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
        className={clsxm(
          "w-11 relative !p-0",
          "rounded-full border !border-primary",
          "bg-white transition-colors data-[state=checked]:!bg-primary",
          { "!border-gray-500 data-[state=checked]:!bg-gray-300": disabled },
        )}
        disabled={disabled}
        id={id}
        onCheckedChange={handleClick}
      >
        <Switch.Thumb
          className={clsxm(
            "h-7 w-7 block",
            "rounded-full border !border-primary",
            "translate-x-0 transition-transform data-[state=checked]:translate-x-4",
            "bg-white",
            { "!border-gray-500 !text-gray-500": disabled },
            "children:hidden data-[state=checked]:children:block",
            "flex items-center justify-center",
          )}
        >
          <Icone className="h-5 w-5 text-current" icone={CheckLineIcon} />
        </Switch.Thumb>
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
