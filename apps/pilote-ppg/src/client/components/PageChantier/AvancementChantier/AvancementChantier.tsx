import { FunctionComponent } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";
import AvancementsTerritoire from "@/components/_commons/AvancementsTerritoire/AvancementsTerritoire";
import JaugeDeProgression from "@/components/_commons/JaugeDeProgression/JaugeDeProgression";
import { Maille, MailleInterne } from "@/shared/maille/Maille.interface";
import Alerte from "@/components/_commons/Alerte/Alerte";
import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import { JaugeDeProgressionSmall } from "@/components/_commons/JaugeDeProgressionSmall/JaugeDeProgressionSmall";
import { DonneesComparaisonDuTauxDAvancementType } from "@/shared/territoire/Territoire.interface";
import { formaterDate } from "@/client/utils/date/date";
import { BadgeTendance } from "@/components/PageAccueil/PageChantiers/TableauChantiers/Tendance/BadgeTendance";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";
import { clsxm } from "@/utils/clsxm";
import EcartTauxAvancementPPG from "./EcartTauxAvancementPPG/EcartTauxAvancementPPG";

interface AvancementChantierProps {
  estChantierArchive?: boolean;
  territoireCode: string;
  mailleSelectionnee: MailleInterne;
  jalon: number;
  mailleQuery: MailleInterne;
  avancements: {
    nationale: {
      global: {
        moyenne: number | null;
        médiane: number | null | undefined;
        minimum: number | null | undefined;
        maximum: number | null | undefined;
        date: string | null;
      };
      annuel: {
        moyenne: number | null;
        date: string | null;
      };
    };
    departementale: {
      global: {
        moyenne: number | null;
        date: string | null;
      };
      annuel: {
        moyenne: number | null;
        date: string | null;
      };
    };
    regionale: {
      global: {
        moyenne: number | null;
        date: string | null;
      };
      annuel: {
        moyenne: number | null;
        date: string | null;
      };
    };
  };
  mailleSourceDonnees?: Maille | null;
  donneesComparaisonDuTauxDAvancement: DonneesComparaisonDuTauxDAvancementType;
}

