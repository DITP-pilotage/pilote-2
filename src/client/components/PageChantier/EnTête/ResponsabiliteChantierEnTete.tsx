import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { Icone } from "@/components/_commons/Icone";
import { DraftContourIcon } from "@/components/_commons/Icones/DraftContourIcon";
import { recupererResponsabiliteTerritoriale } from "./responsabiliteAte";

export const ResponsabiliteChantierEnTete = () => {
  const { chantier } = pageChantier.useServerSidePropsContext();

  const estChantierNational =
    chantier.maillesApplicables.length === 1 &&
    chantier.maillesApplicables.includes("nationale");
  const estChantierDepartemental =
    (chantier.maillesApplicables.length === 2 &&
      chantier.maillesApplicables.includes("departementale")) ||
    chantier.maillesApplicables.length === 3;
  const estChantierRegional =
    chantier.maillesApplicables.length === 2 &&
    chantier.maillesApplicables.includes("regionale");

  let listeResponsabiliteTerritoriale = recupererResponsabiliteTerritoriale(
    estChantierRegional,
    estChantierDepartemental,
    chantier.ate,
  );

  if (estChantierNational) {
    return (
      <div className="flex gap-2">
        <div>
          <Icone className="!text-current" icone={DraftContourIcon} />
        </div>
        <div>
          <span className="!mb-0 fr-text--xs">
            Chantier piloté à la{" "}
            <span className="bold">maille nationale uniquement</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div>
        <Icone className="!text-current" icone={DraftContourIcon} />
      </div>
      <div>
        <span className="!mb-0 fr-text--xs">
          Chantier piloté jusqu'à la{" "}
          <span className="bold">
            maille{" "}
            {estChantierRegional
              ? "régionale"
              : estChantierDepartemental
                ? "départementale"
                : null}
          </span>
        </span>
        <div>
          <p className="!mb-0 fr-text--xs bold">Commentaires locaux :</p>
          <ul className="!mb-0 fr-text--xs">
            {listeResponsabiliteTerritoriale.map((responsabilite, index) => (
              <li className="pb-0" key={`responsabilite-${index}`}>
                {responsabilite}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
