import { FunctionComponent } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";
import BarreDeProgression from "@/components/_commons/BarreDeProgression/BarreDeProgression";
import { PictoBaromètre } from "@/components/_commons/PictoBaromètre/PictoBaromètre";
import { DétailsIndicateurs } from "@/shared/indicateur/DetailsIndicateur.interface";
import { Indicateur } from "@/shared/indicateur/Indicateur.interface";
import { IndicateurTendance } from "@/components/_commons/IndicateurTendance/IndicateurTendance";
import { IndicateurPonderation } from "@/components/_commons/IndicateursChantier/Bloc/Pondération/IndicateurPonderation";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";
import { Table } from "@/components/shared/Table";
import { estLargeurDÉcranActuelleMoinsLargeQue } from "@/stores/useLargeurDÉcranStore/useLargeurDÉcranStore";
import { formaterDate } from "@/client/utils/date/date";
import { TableauValeursIndicateur } from "@/components/_commons/IndicateursChantier/Bloc/TableauValeursIndicateur";
import { IndicateurDétailsParTerritoire } from "./IndicateurBloc.interface";
import ValeurEtDate from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/ValeurEtDate";

const CELLULE = "py-0 md:py-2 px-1 md:px-1 min-[992px]:px-4";

interface IndicateurBlocProps {
  indicateur: Indicateur;
  détailsIndicateurs: DétailsIndicateurs;
  territoireCode: string;
  jalon: number;
}

const IndicateurBloc: FunctionComponent<IndicateurBlocProps> = ({
  indicateur,
  détailsIndicateurs,
  territoireCode,
  jalon,
}) => {
  const { récupérerDétailsSurUnTerritoire } = useTerritoireHabilitation();

  const détailsIndicateur = détailsIndicateurs[indicateur.id];
  const territoireSélectionné = récupérerDétailsSurUnTerritoire(territoireCode);
  const estVueTuile = estLargeurDÉcranActuelleMoinsLargeQue("sm");
  const ligne: IndicateurDétailsParTerritoire = {
    territoireNom: territoireSélectionné.nomAffiché,
    données: détailsIndicateur[territoireSélectionné.code],
  };
  const dateDeMiseAJourIndicateur =
    formaterDate(ligne.données?.dateImport, "DD/MM/YYYY") ?? "Non renseigné";

  return (
    <div
      className="mb-4 last-of-type:mb-0 print:break-inside-avoid"
      key={indicateur.id}
    >
      <Bloc>
        <section>
          <div className="flex justify-between">
            <div>
              <h4 className="fr-text--xl mb-2 flex gap-2 items-center">
                {indicateur.estIndicateurDuBaromètre ? (
                  <PictoBaromètre />
                ) : null}
                {indicateur.nom +
                  (indicateur.unité === null || indicateur.unité === ""
                    ? ""
                    : ` (en ${indicateur.unité?.toLocaleLowerCase()})`)}
              </h4>
              <div className="fr-ml-2w fr-mb-3w">
                <p className="fr-mb-0 fr-text--xs text-dsfr-mention-grey">
                  Dernière mise à jour de la valeur d'avancement pour le
                  territoire :{" "}
                  <span className="fr-text--bold">
                    {dateDeMiseAJourIndicateur}
                  </span>
                </p>
                <IndicateurPonderation
                  indicateurPondération={
                    détailsIndicateur[territoireCode].ponderation ?? null
                  }
                  territoireCode={territoireCode}
                />
                <IndicateurTendance
                  tendance={détailsIndicateur[territoireCode].tendance}
                />
              </div>
            </div>
          </div>
          {estVueTuile ? (
            <TableauValeursIndicateur
              données={ligne.données}
              modeImpression
              territoireNom={ligne.territoireNom}
            />
          ) : (
            <Table.Root
              caption={`Tableau de l'indicateur : ${indicateur.nom}`}
              captionHidden
              containerClassName="m-0 p-0"
            >
              <Table.Header>
                <Table.Row>
                  {[
                    "Territoire(s)",
                    "Valeur initiale",
                    "Valeur actuelle",
                    `Cible ${jalon}`,
                    `Avancement ${jalon}`,
                  ].map((libellé) => (
                    <Table.ColumnHeaderCell
                      className="py-2 md:py-2 px-1 md:px-1 min-[992px]:px-4 max-[49rem]:text-xs"
                      key={libellé}
                    >
                      {libellé}
                    </Table.ColumnHeaderCell>
                  ))}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                <Table.Row>
                  <Table.RowHeaderCell className={CELLULE}>
                    {ligne.territoireNom}
                  </Table.RowHeaderCell>
                  <Table.Cell className={CELLULE}>
                    <ValeurEtDate
                      modeImpression
                      date={ligne.données.dateValeurInitiale}
                      unité={ligne.données.unite}
                      valeur={ligne.données.valeurInitiale}
                    />
                  </Table.Cell>
                  <Table.Cell className={CELLULE}>
                    <ValeurEtDate
                      modeImpression
                      date={ligne.données.dateValeurAvancement}
                      unité={ligne.données.unite}
                      valeur={ligne.données.valeurAvancement}
                    />
                  </Table.Cell>
                  <Table.Cell className={CELLULE}>
                    <ValeurEtDate
                      modeImpression
                      date={ligne.données.dateValeurCibleAnnuelle}
                      unité={ligne.données.unite}
                      valeur={ligne.données.valeurCibleAnnuelle}
                    />
                  </Table.Cell>
                  <Table.Cell className={CELLULE}>
                    <BarreDeProgression
                      afficherTexte
                      fond="gris-clair"
                      positionTexte="dessus"
                      taille="md"
                      valeur={ligne.données.avancement.annuel}
                      variante="secondaire"
                    />
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table.Root>
          )}
        </section>
      </Bloc>
    </div>
  );
};

export default IndicateurBloc;