const AvancementChantier: FunctionComponent<AvancementChantierProps> = ({
  estChantierArchive = false,
  avancements,
  territoireCode,
  mailleSelectionnee,
  mailleQuery,
  mailleSourceDonnees,
  jalon,
  donneesComparaisonDuTauxDAvancement,
}) => {
  const { récupérerDétailsSurUnTerritoire } = useTerritoireHabilitation();

  const territoireSélectionné = récupérerDétailsSurUnTerritoire(territoireCode);

  const territoireSélectionnéParent = territoireSélectionné.codeParent
    ? récupérerDétailsSurUnTerritoire(territoireSélectionné.codeParent)
    : null;
  const sousTitreTuileAvancementDepartemental =
    "Taux d'avancement départemental";
  const sousTitreTuileAvancementRegional = "Taux d'avancement régional";

  const classeAPartirDeLaMaille: Record<Maille, string> = {
    nationale:
      "md:[grid-template-areas:'nat'] md:grid-cols-[4fr_4fr] print:[grid-template-areas:'nat'] print:grid-cols-[4fr_4fr]",
    departementale:
      "[grid-template-areas:'dept'_'reg'_'nat'] min-[1025px]:[grid-template-areas:'dept_reg_nat'] min-[1025px]:grid-cols-3 min-[768px]:max-[1024px]:[grid-template-areas:'dept_reg'_'nat_nat'] min-[768px]:max-[1024px]:grid-cols-2 print:[grid-template-areas:'dept_reg_nat'] print:grid-cols-3",
    regionale:
      "md:[grid-template-areas:'reg_nat'] md:grid-cols-2 print:[grid-template-areas:'reg_nat'] print:grid-cols-2",
  };

  const tuileEcartTAAPartirDeLaMaille: Record<string, string> = {
    departementale: " départements ",
    regionale: " régions ",
  };

  const tuileTendanceTAAPartirDeLaMaille: Record<Maille, string> = {
    nationale: "le territoire",
    departementale: "le département",
    regionale: "la région",
  };

  return (
    <div
      className={clsxm(
        "grid [grid-template-areas:'nat'] gap-[0.7rem]",
        classeAPartirDeLaMaille[territoireSélectionné.maille],
      )}
    >
      {territoireCode !== "NAT-FR" &&
      mailleSelectionnee === "departementale" ? (
        <Bloc
          backgroundClassNameTitre={
            estChantierArchive ? "bg-dsfr-grey-925" : "bg-dsfr-blue-france-925"
          }
          titre={territoireSélectionné?.nomAffiché}
        >
          <div className="py-2 [&>div]:m-auto">
            <AvancementsTerritoire
              avancement={avancements.departementale.annuel.moyenne}
              couleurBarreDeProgression="secondary"
              couleurJaugeDeProgression="bleu"
              dateAvancement={avancements.departementale.annuel.date}
              jalon={jalon}
              territoireNom={territoireSélectionné.nom}
              titreTauxAvancement={sousTitreTuileAvancementDepartemental}
            />
            {mailleSourceDonnees === "regionale" && (
              <Alerte
                classesMessagePolice="text-xs print:text-base"
                classesSupplementaires="mt-4"
                message="Données régionales"
                type="info"
              />
            )}
          </div>
        </Bloc>
      ) : null}
      {territoireCode !== "NAT-FR" &&
      (mailleSelectionnee === "regionale" ||
        mailleSelectionnee === "departementale") ? (
        <Bloc
          backgroundClassNameTitre={
            estChantierArchive ? "bg-dsfr-grey-925" : "bg-dsfr-blue-france-925"
          }
          titre={
            territoireSélectionnéParent
              ? territoireSélectionnéParent.nomAffiché
              : territoireSélectionné.nomAffiché
          }
        >
          <div className="py-2 [&>div]:m-auto">
            <AvancementsTerritoire
              avancement={avancements.regionale.annuel.moyenne}
              couleurBarreDeProgression={
                mailleSelectionnee === "regionale"
                  ? "secondary"
                  : "secondary-light"
              }
              couleurJaugeDeProgression={
                mailleSelectionnee === "regionale" ? "bleu" : "bleu-clair"
              }
              dateAvancement={avancements.regionale.annuel.date}
              jalon={jalon}
              territoireNom={
                territoireSélectionnéParent
                  ? territoireSélectionnéParent.nomAffiché
                  : territoireSélectionné.nomAffiché
              }
              titreTauxAvancement={sousTitreTuileAvancementRegional}
            />
          </div>
        </Bloc>
      ) : null}
      <Bloc
        backgroundClassNameTitre={
          estChantierArchive ? "bg-dsfr-grey-925" : "bg-dsfr-blue-france-925"
        }
        titre="France"
      >
        <div className="py-2 [&>div]:m-auto">
          <div className="flex flex-col flex-wrap justify-center items-center">
            <strong className="m-[var(--text-spacing)] text-sm print:text-base mb-0 text-center">
              Taux d'avancement national
            </strong>
            <span className="m-[var(--text-spacing)] text-sm print:text-base ml-1">
              {jalon}
            </span>
          </div>
          <JaugeDeProgression
            couleur={territoireCode !== "NAT-FR" ? "bleu-clair" : "bleu"}
            date={avancements.nationale?.annuel.date ?? null}
            libellé="France"
            pourcentage={
              avancements.nationale
                ? avancements.nationale.annuel.moyenne
                : null
            }
            taille="lg"
          />
        </div>
      </Bloc>
      <Bloc
        backgroundClassNameTitre={
          estChantierArchive ? "bg-dsfr-grey-925" : "bg-dsfr-blue-france-925"
        }
        className="h-full"
        contenuClassesSupplémentaires="p-4"
        contenuInfobulle={INFOBULLE_CONTENUS.chantiers.repartitions}
        titre={`Répartition territoriale du taux d'avancement ${jalon}`}
      >
        <div className="md:px-2 py-2">
          {mailleQuery === "regionale" ? (
            <div className="flex flex-col flex-wrap justify-center items-center">
              <strong className="m-[var(--text-spacing)] text-sm print:text-base mb-0 text-center">
                Répartition régionale
              </strong>
              <span className="m-[var(--text-spacing)] text-sm print:text-base ml-1">
                {jalon}
              </span>
            </div>
          ) : (
            <div className="flex flex-col flex-wrap justify-center items-center">
              <strong className="m-[var(--text-spacing)] text-sm print:text-base mb-0 text-center">
                Répartition départementale
              </strong>
              <span className="m-[var(--text-spacing)] text-sm print:text-base ml-2">
                {jalon}
              </span>
            </div>
          )}
          <div className="flex flex-col justify-center">
            <JaugeDeProgressionSmall
              couleur="vert"
              libellé="Maximum"
              pourcentage={
                avancements.nationale
                  ? avancements.nationale.global.maximum
                  : null
              }
            />
            <JaugeDeProgressionSmall
              couleur="violet"
              libellé="Médiane"
              pourcentage={
                avancements.nationale
                  ? avancements.nationale.global.médiane
                  : null
              }
            />
            <JaugeDeProgressionSmall
              couleur="orange"
              libellé="Minimum"
              pourcentage={
                avancements.nationale
                  ? avancements.nationale.global.minimum
                  : null
              }
            />
          </div>
        </div>
      </Bloc>
      <Bloc
        backgroundClassNameTitre={
          estChantierArchive ? "bg-dsfr-grey-925" : "bg-dsfr-blue-france-925"
        }
        className="h-full"
        contenuClassesSupplémentaires="p-4"
        contenuInfobulle={
          territoireCode !== "NAT-FR"
            ? INFOBULLE_CONTENUS.chantier.avancement
                .comparaisonDeLAvancementRegDep
            : INFOBULLE_CONTENUS.chantier.avancement.comparaisonDeLAvancementNat
        }
        titre="Données de comparaison de l'avancement 2026"
      >
        {territoireCode !== "NAT-FR" ? (
          <>
            <div className="py-2 flex flex-col flex-wrap justify-center items-center">
              <div className="flex flex-col flex-wrap justify-center items-center">
                <strong className="m-[var(--text-spacing)] text-xs print:text-base mb-0 text-center">
                  SITUATION PAR RAPPORT AUX AUTRES{" "}
                  {tuileEcartTAAPartirDeLaMaille[
                    territoireSélectionné.maille
                  ].toUpperCase()}{" "}
                </strong>
                <span className="m-[var(--text-spacing)] text-sm print:text-base ml-1 mb-2">
                  {jalon}
                </span>
                <EcartTauxAvancementPPG
                  ecart={donneesComparaisonDuTauxDAvancement.ppgEcartMedian}
                />
                <p className="text-xs print:text-base mt-2 text-center">
                  <strong className="mr-1">écart</strong>
                  {`du taux d'avancement ${jalon} par rapport au taux médian des
                  autres`}{" "}
                  {tuileEcartTAAPartirDeLaMaille[territoireSélectionné.maille]}{" "}
                  (
                  {avancements.nationale &&
                  avancements.nationale.global.médiane ? (
                    <strong className="text-pilote-ecart-blue">
                      {avancements.nationale.global.médiane.toFixed(0) + "%"}
                    </strong>
                  ) : (
                    <strong className="text-pilote-ecart-blue">
                      Non défini
                    </strong>
                  )}
                  )
                </p>
              </div>
            </div>
            <hr className="py-2" />
          </>
        ) : null}
        <div className="py-2 flex flex-col flex-wrap justify-center items-center">
          <strong className="m-[var(--text-spacing)] text-xs print:text-base mb-0 text-center">
            EVOLUTION TEMPORELLE
          </strong>
          <p className="text-sm print:text-base ml-1 mb-2">2026</p>
          <BadgeTendance
            tendance={donneesComparaisonDuTauxDAvancement.ppgTendanceChantier}
          />
          <div className="m-[var(--text-spacing)] text-xs print:text-base mb-0 mt-2 text-center">
            <strong className="mr-1">tendance</strong>
            du taux d'avancement 2026 par rapport au taux d'avancement
            précédemment mesuré sur{" "}
            {
              tuileTendanceTAAPartirDeLaMaille[territoireSélectionné.maille]
            }{" "}
            {donneesComparaisonDuTauxDAvancement.ppgTauxDAvancementValeurPrecedente !==
              null &&
            donneesComparaisonDuTauxDAvancement.ppgDateTauxDAvancementValeurPrecedente !==
              null ? (
              <div className="flex justify-center">
                ({" "}
                <strong className="text-primary">
                  {`${donneesComparaisonDuTauxDAvancement.ppgTauxDAvancementValeurPrecedente.toFixed(0) + "%"}`}
                </strong>
                {", "}
                <p className="text-xs print:text-base mb-0 ml-1">
                  {`${formaterDate(donneesComparaisonDuTauxDAvancement.ppgDateTauxDAvancementValeurPrecedente, "MM/YYYY")}`}
                </p>
                )
              </div>
            ) : (
              <p className="text-xs print:text-base m-0 font-bold text-primary">
                (Non défini)
              </p>
            )}
          </div>
        </div>
      </Bloc>
    </div>
  );
};

export default AvancementChantier;
