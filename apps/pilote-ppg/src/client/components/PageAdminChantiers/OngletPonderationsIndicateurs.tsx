import { Control, Controller } from "react-hook-form";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import {
  MAILLES,
  Maille,
  LIBELLÉ_MAILLE,
} from "@/server/metadataChantier/domain/maille";
import {
  CHAMP_POIDS_PAR_MAILLE,
  usePonderationsIndicateursForm,
} from "@/components/PageAdminChantiers/usePonderationsIndicateursForm";
import { IndicateurPonderation } from "@/server/metadataChantier/queries/RecupererIndicateursPonderationsChantierQuery";
import { clsxm } from "@/utils/clsxm";

const LignePonderation = ({
  control,
  index,
  ponderation,
}: {
  control: Control<{
    lignes: {
      poidsPourcentDept: number | null;
      poidsPourcentReg: number | null;
      poidsPourcentNat: number | null;
    }[];
  }>;
  index: number;
  ponderation: IndicateurPonderation;
}) => (
  <tr className="border-t border-dsfr-grey-1000">
    <td
      className="px-4 py-3 text-dsfr-grey-50 truncate"
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
            render={({ field }) => (
              <input
                className={clsxm(
                  "w-full text-right border rounded !py-1 !px-2",
                  applicable
                    ? "!bg-white border-dsfr-grey-900"
                    : "!bg-dsfr-grey-1000 border-dsfr-grey-1000 text-dsfr-grey-900",
                )}
                disabled={!applicable}
                onChange={(event) =>
                  field.onChange(
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                  )
                }
                type="number"
                value={field.value ?? ""}
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
    <tr className="border-t-2 border-dsfr-grey-925 bg-dsfr-grey-1000">
      <td className="px-4 py-3 font-semibold text-dsfr-grey-50">Somme</td>
      {MAILLES.map((maille) => {
        const somme = sommesParMaille[maille];
        const enErreur = !!erreursSommes[maille];
        return (
          <td className="px-4 py-3 text-right" key={maille}>
            <span
              className={clsxm(
                "inline-flex items-center gap-1 font-semibold",
                enErreur ? "text-error" : "text-dsfr-grey-50",
              )}
            >
              {somme === undefined ? "-" : somme}
              {erreursSommes[maille] && (
                <Infobulle
                  classNameIcone="w-4 h-4 text-error"
                  styleIconInfoBulle="warning"
                >
                  {erreursSommes[maille]}
                </Infobulle>
              )}
            </span>
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
      <p className="text-sm text-dsfr-mention-grey">
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

      <div className="bg-white rounded-lg shadow-sm ring-1 ring-dsfr-grey-925">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="bg-dsfr-grey-1000 text-xs uppercase text-dsfr-mention-grey">
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

      <div className="flex justify-end mt-6 pt-4 border-t border-dsfr-grey-925">
        <Bouton
          disabled={estEnCoursDEnregistrement || auMoinsUneErreur}
          label="Enregistrer"
          type="submit"
          variant="primary"
        />
      </div>
    </form>
  );
};

export default OngletPonderationsIndicateurs;
