import { FunctionComponent } from "react";
import { ChantierFicheTerritorialeContrat } from "@/server/fiche-territoriale/app/contrats/ChantierFicheTerritorialeContrat";
import { MeteoPicto } from "@/components/_commons/Meteo/Picto/MeteoPicto";
import "@gouvfr/dsfr/dist/component/badge/badge.min.css";
import { IconeMinistere } from "@/client/utils/mapperIconeMinistereVersIcone";

const classBadge = (
  tauxAvancement: number,
  tauxAvancementNational: number | null,
) => {
  return tauxAvancementNational === null
    ? ""
    : tauxAvancement >= tauxAvancementNational
      ? "fr-badge--success"
      : tauxAvancement >= tauxAvancementNational - 10
        ? "fr-badge--warning"
        : "fr-badge--error";
};

export const TableauFicheTerritoriale: FunctionComponent<{
  chantiersFicheTerritoriale: ChantierFicheTerritorialeContrat[];
  jalon: number;
}> = ({ chantiersFicheTerritoriale, jalon }) => {
  return (
    <div className="fr-container--fluid fr-mt-2v [&_div.fr-grid-row:first-of-type]:border-b-2 [&_div.fr-grid-row:first-of-type]:border-b-black [&_div.fr-grid-row:first-of-type]:rounded-tl-lg [&_div.fr-grid-row:first-of-type]:rounded-tr-lg">
      <div className="fr-grid-row fr-p-2w fr-background-action-low--blue-france print:!py-2 print:!px-2 print:[&>div]:!text-[0.6rem] print:[&_.fiche-territoriale--contenu]:!text-[0.6rem]">
        <div className="fr-col-8 fr-text--bold fr-px-4w">
          Chantiers publiés au baromètre de l'action publique et leurs
          indicateurs
        </div>
        <div className="fr-col-2 fr-text--bold">Météo</div>
        <div className="fr-col-2 fr-text--bold">Avancement global</div>
      </div>
      {chantiersFicheTerritoriale.map((chantierFicheTerritoriale, index) => {
        return (
          <>
            <div
              className="fr-grid-row fr-px-2w fr-py-1w fr-background-alt--grey print:!py-0"
              key={`chantier-fiche-territoriale-${index}`}
            >
              <div className="fr-col-8 fr-text--bold flex align-center fr-p-1v">
                <div className="pr-2">
                  <IconeMinistere
                    className="text-dsfr-blue-france-sun-113"
                    icone={chantierFicheTerritoriale.ministereIcone}
                  />
                </div>
                <span className="fiche-territoriale--contenu">
                  {chantierFicheTerritoriale.nom}
                </span>
              </div>
              <div className="fr-col-2 flex !text-[0.8rem] leading-4 print:!text-[0.6rem] flex-column justify-center">
                {chantierFicheTerritoriale.meteo !== "NON_RENSEIGNEE" ? (
                  <MeteoPicto meteo={chantierFicheTerritoriale.meteo} />
                ) : (
                  <span className="fr-m-0 fr-text-mention--grey">
                    Non renseignée
                  </span>
                )}
                <span className="fr-m-0 fr-text-mention--grey">
                  {chantierFicheTerritoriale.dateQualitative}
                </span>
              </div>
              <div className="fr-col-2 flex !text-[0.8rem] leading-4 print:!text-[0.6rem] flex-column justify-center">
                {chantierFicheTerritoriale.tauxAvancement !== null ? (
                  <p className="fr-text--bold fr-text--xl fr-text-title--blue-france fr-my-0">
                    {`${chantierFicheTerritoriale.tauxAvancement.toFixed(0)}%`}
                  </p>
                ) : (
                  <span className="fr-m-0 fr-text-mention--grey">
                    Paramètre(s) de calcul manquant(s)
                  </span>
                )}
              </div>
            </div>
            <div
              className="fr-grid-row fr-pt-1w print:!py-0 print:!m-0 print:[&_span]:max-h-4 fr-px-2w"
              key={`indicateur-fiche-territoriale-${index}`}
            >
              <div className="fr-col-4 flex align-center fr-p-0 fr-m-0" />
              <div className="fr-col-2 flex flex-column fr-p-0">
                <span className="!text-[0.8rem] leading-4 print:!text-[0.6rem] fr-text-mention--grey">
                  Dernière valeur
                </span>
                <span className="!text-[0.8rem] leading-4 print:!text-[0.6rem] fr-text-mention--grey">
                  {chantierFicheTerritoriale.dateQuantitative}
                </span>
              </div>
              <div className="fr-col-2 fr-text--bold flex flex-column  fr-p-0 fr-m-0">
                <span className="!text-[0.8rem] leading-4 print:!text-[0.6rem] fr-m-0 fr-text-mention--grey">
                  {`Cible ${jalon}`}
                </span>
              </div>
              <div className="fr-col-2 fr-text--bold flex flex-column fr-p-0 fr-m-0">
                <span className="!text-[0.8rem] leading-4 print:!text-[0.6rem] fr-m-0 fr-text-mention--grey">
                  {`Avancement ${jalon}`}
                </span>
              </div>
              <div className="fr-col-2 fr-text--bold flex flex-column fr-p-0 fr-m-0">
                <span className="!text-[0.8rem] leading-4 print:!text-[0.6rem] fr-m-0 fr-text-mention--grey">
                  Avancement national
                </span>
              </div>
            </div>
            {chantierFicheTerritoriale.indicateurs.map(
              (indicateur, indexFicheTerritoriale) => {
                return (
                  <div
                    className="fr-grid-row not-first:border-t not-first:border-t-dsfr-grey-1000 fr-px-2w fr-py-1w"
                    key={`indicateur-fiche-territoriale-${index}-${indexFicheTerritoriale}`}
                  >
                    <div className="fr-col-4 flex align-center fr-pr-1v">
                      <span className="fr-text--xs fr-m-0">
                        {indicateur.nom}
                      </span>
                    </div>
                    <div className="fr-col-2 flex flex-column justify-center">
                      {indicateur.valeurAvancement !== null ? (
                        <span className="fr-text--xs fr-m-0">
                          {`${indicateur.valeurAvancement.toFixed(0)}${indicateur.uniteMesure?.toLocaleLowerCase() === "pourcentage" ? "%" : ""}`}
                        </span>
                      ) : (
                        <span className="!text-[0.8rem] leading-4 print:!text-[0.6rem]">
                          Aucune valeur saisie
                        </span>
                      )}
                    </div>
                    <div className="fr-col-2 flex flex-column justify-center">
                      {indicateur.valeurCible !== null ? (
                        <span className="fr-text--xs fr-m-0">
                          {`${indicateur.valeurCible.toFixed(0)}${indicateur.uniteMesure?.toLocaleLowerCase() === "pourcentage" ? "%" : ""}`}
                        </span>
                      ) : (
                        <span className="!text-[0.8rem] leading-4 print:!text-[0.6rem]">
                          Aucune cible définie
                        </span>
                      )}
                    </div>
                    <div className="fr-col-2 flex flex-column justify-center">
                      {indicateur.tauxAvancement !== null ? (
                        <span
                          className={`fr-text--xs fr-m-0 fr-badge fr-badge--no-icon ${classBadge(indicateur.tauxAvancement, indicateur.tauxAvancementNational)}`}
                        >
                          {`${indicateur.tauxAvancement.toFixed(0)}%`}
                        </span>
                      ) : (
                        <span className="!text-[0.8rem] leading-4 print:!text-[0.6rem]">
                          Paramètre(s) de calcul manquant(s)
                        </span>
                      )}
                    </div>
                    <div className="fr-col-2 flex flex-column justify-center">
                      {indicateur.tauxAvancementNational !== null ? (
                        <span className="fr-text--xs fr-m-0">
                          {`${indicateur.tauxAvancementNational.toFixed(0)}%`}
                        </span>
                      ) : (
                        <span className="!text-[0.8rem] leading-4 print:!text-[0.6rem]">
                          Paramètre(s) de calcul manquant(s)
                        </span>
                      )}
                    </div>
                  </div>
                );
              },
            )}
          </>
        );
      })}
    </div>
  );
};
