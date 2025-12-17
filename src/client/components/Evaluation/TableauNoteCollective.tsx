import { useState } from "react";
import Link from "next/link";
import { IconeMinistere } from "@/client/utils/mapperIconeMinistereVersIcone";
import BarreDeProgression from "@/client/components/_commons/BarreDeProgression/BarreDeProgression";
import { pageNoteCollective } from "@/components/Evaluation/PageNoteCollectiveServerSideContext";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { EyeIcon } from "@/components/_commons/Icones/EyeIcon";
import { EyeOffIcon } from "@/components/_commons/Icones/EyeOffIcon";

export const TableauNoteCollective = () => {
  const { chantiersEvaluation, rattachementCode, baseUrl, rattachements } =
    pageNoteCollective.useServerSidePropsContext();
  const [expandedChantiers, setExpandedChantiers] = useState<Set<string>>(
    new Set(),
  );

  const toggleChantier = (chantierId: string) => {
    setExpandedChantiers((prev) => {
      const next = new Set(prev);
      if (next.has(chantierId)) {
        next.delete(chantierId);
      } else {
        next.add(chantierId);
      }
      return next;
    });
  };

  const nomTerritoire = rattachements.find(
    (rattachement) => rattachement.code === rattachementCode,
  )?.libelle;

  return (
    <div>
      <header className="pb-4">
        <span className="text-xl font-bold">
          {`Liste des objectifs collectifs applicables pour : ${nomTerritoire} (${chantiersEvaluation.length})`}
        </span>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-dsfr-blue-france-925 !border-b-2 !border-dsfr-grey-200 text-left text-sm font-bold text-dsfr-gray-500 tracking-wider">
            <tr>
              <th className="px-6 py-3">Chantier</th>
              <th className="px-4 py-3 w-38">Résultat</th>
            </tr>
          </thead>
          <tbody className="!divide-y !divide-dsfr-grey-925">
            {chantiersEvaluation.length === 0 ? (
              <tr>
                <td className="px-6 py-4 text-center text-gray-500" colSpan={2}>
                  Aucun chantier trouvé
                </td>
              </tr>
            ) : (
              chantiersEvaluation.map((chantier, index) => {
                const isExpanded = expandedChantiers.has(chantier.id);
                const hasIndicateurs = chantier.indicateurs.length > 0;
                const bgColor =
                  index % 2 === 0
                    ? "bg-dsfr-alt-blue-france"
                    : "bg-dsfr-blue-france-950";

                return (
                  <>
                    <tr
                      aria-expanded={isExpanded}
                      className={`${bgColor} whitespace-nowrap text-sm !text-dsfr-grey-50`}
                      key={chantier.id}
                      tabIndex={0}
                    >
                      <td className="px-6 py-4 whitespace-normal">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <IconeMinistere
                              className="text-dsfr-blue-france-sun-113 flex-shrink-0"
                              icone={chantier.iconeMinistere}
                            />
                            {chantier.nom}
                          </div>
                          <div className="flex items-center gap-4 ml-9">
                            <Bouton
                              className="!text-xs"
                              iconLeft={
                                <Icone
                                  className="w-4 h-4"
                                  icone={isExpanded ? EyeOffIcon : EyeIcon}
                                />
                              }
                              label={
                                isExpanded
                                  ? "Masquer le détails des indicateurs"
                                  : "Afficher le détail des indicateurs"
                              }
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleChantier(chantier.id);
                              }}
                              variant="link"
                            />
                            <Link
                              className="!text-primary !text-xs"
                              href={`${baseUrl}/chantier/${chantier.id}/${rattachementCode}`}
                              target="_blank"
                            >
                              Voir le détail du chantier
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <BarreDeProgression
                          afficherTexte
                          fond="blanc"
                          positionTexte="dessus"
                          taille="sm"
                          texteCentre
                          valeur={chantier.tauxAvancement}
                          variante="primaire"
                        />
                      </td>
                    </tr>

                    {isExpanded ? (
                      hasIndicateurs ? (
                        chantier.indicateurs.map((indicateur) => (
                          <tr key={indicateur.id}>
                            <td className="px-6 py-2 text-sm !text-dsfr-grey-50 whitespace-normal">
                              <div className="ml-9 italic">
                                {indicateur.nom}
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <BarreDeProgression
                                afficherTexte
                                fond="gris-clair"
                                positionTexte="dessus"
                                taille="sm"
                                texteCentre
                                valeur={indicateur.tauxAvancement}
                                variante="secondaire"
                              />
                              <div className="flex justify-center text-[10px]/[12px] italic !text-dsfr-mention-grey mt-1">
                                pondération :{" "}
                                {Math.round(indicateur.ponderation)}%
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            className="px-6 py-3 text-center text-sm !text-dsfr-grey-50 italic"
                            colSpan={2}
                          >
                            Aucun indicateur pour ce chantier
                          </td>
                        </tr>
                      )
                    ) : null}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
