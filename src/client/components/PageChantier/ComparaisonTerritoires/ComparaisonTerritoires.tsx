import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { ColonneMesuree } from "@/components/_commons/Widget/TuileWidget/TuileWidget";
import { useComparaisonTerritoires } from "./useComparaisonTerritoires";
import { PanneauCarte } from "./PanneauCarte";

type ComparaisonTerritoiresProps = {
  chantierId: string;
  jalon: number;
  maille: MailleInterne;
  territoireCode: string;
};

export const ComparaisonTerritoires = ({
  chantierId,
  jalon,
  maille,
  territoireCode,
}: ComparaisonTerritoiresProps) => {
  const {
    panneauGauche,
    panneauDroite,
    changerTypeCarte,
    activerComparaison,
    supprimerPanneau,
  } = useComparaisonTerritoires();

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
          <PanneauCarte
            chantierId={chantierId}
            jalon={jalon}
            maille={maille}
            territoireCode={territoireCode}
            typeCarte={panneauGauche}
            estEnComparaison={estEnComparaison}
            onChangerType={(type) => changerTypeCarte("gauche", type)}
            onComparer={activerComparaison}
            onSupprimer={() => supprimerPanneau("gauche")}
          />
        </ColonneMesuree>

        {estEnComparaison && panneauDroite !== null && (
          <ColonneMesuree>
            <PanneauCarte
              chantierId={chantierId}
              jalon={jalon}
              maille={maille}
              territoireCode={territoireCode}
              typeCarte={panneauDroite}
              estEnComparaison={estEnComparaison}
              onChangerType={(type) => changerTypeCarte("droite", type)}
              onComparer={activerComparaison}
              onSupprimer={() => supprimerPanneau("droite")}
            />
          </ColonneMesuree>
        )}
      </div>
    </div>
  );
};
