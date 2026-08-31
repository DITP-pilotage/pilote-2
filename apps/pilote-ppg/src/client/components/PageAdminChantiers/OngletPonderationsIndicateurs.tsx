import { Controller } from "react-hook-form";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { MessageErreur } from "@/components/PageAutoEvaluation/MessageErreur";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { MAILLES, Maille } from "@/server/metadataChantier/domain/maille";
import {
  CHAMP_POIDS_PAR_MAILLE,
  usePonderationsIndicateursForm,
} from "@/components/PageAdminChantiers/usePonderationsIndicateursForm";
import { clsxm } from "@/utils/clsxm";

const LIBELLÉ_MAILLE: Record<Maille, string> = {
  NAT: "National",
  REG: "Régional",
  DEPT: "Départemental",
};

const OngletPonderationsIndicateurs = ({
  chantierId,
}: {
  chantierId: string;
}) => {
  const {
    reactHookForm,
    fields,
    estEnChargement,
    sommesParMaille,
    erreursSommes,
    enregistrer,
    alerte,
    estEnCoursDEnregistrement,
  } = usePonderationsIndicateursForm({ chantierId });

  if (estEnChargement) {
    return <p className="text-sm text-gray-500">Chargement…</p>;
  }

  if (fields.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Aucun indicateur n&apos;est rattaché à ce chantier.
      </p>
    );
  }

  return (
    <form onSubmit={enregistrer}>
      {alerte && (
        <div className="mb-4">
          <Alerte titre={alerte.titre} type={alerte.type} />
        </div>
      )}

      <div className="flex items-center justify-end mb-4">
        <Bouton
          disabled={estEnCoursDEnregistrement}
          label="Enregistrer"
          type="submit"
          variant="primary"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm ring-1 ring-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs uppercase text-gray-500">
              <th className="text-left px-4 py-3 font-medium">Indicateur</th>
              {MAILLES.map((maille) => (
                <th className="text-right px-4 py-3 font-medium" key={maille}>
                  {LIBELLÉ_MAILLE[maille]} (%)
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr className="border-t border-gray-100" key={field.id}>
                <td className="px-4 py-3 text-gray-900">{field.indicNom}</td>
                {MAILLES.map((maille) => {
                  const applicable = field.maillesApplicables.includes(maille);
                  return (
                    <td className="px-4 py-2 text-right" key={maille}>
                      <Controller
                        control={reactHookForm.control}
                        name={`lignes.${index}.${CHAMP_POIDS_PAR_MAILLE[maille]}`}
                        render={({ field: champ }) => (
                          <input
                            className={clsxm(
                              "w-24 text-right border rounded !py-1 !px-2",
                              applicable
                                ? "!bg-white border-gray-300"
                                : "!bg-gray-50 border-gray-100 text-gray-300",
                            )}
                            disabled={!applicable}
                            onChange={(event) =>
                              champ.onChange(
                                event.target.value === ""
                                  ? null
                                  : Number(event.target.value),
                              )
                            }
                            step="0.01"
                            type="number"
                            value={champ.value ?? ""}
                          />
                        )}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td className="px-4 py-3 font-semibold text-gray-900">Somme</td>
              {MAILLES.map((maille) => {
                const somme = sommesParMaille[maille];
                const enErreur = !!erreursSommes[maille];
                return (
                  <td className="px-4 py-3 text-right" key={maille}>
                    <span
                      className={clsxm(
                        "font-semibold",
                        enErreur ? "text-error" : "text-gray-900",
                      )}
                    >
                      {somme === undefined ? "-" : somme}
                    </span>
                    {erreursSommes[maille] && (
                      <div>
                        <MessageErreur>{erreursSommes[maille]}</MessageErreur>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </form>
  );
};

export default OngletPonderationsIndicateurs;
