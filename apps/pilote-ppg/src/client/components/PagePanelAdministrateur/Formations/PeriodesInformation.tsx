import { useCallback, useState } from "react";
import { api } from "@/server/framework/trpc/api";
import { Button } from "@/components/shared/Button";
import { Callout } from "@/components/shared/Callout";
import { Icone } from "@/components/_commons/Icone";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";
import { TableauAdmin } from "@/components/_commons/TableauAdmin/TableauAdmin";
import type { PeriodeInformation } from "@/server/formations/queries/ListPeriodesInformationQuery";
import { ModalePeriodeInformation } from "./ModalePeriodeInformation";
import { ModaleSuppressionPeriode } from "./ModaleSuppressionPeriode";
import { useTableauPeriodesInformation } from "./useTableauPeriodesInformation";

const LIBELLES = {
  aucun: "Aucune période d'information pour l'instant.",
  aucunResultat: "Aucune période ne correspond à",
};

type Edition = { periode: PeriodeInformation | null } | null;

const ReglesPeriodes = () => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <Callout.Root color="info">
      <Callout.Icon />
      <Callout.Text>
        <Callout.Title as="h2" className="mb-2 text-base leading-6">
          Règles des périodes d'information
        </Callout.Title>
        <ul className="m-0 flex list-disc flex-col gap-1 pl-5">
          <li>
            Pendant une période en cours, chaque utilisateur voit sur sa page
            d'accueil les formations de la période ouvertes à son profil (onglet
            « Accès motifs ») qui ont encore des séances à venir.
          </li>
          <li>
            Une période va de sa date de début à sa date de fin incluses. Aucune
            des deux ne peut être dans le passé et, une fois la période en
            cours, seule la date de fin se modifie.
          </li>
          <li>
            Les périodes ne se chevauchent pas : une période enregistrée sur les
            dates d'autres périodes les remplace, et celles-ci sont supprimées.
            Le formulaire prévient avant l'enregistrement.
          </li>
          <li>
            Pour arrêter une période en cours, supprimez-la. Une période passée
            ou supprimée reste dans la liste, sans pouvoir être modifiée.
          </li>
          <li>
            Un utilisateur qui choisit « Ne plus me les proposer » ne revoit
            plus les formations de la période, même si elle est modifiée. Il les
            reverra à la période suivante.
          </li>
        </ul>
      </Callout.Text>
      <Button
        aria-label="Masquer les règles"
        className="-mr-1 -mt-1 shrink-0 justify-center px-2"
        iconLeft={
          <span aria-hidden="true" className="flex">
            <Icone className="size-4 text-current" icone={CloseLineIcon} />
          </span>
        }
        onClick={() => setVisible(false)}
        size="sm"
        title="Masquer les règles"
        variant="tertiary-no-outline"
      />
    </Callout.Root>
  );
};

export const PeriodesInformation = () => {
  const { data: donnees, isLoading } =
    api.formation.periodesInformation.useQuery();
  const [edition, setEdition] = useState<Edition>(null);
  const [suppression, setSuppression] = useState<PeriodeInformation | null>(
    null,
  );
  const modifier = useCallback(
    (periode: PeriodeInformation) => setEdition({ periode }),
    [],
  );
  const table = useTableauPeriodesInformation({
    periodes: donnees?.periodes ?? [],
    modifier,
    supprimer: setSuppression,
  });

  return (
    <div className="flex flex-col gap-4">
      <ReglesPeriodes />
      <div>
        <Button onClick={() => setEdition({ periode: null })} variant="primary">
          + Ajouter une période
        </Button>
      </div>
      <TableauAdmin
        caption="Périodes d'information"
        isLoading={isLoading}
        libelles={LIBELLES}
        table={table}
      />
      {edition && donnees ? (
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
