import { FunctionComponent } from "react";
import { Badge } from "@/components/shared/Badge";
import { ChantierFicheTerritorialeContrat } from "@/server/fiche-territoriale/app/contrats/ChantierFicheTerritorialeContrat";
import { MeteoPicto } from "@/components/_commons/Meteo/Picto/MeteoPicto";
import { IconeMinistere } from "@/client/utils/mapperIconeMinistereVersIcone";

const classBadge = (
  tauxAvancement: number,
  tauxAvancementNational: number | null,
) => {
  return tauxAvancementNational === null
    ? "default"
    : tauxAvancement >= tauxAvancementNational
      ? "success"
      : tauxAvancement >= tauxAvancementNational - 10
        ? "warning"
        : "error";
};

export const TableauFicheTerritoriale: FunctionComponent<{
  chantiersFicheTerritoriale: ChantierFicheTerritorialeContrat[];
  jalon: number;
}> = ({ chantiersFicheTerritoriale, jalon }) => {
  return (
    <div className="max-w-none overflow-hidden mt-2">
      <div className="flex flex-wrap print:text-[0.7rem] p-4 fr-background-action-low--blue-france border-b-2 border-b-black rounded-tl-lg rounded-tr-lg print:py-2 print:px-2">
        <div className="w-2/3 shrink-0 font-bold px-8 print:text-[0.6rem]">
          Chantiers publiés au baromètre de l'action publique et leurs
          indicateurs
        </div>
        <div className="w-1/6 shrink-0 font-bold print:text-[0.6rem]">
          Météo
        </div>
        <div className="w-1/6 shrink-0 font-bold print:text-[0.6rem]">
          Avancement global
        </div>
      </div>
      {chantiersFicheTerritoriale.map((chantierFicheTerritoriale, index) => {
        return (
          <>
            <div
              className="flex flex-wrap print:text-[0.7rem] px-4 py-2 fr-background-alt--grey print:py-0"
              key={`chantier-fiche-territoriale-${index}`}
            >
              <div className="w-2/3 shrink-0 font-bold flex items-center p-1">
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
              <div className="w-1/6 shrink-0 flex text-[0.8rem] leading-4 print:text-[0.6rem] flex-col justify-center">
                {chantierFicheTerritoriale.meteo !== "NON_RENSEIGNEE" ? (
                  <MeteoPicto meteo={chantierFicheTerritoriale.meteo} />
                ) : (
                  <span className="m-0 fr-text-mention--grey">
                    Non renseignée
                  </span>
                )}
                <span className="m-0 fr-text-mention--grey">
                  {chantierFicheTerritoriale.dateQualitative}
                </span>
              </div>
              <div className="w-1/6 shrink-0 flex text-[0.8rem] leading-4 print:text-[0.6rem] flex-col justify-center">
                {chantierFicheTerritoriale.tauxAvancement !== null ? (
                  <p className="font-bold text-lead fr-text-title--blue-france my-0">
                    {`${chantierFicheTerritoriale.tauxAvancement.toFixed(0)}%`}
                  </p>
                ) : (
                  <span className="m-0 fr-text-mention--grey">
                    Paramètre(s) de calcul manquant(s)
                  </span>
                )}
              </div>
            </div>
            <div
              className="flex flex-wrap print:text-[0.7rem] pt-2 print:py-0 print:m-0 px-4"
              key={`indicateur-fiche-territoriale-${index}`}
            >
              <div className="w-1/3 shrink-0 flex items-center p-0 m-0" />
              <div className="w-1/6 shrink-0 flex flex-col p-0">
                <span className="text-[0.8rem] leading-4 print:text-[0.6rem] print:max-h-4 fr-text-mention--grey">
                  Dernière valeur
                </span>
                <span className="text-[0.8rem] leading-4 print:text-[0.6rem] print:max-h-4 fr-text-mention--grey">
                  {chantierFicheTerritoriale.dateQuantitative}
                </span>
              </div>
              <div className="w-1/6 shrink-0 font-bold flex flex-col p-0 m-0">
                <span className="text-[0.8rem] leading-4 print:text-[0.6rem] print:max-h-4 m-0 fr-text-mention--grey">
                  {`Cible ${jalon}`}
                </span>
              </div>
              <div className="w-1/6 shrink-0 font-bold flex flex-col p-0 m-0">
                <span className="text-[0.8rem] leading-4 print:text-[0.6rem] print:max-h-4 m-0 fr-text-mention--grey">
                  {`Avancement ${jalon}`}
                </span>
              </div>
              <div className="w-1/6 shrink-0 font-bold flex flex-col p-0 m-0">
                <span className="text-[0.8rem] leading-4 print:text-[0.6rem] print:max-h-4 m-0 fr-text-mention--grey">
                  Avancement national
                </span>
              </div>
            </div>
            {chantierFicheTerritoriale.indicateurs.map(
              (indicateur, indexFicheTerritoriale) => {
                return (
                  <div
                    className="flex flex-wrap print:text-[0.7rem] not-first:border-t not-first:border-t-dsfr-grey-1000 px-4 py-2"
                    key={`indicateur-fiche-territoriale-${index}-${indexFicheTerritoriale}`}
                  >
                    <div className="w-1/3 shrink-0 flex items-center pr-1">
                      <span className="text-xs print:text-base m-0">
                        {indicateur.nom}
                      </span>
                    </div>
                    <div className="w-1/6 shrink-0 flex flex-col justify-center">
                      {indicateur.valeurAvancement !== null ? (
                        <span className="text-xs print:text-base m-0">
                          {`${indicateur.valeurAvancement.toFixed(0)}${indicateur.uniteMesure?.toLocaleLowerCase() === "pourcentage" ? "%" : ""}`}
                        </span>
                      ) : (
                        <span className="text-[0.8rem] leading-4 print:text-[0.6rem]">
                          Aucune valeur saisie
                        </span>
                      )}
                    </div>
                    <div className="w-1/6 shrink-0 flex flex-col justify-center">
                      {indicateur.valeurCible !== null ? (
                        <span className="text-xs print:text-base m-0">
                          {`${indicateur.valeurCible.toFixed(0)}${indicateur.uniteMesure?.toLocaleLowerCase() === "pourcentage" ? "%" : ""}`}
                        </span>
                      ) : (
                        <span className="text-[0.8rem] leading-4 print:text-[0.6rem]">
                          Aucune cible définie
                        </span>
                      )}
                    </div>
                    <div className="w-1/6 shrink-0 flex flex-col justify-center">
                      {indicateur.tauxAvancement !== null ? (
                        <Badge
                          size="sm"
                          variant={classBadge(
                            indicateur.tauxAvancement,
                            indicateur.tauxAvancementNational,
                          )}
                        >
                          {`${indicateur.tauxAvancement.toFixed(0)}%`}
                        </Badge>
                      ) : (
                        <span className="text-[0.8rem] leading-4 print:text-[0.6rem]">
                          Paramètre(s) de calcul manquant(s)
                        </span>
                      )}
                    </div>
                    <div className="w-1/6 shrink-0 flex flex-col justify-center">
                      {indicateur.tauxAvancementNational !== null ? (
                        <span className="text-xs print:text-base m-0">
                          {`${indicateur.tauxAvancementNational.toFixed(0)}%`}
                        </span>
                      ) : (
                        <span className="text-[0.8rem] leading-4 print:text-[0.6rem]">
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
