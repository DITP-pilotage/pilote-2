import type { Table } from "@tanstack/react-table";
import type { ReactNode } from "react";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import { Icone } from "@/components/_commons/Icone";
import { ArrowGoBackIcon } from "@/components/_commons/Icones/ArrowGoBackIcon";

export function FiltresTableauAdmin<TRow>({
  table,
  aDesFiltresActifs,
  reinitialiserLesFiltres,
  children,
}: {
  table: Table<TRow>;
  aDesFiltresActifs: boolean;
  reinitialiserLesFiltres: () => void;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50">
      <div className="w-full max-w-sm">
        <BarreDeRecherche
          changementDeLaRechercheCallback={(event) =>
            table.setGlobalFilter(event.target.value)
          }
          valeur={(table.getState().globalFilter as string | undefined) ?? ""}
        />
      </div>

      {children}

      <Bouton
        disabled={!aDesFiltresActifs}
        iconLeft={
          <Icone
            className="w-4 h-4 text-current rotate-y-180"
            icone={ArrowGoBackIcon}
          />
        }
        label="Réinitialiser les filtres"
        onClick={reinitialiserLesFiltres}
        size="sm"
        variant="secondary"
      />
    </section>
  );
}
