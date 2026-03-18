import api from "@/server/infrastructure/api/trpc/api";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";

const COULEUR_MINIMUM = "#cbcbe8";
const COULEUR_MÉDIANE = "#6666bd";
const COULEUR_MAXIMUM = "#000091";

const libelleMaille = (maille: MailleInterne): string =>
  maille === "departementale" ? "départements" : "régions";

const formatValeur = (valeur: number | null | undefined): string | null => {
  if (valeur === null || valeur === undefined) return null;
  return `${Math.round(valeur)}%`;
};

export const ValeursRemarquables = ({
  chantierId,
  maille,
  jalon,
}: {
  chantierId: string;
  maille: MailleInterne;
  jalon: number;
}) => {
  const [statistiques] =
    api.chantier.recupererStatistiquesAvancement.useSuspenseQuery({
      chantierIds: [chantierId],
      maille,
      jalon,
    });

  if (!statistiques) return null;

  const minimum = formatValeur(statistiques.minimum);
  const mediane = formatValeur(statistiques.médiane);
  const maximum = formatValeur(statistiques.maximum);
  const libelle = libelleMaille(maille);

  return (
    <div className="fr-mb-2w">
      <div className="fr-grid-row fr-grid-row--gutters">
        {minimum !== null && (
          <div className="fr-col-6">
            <div
              className="fr-text--sm fr-mb-0"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "1rem",
                  height: "1rem",
                  backgroundColor: COULEUR_MINIMUM,
                  borderRadius: "2px",
                  flexShrink: 0,
                }}
              />
              <span>
                <strong>{minimum}</strong> — minimum des {libelle}
              </span>
            </div>
          </div>
        )}
        {mediane !== null && (
          <div className="fr-col-6">
            <div
              className="fr-text--sm fr-mb-0"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "1rem",
                  height: "1rem",
                  backgroundColor: COULEUR_MÉDIANE,
                  borderRadius: "2px",
                  flexShrink: 0,
                }}
              />
              <span>
                <strong>{mediane}</strong> — médiane des {libelle}
              </span>
            </div>
          </div>
        )}
      </div>
      {maximum !== null && (
        <div className="fr-grid-row fr-grid-row--center fr-mt-1w">
          <div className="fr-col-6">
            <div
              className="fr-text--sm fr-mb-0"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "1rem",
                  height: "1rem",
                  backgroundColor: COULEUR_MAXIMUM,
                  borderRadius: "2px",
                  flexShrink: 0,
                }}
              />
              <span>
                <strong>{maximum}</strong> — maximum des {libelle}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
