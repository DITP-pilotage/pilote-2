import { ReactNode, Suspense } from "react";
import { ColonneMesuree } from "@/components/_commons/Widget/TuileWidget/TuileWidget";
import { useComparaisonTerritoires } from "./useComparaisonTerritoires";
import { PanneauCarte } from "./PanneauCarte";

type ComparaisonTerritoiresProps<T extends string> = {
  typeParDefaut: T;
  typeAlternatif: (typeActuel: T) => T;
  options: { value: T; label: string }[];
  renderCarte: (typeCarte: T) => ReactNode;
  nomFichier: string;
  mode?: "card" | "inline";
  exporterEnCsv?: (typeCarte: T) => void;
};

export const ComparaisonTerritoires = <T extends string>({
  typeParDefaut,
  typeAlternatif,
  options,
  renderCarte,
  nomFichier,
  mode = "card",
  exporterEnCsv,
}: ComparaisonTerritoiresProps<T>) => {
  const {
    panneauGauche,
    panneauDroite,
    changerTypeCarte,
    activerComparaison,
    supprimerPanneau,
  } = useComparaisonTerritoires({ typeParDefaut, typeAlternatif });

  const estEnComparaison = panneauDroite !== null;

  return (
    <div
      className={
        mode === "card"
          ? "bg-white border border-dsfr-grey-925 rounded-lg p-6 flex flex-col gap-4"
          : "flex flex-col gap-4"
      }
    >
      {mode === "card" && (
        <span className="fr-text--xl font-bold fr-m-0">
          Comparaison territoriale et évolution
        </span>
      )}
      <div
        className="grid max-sm:!grid-cols-1 gap-14"
        style={{
          gridTemplateColumns: estEnComparaison ? "repeat(2, 1fr)" : "1fr",
        }}
      >
        <ColonneMesuree>
          <Suspense>
            <PanneauCarte
              typeCarte={panneauGauche}
              options={options}
              estEnComparaison={estEnComparaison}
              onChangerType={(type) => changerTypeCarte("gauche", type)}
              onComparer={activerComparaison}
              onSupprimer={() => supprimerPanneau("gauche")}
              renderCarte={renderCarte}
              nomFichier={nomFichier}
              exporterEnCsv={
                exporterEnCsv ? () => exporterEnCsv(panneauGauche) : undefined
              }
            />
          </Suspense>
        </ColonneMesuree>

        {panneauDroite != null && (
          <ColonneMesuree>
            <Suspense>
              <PanneauCarte
                typeCarte={panneauDroite}
                options={options}
                estEnComparaison={estEnComparaison}
                onChangerType={(type) => changerTypeCarte("droite", type)}
                onComparer={activerComparaison}
                onSupprimer={() => supprimerPanneau("droite")}
                renderCarte={renderCarte}
                nomFichier={nomFichier}
                exporterEnCsv={
                  exporterEnCsv ? () => exporterEnCsv(panneauDroite) : undefined
                }
              />
            </Suspense>
          </ColonneMesuree>
        )}
      </div>
    </div>
  );
};
