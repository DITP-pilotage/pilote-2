import Link from "next/link";
import { Progress } from "@/components/shared/Progress";
import { Icone } from "@/components/_commons/Icone";
import { ArrowSLineIcon } from "@/components/_commons/Icones/ArrowSLineIcon";
import { ArrowSLine2Icon } from "@/components/_commons/Icones/ArrowSLine2Icon";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { clsxm } from "@/utils/clsxm";
import { BadgeRetard } from "./BadgeRetard";
import { CLASSES_TONALITE_RETARD, tonaliteRetard } from "./retard";
import { DetailTerritoires } from "./DetailTerritoires";
import type { LigneIndicateurNonAJour } from "./useTableauIndicateursNonAJour";

const formaterDate = (dateISO: string | null) =>
  dateISO ? PiloteDateFormatter.isoDateFranceMetropolitaine(dateISO) : "—";

export const GRILLE_INDICATEUR =
  "md:grid md:grid-cols-[2.6fr_1.2fr_1.3fr_1fr_1fr_1fr_44px] md:gap-4 md:items-center";

export const LigneIndicateur = ({
  ligne,
}: {
  ligne: LigneIndicateurNonAJour;
}) => {
  const indicateur = ligne.original;
  const estDeplie = ligne.getIsExpanded();

  return (
    <li className="border-t border-gray-200">
      <div
        className={clsxm(
          "flex flex-col gap-3 px-4 py-4 md:px-6",
          GRILLE_INDICATEUR,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <Link
              className="line-clamp-2 !bg-none font-medium leading-snug !text-current hover:!text-primary hover:underline"
              href={`/chantier/${indicateur.chantierId}/indicateurs`}
              title={indicateur.nom}
            >
              {indicateur.nom}
            </Link>
            <span className="text-xs text-dsfr-mention-grey">
              {indicateur.indicateurId}
              {indicateur.periodicite ? ` · ${indicateur.periodicite}` : ""}
            </span>
          </div>
          <span className="md:hidden">
            <BadgeRetard retardJours={indicateur.retardMaxJours} />
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {indicateur.mailles.map((maille) => (
            <span
              className="rounded bg-dsfr-blue-france-925 px-2 py-0.5 text-xs font-medium text-primary"
              key={maille}
            >
              {maille}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm">
            <strong>{indicateur.nbTerritoiresEnRetard}</strong>
            <span className="text-dsfr-mention-grey">
              {" "}
              / {indicateur.nbTerritoiresApplicables} territoires
            </span>
          </span>
          <Progress
            aria-label="Part des territoires en retard"
            className="h-1.5 bg-gray-200"
            indicatorClassName={
              CLASSES_TONALITE_RETARD[tonaliteRetard(indicateur.retardMaxJours)]
                .barre
            }
            max={indicateur.nbTerritoiresApplicables}
            value={indicateur.nbTerritoiresEnRetard}
          />
        </div>
        <span className="text-sm max-md:hidden">
          {formaterDate(indicateur.dateDerniereValeurPlusAncienne)}
        </span>
        <span className="text-sm max-md:hidden">
          {formaterDate(indicateur.dateMajAttenduePlusAncienne)}
        </span>
        <span className="max-md:hidden">
          <BadgeRetard retardJours={indicateur.retardMaxJours} />
        </span>
        <button
          aria-expanded={estDeplie}
          aria-label={`Afficher le détail par territoire de ${indicateur.nom}`}
          className="flex h-9 items-center justify-center gap-1 rounded-lg text-sm font-medium text-primary hover:bg-dsfr-blue-france-925 max-md:w-full md:w-9"
          onClick={() => ligne.getToggleExpandedHandler()()}
          type="button"
        >
          <Icone
            className="h-5 w-5 !text-current"
            icone={estDeplie ? ArrowSLineIcon : ArrowSLine2Icon}
          />
          <span className="md:hidden">
            {estDeplie ? "Masquer le détail" : "Voir le détail"}
          </span>
        </button>
      </div>
      {estDeplie ? <DetailTerritoires indicateur={indicateur} /> : null}
    </li>
  );
};
