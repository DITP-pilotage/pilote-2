import { FunctionComponent, PropsWithChildren } from "react";
import { Dialog } from "radix-ui";
import { Modale } from "@/components/shared/Modale";
import { FicheEvaluation } from "@/server/evaluation/domain/FicheEvaluation";
import { Icone } from "@/components/_commons/Icone";
import { LockIcon } from "@/components/_commons/Icones/LockIcon";
import { useTransmissionDITP as useModaleVerrouillageConsolidation } from "@/components/PageAppreciation/ModaleVerrouillageConsolidation/useModaleVerrouillageConsolidation";

interface ModaleTransmissionDITPProps {
  groupe: string;
  fichesConsolidation: FicheEvaluation[];
}

export const ModaleTransmissionDITP: FunctionComponent<
  PropsWithChildren<ModaleTransmissionDITPProps>
> = ({ groupe, fichesConsolidation, children }) => {
  const {
    fichesSelectionnees,
    fichesSelectionnables,
    tousSelectionnes,
    toggleFiche,
    toggleTout,
    verrouillerLaConsolidation,
  } = useModaleVerrouillageConsolidation(fichesConsolidation);

  return (
    <Modale title="Transmettre à la DITP" trigger={children}>
      <div className="flex flex-col gap-4">
        <p className="text-gray-600">
          Sélectionnez les territoires que vous souhaitez transmettre à la DITP
          pour la région <span className="font-bold">{groupe}</span>.
        </p>

        {fichesConsolidation.length === 0 ? (
          <div className="fr-alert fr-alert--info">
            <p className="fr-alert__title">
              Aucun territoire en phase d'appréciation
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {fichesSelectionnables.length > 0 && (
              <div className="flex items-center gap-3 p-3 border-2 border-primary rounded bg-blue-50">
                <input
                  checked={tousSelectionnes}
                  className="fr-checkbox"
                  id="checkbox-tout-selectionner"
                  onChange={toggleTout}
                  type="checkbox"
                />
                <label
                  className="flex-1 cursor-pointer font-medium"
                  htmlFor="checkbox-tout-selectionner"
                >
                  {tousSelectionnes
                    ? "Tout désélectionner"
                    : "Tout sélectionner"}
                </label>
              </div>
            )}

            {fichesConsolidation.map((fiche) => {
              const estSelectionne = fichesSelectionnees.has(fiche.id);
              const estDesactive = fiche.readOnly;

              return (
                <div
                  className={`flex items-center gap-3 p-3 border rounded ${
                    estDesactive
                      ? "bg-gray-50 border-gray-300"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                  key={fiche.id}
                >
                  <input
                    checked={estSelectionne}
                    className="fr-checkbox"
                    disabled={estDesactive}
                    id={`checkbox-${fiche.id}`}
                    onChange={() => toggleFiche(fiche.id)}
                    type="checkbox"
                  />
                  {estDesactive ? (
                    <Icone className="w-5 h-5 text-gray-400" icone={LockIcon} />
                  ) : null}
                  <label
                    className={`flex-1 cursor-pointer ${estDesactive ? "text-gray-400" : ""}`}
                    htmlFor={`checkbox-${fiche.id}`}
                  >
                    <div className="font-medium">
                      {fiche.rattachement.libelle}
                    </div>
                    <div className="text-sm text-gray-500">
                      {fiche.rattachement.code}
                      {estDesactive ? " - Verrouillé" : null}
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Dialog.Close asChild>
            <button className="fr-btn fr-btn--secondary" type="button">
              Annuler
            </button>
          </Dialog.Close>
          <button
            className="fr-btn"
            disabled={fichesSelectionnees.size === 0}
            onClick={verrouillerLaConsolidation}
            type="button"
          >
            Transmettre ({fichesSelectionnees.size})
          </button>
        </div>
      </div>
    </Modale>
  );
};
