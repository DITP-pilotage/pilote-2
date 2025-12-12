import { useState } from "react";
import { IconeMinistere } from "@/client/utils/mapperIconeMinistereVersIcone";
import BarreDeProgression from "@/client/components/_commons/BarreDeProgression/BarreDeProgression";
import { Icone } from "@/client/components/_commons/Icone";
import { ArrowSLine1Icon } from "@/client/components/_commons/Icones/ArrowSLine1Icon";
import { ArrowSLine2Icon } from "@/client/components/_commons/Icones/ArrowSLine2Icon";
import { pageNoteCollective } from "@/components/Evaluation/PageNoteCollectiveServerSideContext";

export const TableauNoteCollective = () => {
  const { chantiersEvaluation, rattachementCode, baseUrl } =
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

  return (
    <div>
      <header className="pb-4">
        <span className="text-xl font-bold">
          Détail des chantiers et objectifs collectifs de votre territoire
        </span>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-dsfr-blue-france-925 !border-b-2 !border-dsfr-grey-200 text-left text-sm font-bold text-dsfr-gray-500 tracking-wider">
            <tr>
              <th className="px-6 py-3">Chantier</th>
              <th className="px-4 py-3 w-35">Note / 100</th>
              <th className="w-24" />
            </tr>
          </thead>
          <tbody className="!divide-y !divide-dsfr-grey-925">
            {chantiersEvaluation.length === 0 ? (
              <tr>
                <td className="px-6 py-4 text-center text-gray-500" colSpan={3}>
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
                      className={`${bgColor} hover:opacity-80 cursor-pointer whitespace-nowrap text-sm !text-dsfr-grey-50`}
                      key={chantier.id}
                      onClick={() => toggleChantier(chantier.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleChantier(chantier.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <td className="px-6 py-4 whitespace-normal">
                        <div className="flex items-center gap-3">
                          <IconeMinistere
                            className="text-dsfr-blue-france-sun-113 flex-shrink-0"
                            icone={chantier.iconeMinistere}
                          />
                          <a
                            className="!text-primary whitespace-nowrap flex-shrink-0"
                            href={`${baseUrl}/chantier/${chantier.id}/${rattachementCode}`}
                          >
                            {chantier.id}
                          </a>
                          <span>- {chantier.nom}</span>
                        </div>
                      </td>
                      <td>
                        <BarreDeProgression
                          afficherTexte
                          fond="blanc"
                          taille="sm"
                          valeur={chantier.tauxAvancement}
                          variante="primaire"
                        />
                      </td>
                      <td className="px-6 py-4 flex justify-end">
                        <Icone
                          className="w-5 h-5"
                          icone={isExpanded ? ArrowSLine2Icon : ArrowSLine1Icon}
                        />
                      </td>
                    </tr>

                    {isExpanded ? (
                      hasIndicateurs ? (
                        chantier.indicateurs.map((indicateur) => (
                          <tr key={indicateur.id}>
                            <td className="px-6 py-3 text-sm !text-dsfr-grey-50 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <a
                                  className="ml-9 !text-primary whitespace-nowrap flex-shrink-0"
                                  href={`${baseUrl}/chantier/${chantier.id}/${rattachementCode}`}
                                >
                                  {indicateur.id}
                                </a>
                                <span>- {indicateur.nom}</span>
                              </div>
                            </td>
                            <td>
                              <BarreDeProgression
                                afficherTexte
                                fond="gris-clair"
                                taille="sm"
                                valeur={indicateur.tauxAvancement}
                                variante="secondaire"
                              />
                            </td>
                            <td className="px-6 py-3 text-right">
                              <div className="text-[10px]/[12px] italic !text-dsfr-mention-grey">
                                <div>poids :</div>
                                <div>{Math.round(indicateur.ponderation)}%</div>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            className="px-6 py-3 text-center text-sm !text-dsfr-grey-50 italic"
                            colSpan={3}
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
