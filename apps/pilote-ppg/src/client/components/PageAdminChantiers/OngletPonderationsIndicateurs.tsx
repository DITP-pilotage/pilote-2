import { Control, Controller } from "react-hook-form";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Notice } from "@/components/shared/Notice";
import { SegmentedControl } from "@/components/shared/SegmentedControl";
import { Switch } from "@/components/shared/Switch";
import {
  MAILLES,
  Maille,
  LIBELLE_MAILLE,
} from "@/server/parametrage-chantier/domain/maille";
import {
  FiltreStatut,
  LignePonderationForm,
  ModificationLigne,
  PonderationsForm,
  usePonderationsIndicateursForm,
} from "@/components/PageAdminChantiers/usePonderationsIndicateursForm";
import { CHAMP_POIDS_PAR_MAILLE } from "@/components/PageAdminChantiers/sommesPonderations";
import { IndicateurPonderation } from "@/server/parametrage-chantier/queries/GetIndicateursPonderationsChantierQuery";
import { Table } from "@/components/shared/Table";
import { clsxm } from "@/utils/clsxm";

const CELLULE = "text-[length:inherit] leading-[inherit]";

const CLASSES_FILTRE =
  "whitespace-nowrap px-4 py-2 text-dsfr-grey-200 hover:bg-dsfr-grey-975 data-[state=on]:hover:bg-primary";

const LIBELLE_MODIFICATION: Record<Exclude<ModificationLigne, null>, string> = {
  reactive: "Réactivé",
  desactive: "Désactivé",
  modifie: "Modifié",
};

