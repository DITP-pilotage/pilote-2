import { toast } from "sonner";
import { useState } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import { Icone } from "@/components/_commons/Icone";
import { CheckLineIcon } from "@/components/_commons/Icones/CheckLineIcon";
import { clsxm } from "@/utils/clsxm";

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
  const [complete, setComplete] = useState(dateTraitement != null);
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
    <button
      aria-pressed={dateTraitement != null}
      className={clsxm(
        "whitespace-nowrap inline-flex items-center gap-2 justify-end",
        {
          "cursor-not-allowed !opacity-50": disabled,
        },
      )}
      disabled={setTraitement.isLoading || disabled}
      onClick={handleClick}
      type="button"
    >
      <span>{complete ? "Traité" : "Non traité"}</span>

      <span
        className={clsxm(
          "rounded-full !p-0.5 !border-2 w-5 h-5 flex items-center justify-center",
          {
            "!border-green-600 !text-green-700 !bg-green-50 hover:bg-green-200":
              complete,
            "!border-gray-400 text-gray-400 !bg-white hover:bg-gray-100":
              !complete,
          },
        )}
      >
        {complete ? (
          <Icone className="text-current" icone={CheckLineIcon} />
        ) : null}
      </span>
    </button>
  );
};
