import api from "@/server/infrastructure/api/trpc/api";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import type { IndicateurNonAJour } from "@/server/suivi-indicateurs/domain/IndicateursAMettreAJour";
import { BadgeRetard } from "./BadgeRetard";

const LIBELLES_MAILLE = {
  NAT: "National",
  REG: "Régional",
  DEPT: "Départemental",
} as const;

const formaterDate = (dateISO: string | null) =>
  dateISO ? PiloteDateFormatter.isoDateFranceMetropolitaine(dateISO) : "—";

const GRILLE =
  "md:grid md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr] md:gap-3 md:items-center";

const ListeTerritoires = ({ indicateurId }: { indicateurId: string }) => {
  const {
    data: territoires,
    isPending,
    isError,
  } = api.indicateursNonAJour.listerTerritoires.useQuery({ indicateurId });

  if (isPending) {
    return <p className="fr-text--sm fr-mb-0">Chargement des territoires…</p>;
  }
  if (isError) {
    return (
      <p className="fr-text--sm fr-mb-0 text-dsfr-error-425">
        Le détail par territoire n'a pas pu être chargé.
      </p>
    );
  }

  return (
    <>
      <div
        aria-hidden
        className={`hidden px-3 text-xs font-bold text-dsfr-mention-grey ${GRILLE}`}
      >
        <span>Territoire</span>
        <span>Maille</span>
        <span>Dernière valeur</span>
        <span>MAJ attendue</span>
        <span>Retard</span>
      </div>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {territoires.map((territoire) => (
          <li
            className={`flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 text-sm ${GRILLE}`}
            key={territoire.code}
          >
            <span className="flex-1 font-medium">{territoire.nom}</span>
            <span className="text-dsfr-mention-grey max-md:hidden">
              {LIBELLES_MAILLE[territoire.maille]}
            </span>
            <span className="max-md:hidden">
              {formaterDate(territoire.dateDerniereValeur)}
            </span>
            <span className="max-md:hidden">
              {formaterDate(territoire.dateMajAttendue)}
            </span>
            <BadgeRetard retardJours={territoire.retardJours} />
          </li>
        ))}
      </ul>
    </>
  );
};

export const DetailTerritoires = ({
  indicateur,
}: {
  indicateur: IndicateurNonAJour;
}) => (
  <div className="mx-4 mb-5 flex flex-col gap-6 rounded-lg bg-gray-100 p-4 md:mx-6 md:flex-row md:p-5">
    <div className="flex flex-1 flex-col gap-3">
      <span className="text-xs font-bold uppercase tracking-wider text-dsfr-mention-grey">
        Territoires non à jour · triés par retard
      </span>
      <ListeTerritoires indicateurId={indicateur.indicateurId} />
    </div>
    <aside className="flex flex-col gap-4 md:w-72 md:border-l md:border-gray-300 md:pl-6">
      {indicateur.responsablesDonneesMails.length > 0 ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-dsfr-mention-grey">
            Responsable des données
          </span>
          {indicateur.responsablesDonneesMails.map((email) => (
            <a
              className="fr-link fr-text--sm break-all"
              href={`mailto:${email}`}
              key={email}
            >
              {email}
            </a>
          ))}
        </div>
      ) : null}
      {indicateur.delaiDisponibilite !== null ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-dsfr-mention-grey">
            Délai de disponibilité
          </span>
          <span className="fr-text--sm fr-mb-0">
            {indicateur.delaiDisponibilite} mois après la fin de période
          </span>
        </div>
      ) : null}
      <a
        className="fr-btn fr-btn--sm justify-center"
        href={`/chantier/${indicateur.chantierId}/indicateurs`}
      >
        Importer des valeurs
      </a>
    </aside>
  </div>
);
