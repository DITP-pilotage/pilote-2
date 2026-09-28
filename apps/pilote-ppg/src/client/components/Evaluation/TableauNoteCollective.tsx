import { Fragment, useState } from "react";
import Link from "next/link";
import { IconeMinistere } from "@/client/utils/mapperIconeMinistereVersIcone";
import BarreDeProgression from "@/client/components/_commons/BarreDeProgression/BarreDeProgression";
import { pageNoteCollective } from "@/components/Evaluation/PageNoteCollectiveServerSideContext";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { EyeIcon } from "@/components/_commons/Icones/EyeIcon";
import { EyeOffIcon } from "@/components/_commons/Icones/EyeOffIcon";
import { Table } from "@/components/shared/Table";
import { clsxm } from "@/utils/clsxm";

const CELLULE = "text-[length:inherit] leading-[inherit]";

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

      <Table.Root
        caption={`Objectifs collectifs applicables pour ${nomTerritoire}`}
        captionHidden
        className="min-w-full"
      >
        <Table.Header className="bg-dsfr-blue-france-925 !border-b-2 !border-dsfr-grey-200 text-left text-sm font-bold text-dsfr-gray-500 tracking-wider">
          <Table.Row>
            <Table.ColumnHeaderCell
              className={clsxm(CELLULE, "px-6 py-3 md:px-6 md:py-3 border-b-0")}
            >
              Chantier
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell
              className={clsxm(
                CELLULE,
                "px-4 py-3 md:px-4 md:py-3 w-38 border-b-0",
              )}
            >
              Résultat
            </Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body className="!divide-y !divide-dsfr-grey-925" zebra={false}>
          {chantiersEvaluation.length === 0 ? (
            <Table.Row>
              <Table.Cell
                className={clsxm(
                  CELLULE,
                  "px-6 py-4 md:px-6 md:py-4 text-center text-gray-500",
                )}
                colSpan={2}
              >
                Aucun chantier trouvé
              </Table.Cell>
            </Table.Row>
          ) : (
            chantiersEvaluation.map((chantier, index) => {
              const isExpanded = expandedChantiers.has(chantier.id);
              const hasIndicateurs = chantier.indicateurs.length > 0;
              const bgColor =
                index % 2 === 0
                  ? "bg-dsfr-alt-blue-france"
                  : "bg-dsfr-blue-france-950";

              return (
                <Fragment key={chantier.id}>
                  <Table.Row
                    aria-expanded={isExpanded}
                    className={`${bgColor} whitespace-nowrap text-sm !text-dsfr-grey-50`}
                    tabIndex={0}
                  >
                    <Table.Cell
                      className={clsxm(
                        CELLULE,
                        "px-6 py-4 md:px-6 md:py-4 whitespace-normal",
                      )}
                    >
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
                    </Table.Cell>
                    <Table.Cell
                      className={clsxm(CELLULE, "px-4 py-3 md:px-4 md:py-3")}
                    >
                      <BarreDeProgression
                        afficherTexte
                        fond="blanc"
                        positionTexte="dessus"
                        taille="sm"
                        texteCentre
                        valeur={chantier.tauxAvancement}
                        variante="primaire"
                      />
                    </Table.Cell>
                  </Table.Row>

                  {isExpanded ? (
                    hasIndicateurs ? (
                      chantier.indicateurs.map((indicateur) => (
                        <Table.Row key={indicateur.id}>
                          <Table.Cell
                            className={clsxm(
                              CELLULE,
                              "px-6 py-2 md:px-6 md:py-2 text-sm !text-dsfr-grey-50 whitespace-normal",
                            )}
                          >
                            <div className="ml-9 italic">{indicateur.nom}</div>
                          </Table.Cell>
                          <Table.Cell
                            className={clsxm(
                              CELLULE,
                              "px-4 py-2 md:px-4 md:py-2",
                            )}
                          >
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
                              pondération : {Math.round(indicateur.ponderation)}
                              %
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      ))
                    ) : (
                      <Table.Row>
                        <Table.Cell
                          className={clsxm(
                            CELLULE,
                            "px-6 py-3 md:px-6 md:py-3 text-center text-sm !text-dsfr-grey-50 italic",
                          )}
                          colSpan={2}
                        >
                          Aucun indicateur pour ce chantier
                        </Table.Cell>
                      </Table.Row>
                    )
                  ) : null}
                </Fragment>
              );
            })
          )}
        </Table.Body>
      </Table.Root>
    </div>
  );
};
