import { useEffect, useRef } from "react";
import { DétailTerritoire } from "@/shared/territoire/Territoire.interface";
import { MailleInterne } from "@/shared/maille/Maille.interface";
import { ChantierRapportDetailleWithoutMailles } from "@/server/rapport-detaille/rapportDetaille.interface";
import { RapportDétailléChantier } from "@/components/PageRapportDétaillé/Chantier/RapportDétailléChantier";
import { ChantierDetailState } from "@/components/PageRapportDétaillé/useChantierDetailsBatches";

const PRELOAD_MARGIN = "1500px 0px";

export const DeferredRapportDétailléChantier = ({
  chantier,
  state,
  onVisible,
  jalon,
  mailleSelectionnee,
  territoireCode,
  territoireSélectionné,
}: {
  chantier: ChantierRapportDetailleWithoutMailles;
  state: ChantierDetailState | undefined;
  onVisible: (chantierId: string) => void;
  jalon: number;
  mailleSelectionnee: MailleInterne;
  territoireCode: string;
  territoireSélectionné: DétailTerritoire;
}) => {
  const placeholderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const placeholder = placeholderRef.current;
    if (!placeholder || state) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onVisible(chantier.id);
          observer.disconnect();
        }
      },
      { rootMargin: PRELOAD_MARGIN },
    );
    observer.observe(placeholder);
    return () => observer.disconnect();
  }, [chantier.id, onVisible, state]);

  if (state?.status === "success") {
    return (
      <RapportDétailléChantier
        chantier={chantier}
        detail={state.detail}
        jalon={jalon}
        mailleSelectionnee={mailleSelectionnee}
        territoireCode={territoireCode}
        territoireSélectionné={territoireSélectionné}
      />
    );
  }

  return (
    <section
      aria-busy={state?.status !== "error"}
      className="mt-8 rounded-lg border border-dsfr-grey-925 p-6"
      ref={placeholderRef}
    >
      <h2 className="mb-4 text-2xl font-bold text-dsfr-grey-50">
        {chantier.nom}
      </h2>
      {state?.status === "error" ? (
        <div className="flex items-center gap-4">
          <p className="mb-0 text-error">
            Le détail de ce chantier n'a pas pu être chargé.
          </p>
          <button
            className="rounded border border-primary px-4 py-1 font-medium text-primary hover:bg-dsfr-blue-france-950"
            onClick={() => onVisible(chantier.id)}
            type="button"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <div className="h-[56rem] animate-pulse rounded-lg bg-dsfr-grey-950" />
      )}
    </section>
  );
};
