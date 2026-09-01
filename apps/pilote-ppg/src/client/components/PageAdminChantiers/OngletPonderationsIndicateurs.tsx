import { Control, Controller } from "react-hook-form";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { MessageErreur } from "@/components/PageAutoEvaluation/MessageErreur";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { MAILLES, Maille } from "@/server/metadataChantier/domain/maille";
import {
  CHAMP_POIDS_PAR_MAILLE,
  usePonderationsIndicateursForm,
} from "@/components/PageAdminChantiers/usePonderationsIndicateursForm";
import { IndicateurPonderation } from "@/server/metadataChantier/queries/RecupererIndicateursPonderationsChantierQuery";
import { clsxm } from "@/utils/clsxm";

const LIBELLÉ_MAILLE: Record<Maille, string> = {
  NAT: "National",
  REG: "Régional",
  DEPT: "Départemental",
};

interface LignePonderationProps {
  control: Control<{
    lignes: {
      poidsPourcentDept: number | null;
      poidsPourcentReg: number | null;
      poidsPourcentNat: number | null;
    }[];
  }>;
  index: number;
  ponderation: IndicateurPonderation;
}

const LignePonderation = ({
  control,
  index,
  ponderation,
}: LignePonderationProps) => (
  <tr className="border-t border-gray-100">
    <td
      className="px-4 py-3 text-gray-900 truncate"
      title={`${ponderation.indicId} - ${ponderation.indicNom}`}
    >
      {ponderation.indicId} - {ponderation.indicNom}
    </td>
    {MAILLES.map((maille) => {
      const applicable = ponderation.maillesApplicables.includes(maille);
      return (
        <td className="px-4 py-2 text-right" key={maille}>
          <Controller
            control={control}
            name={`lignes.${index}.${CHAMP_POIDS_PAR_MAILLE[maille]}`}
            render={({ field: champ }) => (
              <input
                className={clsxm(
                  "w-full text-right border rounded !py-1 !px-2",
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
                type="number"
                value={champ.value ?? ""}
              />
            )}
          />
        </td>
      );
    })}
  </tr>
);

const PiedTableauPonderations = ({
  sommesParMaille,
  erreursSommes,
}: {
  sommesParMaille: Partial<Record<Maille, number>>;
  erreursSommes: Partial<Record<Maille, string>>;
}) => (
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
);

const OngletPonderationsIndicateurs = ({
  chantierId,
  ponderations,
}: {
  chantierId: string;
  ponderations: IndicateurPonderation[];
}) => {
  const {
    reactHookForm,
    sommesParMaille,
    erreursSommes,
    enregistrer,
    alerte,
    estEnCoursDEnregistrement,
  } = usePonderationsIndicateursForm({ chantierId, ponderations });

  if (ponderations.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Aucun indicateur n&apos;est rattaché à ce chantier.
      </p>
    );
  }

  const auMoinsUneErreur = Object.keys(erreursSommes).length > 0;

  return (
    <form onSubmit={enregistrer}>
      {alerte && (
        <div className="mb-4">
          <Alerte titre={alerte.titre} type={alerte.type} />
        </div>
      )}

      <div className="flex items-center justify-end mb-4">
        <Bouton
          disabled={estEnCoursDEnregistrement || auMoinsUneErreur}
          label="Enregistrer"
          type="submit"
          variant="primary"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm ring-1 ring-gray-200">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs uppercase text-gray-500">
              <th className="text-left px-4 py-3 font-medium">Indicateur</th>
              {MAILLES.map((maille) => (
                <th
                  className="w-36 text-right px-4 py-3 font-medium"
                  key={maille}
                >
                  {LIBELLÉ_MAILLE[maille]} (%)
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ponderations.map((ponderation, index) => (
              <LignePonderation
                control={reactHookForm.control}
                index={index}
                key={ponderation.indicId}
                ponderation={ponderation}
              />
            ))}
          </tbody>
          <PiedTableauPonderations
            erreursSommes={erreursSommes}
            sommesParMaille={sommesParMaille}
          />
        </table>
      </div>
    </form>
  );
};

export default OngletPonderationsIndicateurs;
