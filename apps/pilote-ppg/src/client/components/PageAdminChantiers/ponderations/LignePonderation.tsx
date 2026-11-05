import { Controller, useFormContext, useWatch } from "react-hook-form";
import { Badge } from "@/components/shared/Badge";
import { Switch } from "@/components/shared/Switch";
import { Table } from "@/components/shared/Table";
import {
  MAILLES,
  Maille,
  LIBELLE_MAILLE,
} from "@/server/parametrage-chantier/domain/maille";
import { IndicateurPonderation } from "@/server/parametrage-chantier/queries/GetIndicateursPonderationsChantierQuery";
import {
  LignePonderationForm,
  ModificationLigne,
  PonderationsForm,
} from "@/components/PageAdminChantiers/ponderations/usePonderationsIndicateursForm";
import { CHAMP_POIDS_PAR_MAILLE } from "@/components/PageAdminChantiers/ponderations/sommesPonderations";
import { clsxm } from "@/utils/clsxm";

export const CELLULE = "text-[length:inherit] leading-[inherit]";

const LIBELLE_MODIFICATION: Record<Exclude<ModificationLigne, null>, string> = {
  reactive: "Réactivé",
  desactive: "Désactivé",
  modifie: "Modifié",
};

const CelluleStatut = ({
  index,
  ponderation,
}: {
  index: number;
  ponderation: IndicateurPonderation;
}) => {
  const { control } = useFormContext<PonderationsForm>();
  return (
    <Table.Cell className={clsxm(CELLULE, "px-4 py-2 md:px-4 md:py-2")}>
      <Controller
        control={control}
        name={`lignes.${index}.estActif`}
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <Switch.Root
              aria-label={`${field.value ? "Désactiver" : "Activer"} l'indicateur ${ponderation.indicId}`}
              checked={field.value}
              onCheckedChange={field.onChange}
            >
              <Switch.Thumb />
            </Switch.Root>
            <span className="text-dsfr-grey-200">
              {field.value ? "Actif" : "Inactif"}
            </span>
          </div>
        )}
      />
    </Table.Cell>
  );
};

const CelluleIndicateurLibelle = ({
  estActif,
  modification,
  ponderation,
}: {
  estActif: boolean;
  modification: ModificationLigne;
  ponderation: IndicateurPonderation;
}) => (
  <Table.Cell
    className={clsxm(
      CELLULE,
      "px-4 py-3 md:px-4 md:py-3",
      estActif ? "text-dsfr-grey-50" : "text-dsfr-mention-grey",
    )}
  >
    <div className="flex items-center gap-2 min-w-0">
      <span
        className="truncate"
        title={`${ponderation.indicId} - ${ponderation.indicNom}`}
      >
        {ponderation.indicId} - {ponderation.indicNom}
      </span>
      {modification ? (
        <Badge className="shrink-0" size="sm" variant="info">
          {LIBELLE_MODIFICATION[modification]}
        </Badge>
      ) : null}
    </div>
  </Table.Cell>
);

interface ProprietesCellulePoids {
  index: number;
  ligne: LignePonderationForm;
  maille: Maille;
  ponderation: IndicateurPonderation;
}

const ContenuCellulePoids = ({
  index,
  ligne,
  maille,
  ponderation,
}: ProprietesCellulePoids) => {
  const { control } = useFormContext<PonderationsForm>();
  const champ = CHAMP_POIDS_PAR_MAILLE[maille];

  if (!ponderation.maillesApplicables.includes(maille)) {
    return (
      <span
        className="block py-1 px-2 text-right text-[0.8125rem] italic text-dsfr-mention-grey"
        title="Cet indicateur ne remonte pas de données à cette maille"
      >
        Non applicable
      </span>
    );
  }

  if (!ligne.estActif) {
    return (
      <span
        className="block py-1 px-2 text-right text-dsfr-mention-grey line-through"
        title="Indicateur inactif : pondération non prise en compte"
      >
        {ligne[champ] ?? "–"}
      </span>
    );
  }

  return (
    <Controller
      control={control}
      name={`lignes.${index}.${champ}`}
      render={({ field }) => (
        <input
          aria-label={`Pondération ${LIBELLE_MAILLE[maille].toLowerCase()} de ${ponderation.indicId}`}
          className="w-full text-right border rounded py-1 px-2 bg-white border-dsfr-grey-900"
          onChange={(event) =>
            field.onChange(
              event.target.value === "" ? null : Number(event.target.value),
            )
          }
          type="number"
          value={field.value ?? ""}
        />
      )}
    />
  );
};

const CellulePoids = (proprietes: ProprietesCellulePoids) => (
  <Table.Cell className={clsxm(CELLULE, "px-4 py-2 md:px-4 md:py-2")}>
    <ContenuCellulePoids {...proprietes} />
  </Table.Cell>
);

const LignePonderation = ({
  index,
  modification,
  ponderation,
}: {
  index: number;
  modification: ModificationLigne;
  ponderation: IndicateurPonderation;
}) => {
  const { control } = useFormContext<PonderationsForm>();
  const ligne = useWatch({ control, name: `lignes.${index}` });

  return (
    <Table.Row
      className={clsxm(
        "border-t border-dsfr-grey-925",
        modification
          ? "bg-dsfr-alt-blue-france"
          : ligne.estActif
            ? "bg-white"
            : "bg-dsfr-grey-975",
      )}
    >
      <CelluleStatut index={index} ponderation={ponderation} />
      <CelluleIndicateurLibelle
        estActif={ligne.estActif}
        modification={modification}
        ponderation={ponderation}
      />
      {MAILLES.map((maille) => (
        <CellulePoids
          index={index}
          key={maille}
          ligne={ligne}
          maille={maille}
          ponderation={ponderation}
        />
      ))}
    </Table.Row>
  );
};

export default LignePonderation;
