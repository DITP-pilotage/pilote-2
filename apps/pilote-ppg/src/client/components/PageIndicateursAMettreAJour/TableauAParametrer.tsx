import type {
  IndicateurAParametrer,
  ManqueParametrage,
} from "@/server/suivi-indicateurs/domain/IndicateursAMettreAJour";

const libelleManque = (manque: ManqueParametrage, jalon: number) =>
  manque === "VALEUR_INITIALE" ? "Valeur initiale" : `Cible ${jalon}`;

export const TableauAParametrer = ({
  indicateurs,
  jalon,
}: {
  indicateurs: IndicateurAParametrer[];
  jalon: number;
}) => (
  <div className="flex flex-col gap-5">
    <div className="fr-callout fr-mb-0">
      <p className="fr-callout__text fr-text--sm">
        Le taux d'avancement de ces indicateurs ne peut pas être calculé : il
        manque la valeur initiale ou la valeur cible {jalon} sur au moins un
        territoire applicable.
      </p>
    </div>
    <ul className="m-0 list-none overflow-hidden rounded-xl border border-gray-200 bg-white p-0">
      {indicateurs.map((indicateur) => (
        <li
          className="flex flex-col gap-2 border-t border-gray-200 px-4 py-4 first:border-t-0 md:grid md:grid-cols-[2.4fr_1.6fr_1.4fr_1fr_180px] md:items-center md:gap-4 md:px-6"
          key={indicateur.indicateurId}
        >
          <div className="flex flex-col gap-1">
            <span className="font-medium">{indicateur.nom}</span>
            <span className="text-xs text-dsfr-mention-grey">
              {indicateur.indicateurId}
            </span>
          </div>
          <span className="text-sm">{indicateur.chantierNom}</span>
          <div className="flex flex-wrap gap-1">
            {indicateur.manques.map((manque) => (
              <span
                className="rounded-full bg-[#fdf9ea] px-2.5 py-0.5 text-xs font-bold text-[#7a5500]"
                key={manque}
              >
                {libelleManque(manque, jalon)}
              </span>
            ))}
          </div>
          <span className="text-sm">
            {indicateur.nbTerritoires} territoire
            {indicateur.nbTerritoires > 1 ? "s" : ""}
          </span>
          <a
            className="!bg-none text-sm font-medium text-primary hover:underline md:justify-self-end"
            href={`/chantier/${indicateur.chantierId}/indicateurs`}
          >
            Compléter les valeurs
          </a>
        </li>
      ))}
    </ul>
  </div>
);