const CellulePoids = ({
  control,
  index,
  maille,
  ligne,
  ponderation,
}: {
  control: Control<PonderationsForm>;
  index: number;
  maille: Maille;
  ligne: LignePonderationForm | undefined;
  ponderation: IndicateurPonderation;
}) => {
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

  if (!ligne?.estActif) {
    const valeur = ligne?.[champ] ?? null;
    return (
      <span
        className="block py-1 px-2 text-right text-dsfr-mention-grey line-through"
        title="Indicateur inactif : pondération non prise en compte"
      >
        {valeur ?? "–"}
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

const LignePonderation = ({
  control,
  index,
  ligne,
  modification,
  ponderation,
}: {
  control: Control<PonderationsForm>;
  index: number;
  ligne: LignePonderationForm | undefined;
  modification: ModificationLigne;
  ponderation: IndicateurPonderation;
}) => {
  const estActif = ligne?.estActif ?? ponderation.estActif;
  return (
    <Table.Row
      className={clsxm(
        "border-t border-dsfr-grey-925",
        modification
          ? "bg-dsfr-alt-blue-france"
          : estActif
            ? "bg-white"
            : "bg-dsfr-grey-975",
      )}
    >
      <Table.Cell className={clsxm(CELLULE, "px-4 py-2 md:px-4 md:py-2")}>
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name={`lignes.${index}.estActif`}
            render={({ field }) => (
              <Switch.Root
                aria-label={`${field.value ? "Désactiver" : "Activer"} l'indicateur ${ponderation.indicId}`}
                checked={field.value}
                onCheckedChange={field.onChange}
              >
                <Switch.Thumb />
              </Switch.Root>
            )}
          />
          <span className="text-dsfr-grey-200">
            {estActif ? "Actif" : "Inactif"}
          </span>
        </div>
      </Table.Cell>
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
      {MAILLES.map((maille) => (
        <Table.Cell
          className={clsxm(CELLULE, "px-4 py-2 md:px-4 md:py-2")}
          key={maille}
        >
          <CellulePoids
            control={control}
            index={index}
            ligne={ligne}
            maille={maille}
            ponderation={ponderation}
          />
        </Table.Cell>
      ))}
    </Table.Row>
  );
};

const PiedTableauPonderations = ({
  sommesParMaille,
  sommesEnErreur,
}: {
  sommesParMaille: Partial<Record<Maille, number>>;
  sommesEnErreur: Record<Maille, boolean>;
}) => (
  <Table.Footer>
    <Table.Row className="border-t-2 border-dsfr-grey-925 bg-dsfr-grey-1000">
      <Table.Cell className={clsxm(CELLULE, "px-4 py-3 md:px-4 md:py-3")} />
      <Table.Cell
        className={clsxm(
          CELLULE,
          "px-4 py-3 md:px-4 md:py-3 text-dsfr-grey-50",
        )}
      >
        <p className="mb-0 font-semibold">Somme des indicateurs actifs</p>
        <p className="mb-0 text-xs text-dsfr-mention-grey">
          Les indicateurs inactifs ne sont pas comptés.
        </p>
      </Table.Cell>
      {MAILLES.map((maille) => {
        const somme = sommesParMaille[maille];
        const enErreur = sommesEnErreur[maille];
        return (
          <Table.Cell
            className={clsxm(CELLULE, "px-4 py-3 md:px-4 md:py-3 text-right")}
            key={maille}
          >
            <p
              className={clsxm(
                "mb-0 font-semibold",
                enErreur ? "text-error" : "text-dsfr-grey-50",
              )}
            >
              {somme === undefined ? "–" : somme}
            </p>
            {enErreur ? (
              <p className="mb-0 text-xs text-error">doit faire 100</p>
            ) : null}
          </Table.Cell>
        );
      })}
    </Table.Row>
  </Table.Footer>
);

const libelleChangementsStatut = (
  nombreReactivations: number,
  nombreDesactivations: number,
) => {
  const morceaux = [];
  if (nombreReactivations > 0) {
    morceaux.push(
      nombreReactivations > 1
        ? `${nombreReactivations} indicateurs seront réactivés`
        : "1 indicateur sera réactivé",
    );
  }
  if (nombreDesactivations > 0) {
    morceaux.push(
      nombreDesactivations > 1
        ? `${nombreDesactivations} indicateurs seront désactivés`
        : "1 indicateur sera désactivé",
    );
  }
  return `${morceaux.join(" et ")} à l'enregistrement.`;
};

const OngletPonderationsIndicateurs = ({
  ponderations,
}: {
  ponderations: IndicateurPonderation[];
}) => {
  const {
    reactHookForm,
    lignes,
    sommesParMaille,
    sommesEnErreur,
    modifications,
    nombreModifications,
    nombreReactivations,
    nombreDesactivations,
    nombreActifs,
    nombreInactifs,
    filtre,
    setFiltre,
    indicesAffiches,
    annuler,
    enregistrer,
    estEnCoursDEnregistrement,
  } = usePonderationsIndicateursForm({ ponderations });

  if (ponderations.length === 0) {
    return (
      <p className="text-sm text-dsfr-mention-grey">
        Aucun indicateur n&apos;est rattaché à ce chantier.
      </p>
    );
  }

  const boutonEnregistrer = (
    <Button
      disabled={estEnCoursDEnregistrement}
      type="submit"
      variant="primary"
    >
      Enregistrer
    </Button>
  );

  return (
    <form onSubmit={enregistrer}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <SegmentedControl.Root
          aria-label="Filtrer les indicateurs par statut"
          className="shrink-0 gap-1 p-1 bg-white ring-1 ring-dsfr-grey-925"
          onValueChange={(valeur) => {
            if (valeur) setFiltre(valeur as FiltreStatut);
          }}
          type="single"
          value={filtre}
        >
          <SegmentedControl.Item className={CLASSES_FILTRE} value="tous">
            Tous ({ponderations.length})
          </SegmentedControl.Item>
          <SegmentedControl.Item className={CLASSES_FILTRE} value="actifs">
            Actifs ({nombreActifs})
          </SegmentedControl.Item>
          <SegmentedControl.Item className={CLASSES_FILTRE} value="inactifs">
            Inactifs ({nombreInactifs})
          </SegmentedControl.Item>
        </SegmentedControl.Root>
        <div className="flex flex-wrap items-center gap-3">
          {nombreModifications > 0 ? (
            <>
              <span className="text-sm text-dsfr-grey-200">
                {nombreModifications > 1
                  ? `${nombreModifications} modifications non enregistrées`
                  : "1 modification non enregistrée"}
              </span>
              <Button onClick={annuler} type="button" variant="secondary">
                Annuler
              </Button>
            </>
          ) : null}
          {boutonEnregistrer}
        </div>
      </div>

      {nombreReactivations + nombreDesactivations > 0 ? (
        <Notice
          className="mb-4 rounded px-4"
          containerClassName=""
          variant="info"
        >
          {libelleChangementsStatut(nombreReactivations, nombreDesactivations)}{" "}
          Le changement de statut s&apos;appliquera au taux d&apos;avancement et
          à la page chantier au prochain calcul des données.
        </Notice>
      ) : null}

      <div className="bg-white rounded-lg shadow-sm ring-1 ring-dsfr-grey-925 overflow-x-auto">
        <Table.Root
          caption="Pondération des indicateurs par maille"
          captionHidden
          className="w-full min-w-[56rem] table-fixed text-sm"
        >
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell
                className={clsxm(
                  CELLULE,
                  "w-32 text-left px-4 py-3 md:px-4 md:py-3",
                )}
              >
                Statut
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell
                className={clsxm(
                  CELLULE,
                  "text-left px-4 py-3 md:px-4 md:py-3",
                )}
              >
                Indicateur
              </Table.ColumnHeaderCell>
              {MAILLES.map((maille) => (
                <Table.ColumnHeaderCell
                  className={clsxm(
                    CELLULE,
                    "w-36 text-right px-4 py-3 md:px-4 md:py-3",
                  )}
                  key={maille}
                >
                  {LIBELLE_MAILLE[maille]} (%)
                </Table.ColumnHeaderCell>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {indicesAffiches.length === 0 ? (
              <Table.Row className="border-t border-dsfr-grey-925">
                <Table.Cell
                  className={clsxm(
                    CELLULE,
                    "px-4 py-6 text-center text-dsfr-mention-grey",
                  )}
                  colSpan={2 + MAILLES.length}
                >
                  Aucun indicateur pour ce filtre.
                </Table.Cell>
              </Table.Row>
            ) : (
              indicesAffiches.map((index) => (
                <LignePonderation
                  control={reactHookForm.control}
                  index={index}
                  key={ponderations[index].indicId}
                  ligne={lignes[index]}
                  modification={modifications[index]}
                  ponderation={ponderations[index]}
                />
              ))
            )}
          </Table.Body>
          <PiedTableauPonderations
            sommesEnErreur={sommesEnErreur}
            sommesParMaille={sommesParMaille}
          />
        </Table.Root>
      </div>

      <div className="flex justify-end mt-6 pt-4 border-t border-dsfr-grey-925">
        {boutonEnregistrer}
      </div>
    </form>
  );
};

export default OngletPonderationsIndicateurs;
