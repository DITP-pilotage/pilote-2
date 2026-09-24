import { Suspense } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import api from "@/server/infrastructure/api/trpc/api";
import FilAriane from "@/components/_commons/FilAriane/FilAriane";
import { clsxm } from "@/utils/clsxm";
import TableauIndicateursNonAJour from "./TableauIndicateursNonAJour";
import { TableauAParametrer } from "./TableauAParametrer";
import { EtatVide } from "./EtatVide";
import { ErreurChargementBoundary } from "./ErreurChargementBoundary";

const ONGLETS = ["non-a-jour", "a-parametrer"] as const;

const Contenu = ({ jalon }: { jalon: number }) => {
  const [onglet, setOnglet] = useQueryState(
    "onglet",
    parseAsStringLiteral(ONGLETS).withDefault("non-a-jour"),
  );
  const [{ nonAJour, aParametrer }] =
    api.indicateursNonAJour.lister.useSuspenseQuery();

  const onglets = [
    { id: "non-a-jour", libelle: "Non à jour", nombre: nonAJour.length },
    { id: "a-parametrer", libelle: "À paramétrer", nombre: aParametrer.length },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4 border-b border-gray-200" role="tablist">
        {onglets.map((item) => {
          const actif = onglet === item.id;
          return (
            <button
              aria-selected={actif}
              className={clsxm(
                "-mb-px flex h-12 items-center gap-2 border-b-[3px] px-1 text-base",
                actif
                  ? "border-primary font-bold text-primary"
                  : "border-transparent font-medium",
              )}
              key={item.id}
              onClick={() => setOnglet(item.id)}
              role="tab"
              type="button"
            >
              {item.libelle}
              <span
                className={clsxm(
                  "rounded-full px-2 text-xs font-bold",
                  actif ? "bg-primary text-white" : "bg-gray-200",
                )}
              >
                {item.nombre}
              </span>
            </button>
          );
        })}
      </div>
      <div role="tabpanel">
        {onglet === "non-a-jour" ? (
          nonAJour.length === 0 ? (
            <EtatVide
              description="Aucun indicateur de vos chantiers n'attend de nouvelle valeur pour le moment."
              titre="Tous vos indicateurs sont à jour"
            />
          ) : (
            <TableauIndicateursNonAJour indicateurs={nonAJour} />
          )
        ) : aParametrer.length === 0 ? (
          <EtatVide
            description="Tous les indicateurs de vos chantiers ont une valeur initiale et une cible pour l'année."
            titre="Aucun indicateur à paramétrer"
          />
        ) : (
          <TableauAParametrer indicateurs={aParametrer} jalon={jalon} />
        )}
      </div>
    </div>
  );
};

const PageIndicateursAMettreAJour = ({ jalon }: { jalon: number }) => (
  <main>
    <div className="bg-dsfr-blue-france-975">
      <div className="fr-container flex flex-col gap-3 py-8">
        <FilAriane libelléPageCourante="Mes indicateurs à mettre à jour" />
        <span className="text-xs font-bold uppercase tracking-widest text-primary">
          Suivi hebdomadaire
        </span>
        <h1 className="fr-h2 fr-mb-0">Mes indicateurs à mettre à jour</h1>
        <p className="fr-mb-0 max-w-3xl">
          Retrouvez le détail, territoire par territoire, des indicateurs de vos
          chantiers dont la dernière valeur n'est plus à jour, et de ceux dont
          le taux d'avancement ne peut pas être calculé.
        </p>
        <span className="fr-text--xs fr-mb-0 text-dsfr-mention-grey">
          Retard = jours écoulés depuis la date de mise à jour attendue
        </span>
      </div>
    </div>
    <div className="fr-container py-8">
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErreurChargementBoundary onReset={reset}>
            <Suspense
              fallback={
                <p className="fr-text--sm">Chargement des indicateurs…</p>
              }
            >
              <Contenu jalon={jalon} />
            </Suspense>
          </ErreurChargementBoundary>
        )}
      </QueryErrorResetBoundary>
    </div>
  </main>
);

export default PageIndicateursAMettreAJour;
