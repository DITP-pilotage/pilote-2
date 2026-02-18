import { Suspense, useState } from "react";
import { parseAsString, useQueryState } from "nuqs";
import api from "@/server/infrastructure/api/trpc/api";
import BarreLatérale from "@/components/_commons/BarreLatérale/BarreLatérale";
import BarreLatéraleEncart from "@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart";
import RapportDetail from "./RapportDetail";
import PageRapportsHebdomadairesStyled from "./PageRapportsHebdomadaires.styled";

const formatterDateSemaine = (date: Date): string => {
  const d = new Date(date);
  const jour = d.getDate();
  const jourFormaté = jour === 1 ? "1er" : String(jour);
  const mois = d.toLocaleDateString("fr-FR", { month: "long" });
  return `${jourFormaté} ${mois} ${d.getFullYear()}`;
};

const PageRapportsHebdomadaires = () => {
  const [rapportId, setRapportId] = useQueryState("rapportId", parseAsString);
  const [rapports] = api.rapportHebdomadaire.lister.useSuspenseQuery();

  return (
    <PageRapportsHebdomadairesStyled
      style={{
        "--menu-width": "320px",
      }}
      className="min-h-screen grid grid-cols-[var(--menu-width)_1fr_var(--menu-width)]"
    >
      <BarreLatérale estOuvert={false} setEstOuvert={() => {}}>
        <BarreLatéraleEncart className="bg-dsfr-blue-france-925">
          <div className="fr-text--sm fr-text--bold fr-mb-1w">
            {rapports.length} rapport{rapports.length > 1 ? "s" : ""}
          </div>
          <h2 className="fr-h6 fr-mb-2w">Mes rapports</h2>
        </BarreLatéraleEncart>

        <div>
          {rapports.length === 0 ? (
            <div className="fr-p-2w fr-text--sm">Aucun rapport disponible</div>
          ) : (
            rapports.map((rapport, index) => (
              <button
                key={rapport.id}
                className={`w-full text-left fr-p-2w fr-text--sm ${
                  rapportId === rapport.id ? "bg-dsfr-blue-france-950" : ""
                } ${index > 0 ? "fr-border-top" : ""}`}
                onClick={() => setRapportId(rapport.id)}
                style={{
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                type="button"
              >
                Semaine du {formatterDateSemaine(rapport.periodeDebut)}
              </button>
            ))
          )}
        </div>
      </BarreLatérale>

      <main className="col-span-2 grid grid-cols-subgrid">
        <div className="fr-background-blue-france-850 col-span-2 grid grid-cols-subgrid">
          <div className="fr-container fr-py-3w">
            <h1 className="fr-h3 fr-mb-0">Rapports hebdomadaires</h1>
          </div>
        </div>

        <div className="fr-container max-2xl:col-span-2">
          {rapportId ? (
            <Suspense fallback={null}>
              <RapportDetail rapportId={rapportId} />
            </Suspense>
          ) : (
            <div className="fr-p-6w flex items-center justify-center fr-text--sm">
              Sélectionnez un rapport pour voir les détails
            </div>
          )}
        </div>
      </main>
    </PageRapportsHebdomadairesStyled>
  );
};

export default PageRapportsHebdomadaires;
