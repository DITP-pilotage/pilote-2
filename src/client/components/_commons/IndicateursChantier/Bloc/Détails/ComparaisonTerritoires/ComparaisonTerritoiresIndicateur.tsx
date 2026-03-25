import { Suspense } from "react";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { ColonneMesuree } from "@/components/_commons/Widget/TuileWidget/TuileWidget";
import { useComparaisonTerritoiresIndicateur } from "./useComparaisonTerritoiresIndicateur";
import { PanneauCarteIndicateur } from "./PanneauCarteIndicateur";

type ComparaisonTerritoiresIndicateurProps = {
  indicateurId: string;
  chantierId: string;
  jalon: number;
  maille: MailleInterne;
  territoireCode: string;
  unite: string | null;
};

export const ComparaisonTerritoiresIndicateur = ({
  indicateurId,
  chantierId,
  jalon,
  maille,
  territoireCode,
  unite,
}: ComparaisonTerritoiresIndicateurProps) => {
  const {
    panneauGauche,
    panneauDroite,
    changerTypeCarte,
    activerComparaison,
    supprimerPanneau,
  } = useComparaisonTerritoiresIndicateur();

  const estEnComparaison = panneauDroite !== null;

  return (
    <div className="fr-card fr-p-3w flex flex-col gap-4">
      <span className="fr-text--xl font-bold fr-m-0">
        Comparaison territoriale et évolution
      </span>
      <div
        className="grid max-sm:!grid-cols-1 gap-14"
        style={{
          gridTemplateColumns: estEnComparaison ? "repeat(2, 1fr)" : "1fr",
        }}
      >
        <ColonneMesuree>
          <PanneauCarteIndicateur
            indicateurId={indicateurId}
            chantierId={chantierId}
            jalon={jalon}
            maille={maille}
            territoireCode={territoireCode}
            unite={unite}
            typeCarte={panneauGauche}
            estEnComparaison={estEnComparaison}
            onChangerType={(type) => changerTypeCarte("gauche", type)}
            onComparer={activerComparaison}
            onSupprimer={() => supprimerPanneau("gauche")}
          />
        </ColonneMesuree>

        {panneauDroite != null && (
          <ColonneMesuree>
            <Suspense>
              <PanneauCarteIndicateur
                indicateurId={indicateurId}
                chantierId={chantierId}
                jalon={jalon}
                maille={maille}
                territoireCode={territoireCode}
                unite={unite}
                typeCarte={panneauDroite}
                estEnComparaison={estEnComparaison}
                onChangerType={(type) => changerTypeCarte("droite", type)}
                onComparer={activerComparaison}
                onSupprimer={() => supprimerPanneau("droite")}
              />
            </Suspense>
          </ColonneMesuree>
        )}
      </div>
    </div>
  );
};
