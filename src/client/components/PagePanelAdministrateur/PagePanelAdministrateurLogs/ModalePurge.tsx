import { FunctionComponent, useState } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { Modale } from "@/components/shared/Modale";

type ModalePurgeProps = {
  open: boolean;
  onFermer: () => void;
};

export const ModalePurge: FunctionComponent<ModalePurgeProps> = ({
  open,
  onFermer,
}) => {
  const [dateStr, setDateStr] = useState("");
  const utils = api.useUtils();

  const mutation = api.applicationLog.purger.useMutation({
    onSuccess: () => {
      utils.applicationLog.lister.invalidate();
      onFermer();
    },
  });

  const handlePurger = () => {
    if (!dateStr) return;
    mutation.mutate({
      csrf: récupérerUnCookie("csrf") ?? "",
      anterieurA: new Date(dateStr).toISOString(),
    });
  };

  return (
    <Modale
      onOpenChange={(isOpen) => {
        if (!isOpen) onFermer();
      }}
      open={open}
      size="sm"
      title="Purger les logs"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Supprimer tous les logs antérieurs à la date sélectionnée. Minimum 7
          jours de rétention.
        </p>
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="date-purge"
          >
            Supprimer les logs antérieurs au
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            id="date-purge"
            onChange={(event) => setDateStr(event.target.value)}
            type="date"
            value={dateStr}
          />
        </div>
        {mutation.error && (
          <p className="text-sm text-red-600">{mutation.error.message}</p>
        )}
        {mutation.isSuccess && (
          <p className="text-sm text-green-600">
            {mutation.data.nombreSupprime} logs supprimés.
          </p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
            onClick={onFermer}
            type="button"
          >
            Annuler
          </button>
          <button
            className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!dateStr || mutation.isPending}
            onClick={handlePurger}
            type="button"
          >
            {mutation.isPending ? "Suppression..." : "Confirmer la purge"}
          </button>
        </div>
      </div>
    </Modale>
  );
};
