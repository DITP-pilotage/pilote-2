import { Progress } from "@/components/shared/Progress";
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
            <a
              className="fr-link font-medium"
              href={`/chantier/${indicateur.chantierId}/indicateurs`}
            >
              {indicateur.nom}
            </a>
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
          className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm justify-center max-md:w-full"
          onClick={() => ligne.getToggleExpandedHandler()()}
          type="button"
        >
          <span
            aria-hidden
            className={clsxm(
              "fr-icon-arrow-down-s-line transition-transform",
              estDeplie && "rotate-180",
            )}
          />
          <span className="fr-ml-1w md:hidden">
            {estDeplie ? "Masquer le détail" : "Voir le détail"}
          </span>
        </button>
      </div>
      {estDeplie ? <DetailTerritoires indicateur={indicateur} /> : null}
    </li>
  );
};
