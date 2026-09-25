import Link from "next/link";
import type {
  IndicateurAParametrer,
  ManqueParametrage,
} from "@/server/suivi-indicateurs/domain/IndicateursAMettreAJour";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import { SegmentedControl } from "@/components/shared/SegmentedControl";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";
import { clsxm } from "@/utils/clsxm";
import { EnveloppeCarteChantier } from "./EnveloppeCarteChantier";
import { FiltreChantiers } from "./FiltreChantiers";
import { PaginationChantiers } from "./PaginationChantiers";
import {
  useTableauAParametrer,
  type LigneAParametrer,
} from "./useTableauAParametrer";

const CLASSES_PASTILLE_MANQUE =
  "whitespace-nowrap rounded-full bg-[#fdf9ea] px-2.5 py-0.5 text-xs font-bold text-[#7a5500]";

const GRILLE_A_PARAMETRER =
  "md:grid md:grid-cols-[2.6fr_1.6fr_1.4fr_200px] md:gap-4 md:items-center";

const libelleManque = (manque: ManqueParametrage, jalon: number) =>
  manque === "VALEUR_INITIALE" ? "Valeur initiale" : `Cible ${jalon}`;

const LigneIndicateurAParametrer = ({
  indicateur,
  jalon,
}: {
  indicateur: IndicateurAParametrer;
  jalon: number;
}) => (
  <li
    className={clsxm(
      "flex flex-col gap-3 border-t border-gray-200 px-4 py-4 text-sm md:px-6",
      GRILLE_A_PARAMETRER,
    )}
  >
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
    <div className="flex flex-wrap gap-1.5">
      {indicateur.manques.map((manque) => (
        <span className={CLASSES_PASTILLE_MANQUE} key={manque}>
          {libelleManque(manque, jalon)}
        </span>
      ))}
    </div>
    <span>
      <strong>{indicateur.nbTerritoires}</strong>
      <span className="text-dsfr-mention-grey">
        {" "}
        / {indicateur.nbTerritoiresApplicables} territoire
        {indicateur.nbTerritoiresApplicables > 1 ? "s" : ""}
      </span>
    </span>
    <Link
      className="inline-flex items-center gap-1 !bg-none font-medium text-primary hover:underline md:justify-self-end"
      href={`/chantier/${indicateur.chantierId}/indicateurs`}
    >
      Compléter les valeurs
      <Icone className="h-4 w-4 !text-current" icone={ArrowLine1Icon} />
    </Link>
  </li>
);

const CarteChantierAParametrer = ({
  groupe,
  jalon,
}: {
  groupe: LigneAParametrer;
  jalon: number;
}) => {
  const { chantierId, chantierNom } = groupe.subRows[0].original;
  const nombre = groupe.subRows.length;

  return (
    <EnveloppeCarteChantier
      badge={
        <span className="fr-badge fr-badge--no-icon !w-auto whitespace-nowrap bg-[#fdf9ea] text-xs text-[#7a5500]">
          {nombre} indicateur{nombre > 1 ? "s" : ""} à paramétrer
        </span>
      }
      chantierId={chantierId}
      chantierNom={chantierNom}
    >
      <div
        aria-hidden
        className={clsxm(
          "hidden px-6 py-2 text-xs font-bold text-dsfr-mention-grey",
          GRILLE_A_PARAMETRER,
        )}
      >
        <span>Indicateur</span>
        <span>Donnée manquante</span>
        <span>Territoires concernés</span>
        <span />
      </div>
      <ul className="m-0 list-none p-0">
        {groupe.subRows.map((ligne) => (
          <LigneIndicateurAParametrer
            indicateur={ligne.original}
            jalon={jalon}
            key={ligne.id}
          />
        ))}
      </ul>
    </EnveloppeCarteChantier>
  );
};

export const TableauAParametrer = ({
  indicateurs,
  jalon,
}: {
  indicateurs: IndicateurAParametrer[];
  jalon: number;
}) => {
  const {
    tableau,
    pagination,
    recherche,
    setRecherche,
    chantiersFiltres,
    setChantiersFiltres,
    manqueFiltre,
    setManqueFiltre,
    optionsChantiers,
  } = useTableauAParametrer(indicateurs);
  const groupes = tableau.getRowModel().rows;

  const optionsManque = [
    { valeur: "TOUTES", libelle: "Toutes" },
    { valeur: "VALEUR_INITIALE", libelle: "Valeur initiale" },
    { valeur: "VALEUR_CIBLE", libelle: `Cible ${jalon}` },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="fr-callout fr-mb-0">
        <p className="fr-callout__text fr-text--sm">
          Le taux d'avancement de ces indicateurs ne peut pas être calculé : il
          manque la valeur initiale ou la valeur cible {jalon} sur au moins un
          territoire applicable.
        </p>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="md:w-96">
          <BarreDeRecherche
            changementDeLaRechercheCallback={(event) =>
              setRecherche(event.target.value)
            }
            valeur={recherche}
          />
        </div>
        <FiltreChantiers
          chantiersFiltres={chantiersFiltres}
          optionsChantiers={optionsChantiers}
          setChantiersFiltres={setChantiersFiltres}
        />
        <SegmentedControl.Root
          aria-label="Filtrer par donnée manquante"
          className="overflow-x-auto md:ml-auto"
          onValueChange={(valeur) => {
            if (!valeur) return;
            setManqueFiltre(
              valeur === "TOUTES" ? null : (valeur as ManqueParametrage),
            );
          }}
          type="single"
          value={manqueFiltre ?? "TOUTES"}
        >
          {optionsManque.map((option) => (
            <SegmentedControl.Item key={option.valeur} value={option.valeur}>
              {option.libelle}
            </SegmentedControl.Item>
          ))}
        </SegmentedControl.Root>
      </div>
      {groupes.length === 0 ? (
        <p className="fr-text--sm text-dsfr-mention-grey">
          Aucun indicateur ne correspond à vos filtres.
        </p>
      ) : (
        groupes.map((groupe) => (
          <CarteChantierAParametrer
            groupe={groupe}
            jalon={jalon}
            key={groupe.id}
          />
        ))
      )}
      <PaginationChantiers
        nombreDeChantiers={tableau.getPrePaginatedRowModel().rows.length}
        nombreDePages={tableau.getPageCount()}
        pagination={pagination}
        setPageIndex={tableau.setPageIndex}
        setPageSize={tableau.setPageSize}
      />
    </div>
  );
};
