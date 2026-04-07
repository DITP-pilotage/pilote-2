import { FunctionComponent, useState } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";

type ModalePurgeProps = {
  onFermer: () => void;
};

export const ModalePurge: FunctionComponent<ModalePurgeProps> = ({
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
    <dialog
      aria-labelledby="modale-purge-titre"
      className="fr-modal fr-modal--opened"
      open
      role="dialog"
    >
      <div className="fr-container fr-container--fluid fr-container-md">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-6">
            <div className="fr-modal__body">
              <div className="fr-modal__header">
                <button
                  className="fr-btn--close fr-btn"
                  onClick={onFermer}
                  type="button"
                >
                  Fermer
                </button>
              </div>
              <div className="fr-modal__content">
                <h1
                  className="fr-modal__title"
                  id="modale-purge-titre"
                >
                  Purger les logs
                </h1>
                <p>
                  Supprimer tous les logs antérieurs à la date sélectionnée.
                  Minimum 7 jours de rétention.
                </p>
                <div className="fr-input-group">
                  <label
                    className="fr-label"
                    htmlFor="date-purge"
                  >
                    Supprimer les logs antérieurs au
                  </label>
                  <input
                    className="fr-input"
                    id="date-purge"
                    onChange={(event) => setDateStr(event.target.value)}
                    type="date"
                    value={dateStr}
                  />
                </div>
                {mutation.error && (
                  <p className="fr-error-text">{mutation.error.message}</p>
                )}
                {mutation.isSuccess && (
                  <p className="fr-valid-text">
                    {mutation.data.nombreSupprime} logs supprimés.
                  </p>
                )}
              </div>
              <div className="fr-modal__footer">
                <div className="fr-btns-group fr-btns-group--right fr-btns-group--inline">
                  <button
                    className="fr-btn fr-btn--secondary"
                    onClick={onFermer}
                    type="button"
                  >
                    Annuler
                  </button>
                  <button
                    className="fr-btn"
                    disabled={!dateStr || mutation.isPending}
                    onClick={handlePurger}
                    type="button"
                  >
                    {mutation.isPending
                      ? "Suppression..."
                      : "Confirmer la purge"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
};
