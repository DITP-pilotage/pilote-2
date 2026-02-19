import { Suspense, useState } from "react";
import { parseAsString, useQueryState } from "nuqs";
import api from "@/server/infrastructure/api/trpc/api";
import BarreLatérale from "@/components/_commons/BarreLatérale/BarreLatérale";
import BarreLatéraleEncart from "@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart";
import { PiloteDateFormatter } from "@/server/rapports-hebdomadaires/infrastructure/adapters/PiloteDateFormatter";
import { RapportDetail } from "./RapportDetail";

const PageRapportsHebdomadaires = () => {
  const [rapportId, setRapportId] = useQueryState("rapportId", parseAsString);
  const [rapports] = api.rapportHebdomadaire.lister.useSuspenseQuery();
  const effectiveRapportId = rapportId ?? rapports[0]?.id ?? null;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      style={{ "--menu-width": "320px" } as React.CSSProperties}
      className="min-h-screen grid md:grid-cols-[var(--menu-width)_1fr_var(--menu-width)] max-md:grid-rows-[auto_1fr] bg-dsfr-contrast-grey"
    >
      <BarreLatérale estOuvert={isOpen} setEstOuvert={setIsOpen}>
        <BarreLatéraleEncart className="bg-dsfr-blue-france-925">
          <div className="fr-text--sm fr-text--bold mb-2">
            {rapports.length} rapport{rapports.length > 1 ? "s" : ""}
          </div>
          <h2 className="fr-h6 mb-4">Mes rapports</h2>
        </BarreLatéraleEncart>

        <div>
          {rapports.length === 0 ? (
            <div className="p-4 fr-text--sm">Aucun rapport disponible</div>
          ) : (
            rapports.map((rapport, index) => (
              <button
                key={rapport.id}
                className={`w-full text-left p-4 fr-mb-0 fr-text--sm ${
                  effectiveRapportId === rapport.id
                    ? "bg-dsfr-blue-france-950"
                    : ""
                } ${index > 0 ? "fr-border-top" : ""}`}
                onClick={() => setRapportId(rapport.id)}
                style={{
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                type="button"
              >
                Semaine du{" "}
                {PiloteDateFormatter.dateFrancaiseLongue(rapport.periodeDebut)}
              </button>
            ))
          )}
        </div>
      </BarreLatérale>

      <main className="md:col-span-2 md:grid md:grid-cols-subgrid md:grid-rows-[auto_1fr]">
        <div className="fr-background-blue-france-850 col-span-2 grid grid-cols-subgrid">
          <div className="fr-container py-6">
            <h1 className="fr-h3 fr-mb-0">Rapports hebdomadaires</h1>
          </div>
        </div>

        <div className="fr-container max-2xl:col-span-2">
          {rapports.length === 0 ? (
            <div className="p-12 flex items-center justify-center fr-text--sm text-dsfr-grey-625">
              Les rapports hebdomadaires apparaîtront ici lorsqu'ils seront
              disponibles.
            </div>
          ) : effectiveRapportId ? (
            <Suspense fallback={null}>
              <RapportDetail rapportId={effectiveRapportId} />
            </Suspense>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default PageRapportsHebdomadaires;
