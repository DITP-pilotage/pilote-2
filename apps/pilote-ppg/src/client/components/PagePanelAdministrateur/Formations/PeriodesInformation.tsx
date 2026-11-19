import { useState } from "react";
import { api } from "@/server/framework/trpc/api";
import { Badge, type BadgeVariant } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Table } from "@/components/shared/Table";
import {
  formaterJour,
  type StatutPeriode,
} from "@/server/formations/domain/periodeInformation";
import type { PeriodeInformation } from "@/server/formations/queries/ListPeriodesInformationQuery";
import { ModalePeriodeInformation } from "./ModalePeriodeInformation";
import { ModaleSuppressionPeriode } from "./ModaleSuppressionPeriode";

const STATUTS: Record<StatutPeriode, { label: string; variant: BadgeVariant }> =
  {
    A_VENIR: { label: "À venir", variant: "info" },
    EN_COURS: { label: "En cours", variant: "success" },
    PASSEE: { label: "Passée", variant: "default" },
  };

type Edition = { periode: PeriodeInformation | null } | null;

export const PeriodesInformation = () => {
  const { data: donnees } = api.formation.periodesInformation.useQuery();
  const [edition, setEdition] = useState<Edition>(null);
  const [suppression, setSuppression] = useState<PeriodeInformation | null>(
    null,
  );

  if (!donnees) return null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button onClick={() => setEdition({ periode: null })} variant="primary">
          + Ajouter une période
        </Button>
      </div>
      {donnees.periodes.length === 0 ? (
        <p className="text-sm text-gray-600">
          Aucune période d'information pour l'instant.
        </p>
      ) : (
        <Table caption="Périodes d'information" captionHidden>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Du</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Au</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Formations</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {donnees.periodes.map((periode) => (
              <Table.Row key={periode.id}>
                <Table.RowHeaderCell>
                  {formaterJour(periode.dateDebut)}
                </Table.RowHeaderCell>
                <Table.Cell>{formaterJour(periode.dateFin)}</Table.Cell>
                <Table.Cell>
                  {periode.motifs
                    .map(
                      (motif) =>
                        `${motif.nom ?? "Formation inconnue"}${motif.retireeDeRdvSp ? " (retirée de RDV-SP)" : ""}`,
                    )
                    .join(", ")}
                </Table.Cell>
                <Table.Cell>
                  <Badge size="sm" variant={STATUTS[periode.statut].variant}>
                    {STATUTS[periode.statut].label}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex gap-4">
                    {periode.statut !== "PASSEE" ? (
                      <Button
                        onClick={() => setEdition({ periode })}
                        variant="link"
                      >
                        Modifier
                      </Button>
                    ) : null}
                    {periode.statut === "A_VENIR" ? (
                      <Button
                        onClick={() => setSuppression(periode)}
                        variant="link"
                      >
                        Supprimer
                      </Button>
                    ) : null}
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
      {edition ? (
        <ModalePeriodeInformation
          donnees={donnees}
          onClose={() => setEdition(null)}
          periode={edition.periode}
        />
      ) : null}
      {suppression ? (
        <ModaleSuppressionPeriode
          onClose={() => setSuppression(null)}
          periode={suppression}
        />
      ) : null}
    </div>
  );
};
