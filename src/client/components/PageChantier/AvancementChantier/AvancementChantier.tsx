import { FunctionComponent } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";
import { actionsTerritoiresStore } from "@/stores/useTerritoiresStore/useTerritoiresStore";
import AvancementsTerritoire from "@/components/_commons/AvancementsTerritoire/AvancementsTerritoire";
import JaugeDeProgression from "@/components/_commons/JaugeDeProgression/JaugeDeProgression";
import BarreDeProgression from "@/components/_commons/BarreDeProgression/BarreDeProgression";
import { AvancementsStatistiques } from "@/components/_commons/Avancements/Avancements.interface";
import { Maille, MailleInterne } from "@/server/domain/maille/Maille.interface";
import Alerte from "@/components/_commons/Alerte/Alerte";
import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import { JaugeDeProgressionSmall } from "@/components/_commons/JaugeDeProgressionSmall/JaugeDeProgressionSmall";
import { DonneesComparaisonDuTauxDAvancementType } from "@/server/domain/territoire/Territoire.interface";
import { formaterDate } from "@/client/utils/date/date";
import AvancementChantierStyled from "./AvancementChantier.styled";
import EcartTauxAvancementPPG from "./EcartTauxAvancementPPG/EcartTauxAvancementPPG";
import TendanceTauxAvancementPPG from "./TendanceTauxAvancementPPG/TendanceTauxAvancementPPG";

interface AvancementChantierProps {
  estChantierArchive?: boolean;
  territoireCode: string;
  mailleSelectionnee: MailleInterne;
  jalon: number;
  mailleQuery: MailleInterne;
  avancements: {
    nationale: AvancementsStatistiques;
    departementale: {
      global: {
        moyenne: number | null;
      };
      annuel: {
        moyenne: number | null;
      };
    };
    regionale: {
      global: {
        moyenne: number | null;
      };
      annuel: {
        moyenne: number | null;
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
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const territoireSélectionné = récupérerDétailsSurUnTerritoire(territoireCode);

  const territoireSélectionnéParent = territoireSélectionné.codeParent
    ? récupérerDétailsSurUnTerritoire(territoireSélectionné.codeParent)
    : null;
  const sousTitreTuileAvancementDepartemental =
    "Taux d'avancement départemental";
  const sousTitreTuileAvancementRegional = "Taux d'avancement régional";

  const classeAPartirDeLaMaille: Record<Maille, string> = {
    nationale: "layout--nat",
    departementale: "layout--dept",
    regionale: "layout--reg",
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
    <AvancementChantierStyled
      className={classeAPartirDeLaMaille[territoireSélectionné.maille]}
    >
      {territoireCode !== "NAT-FR" &&
      mailleSelectionnee === "departementale" ? (
        <Bloc
          backgroundClassNameTitre={
            estChantierArchive ? "bg-dsfr-grey-925" : undefined
          }
          titre={territoireSélectionné?.nomAffiché}
        >
          <div className="fr-py-1w jauge">
            <AvancementsTerritoire
              avancementAnnuel={avancements.departementale.annuel.moyenne}
              avancementGlobal={avancements.departementale.global.moyenne}
              couleurBarreDeProgression="secondaire"
              couleurJaugeDeProgression="bleu"
              jalon={jalon}
              territoireNom={territoireSélectionné.nom}
              titreTauxAvancement={sousTitreTuileAvancementDepartemental}
            />
            {mailleSourceDonnees === "regionale" && (
              <Alerte
                classesMessagePolice="fr-text fr-text--xs"
                classesSupplementaires="fr-mt-2w"
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
            estChantierArchive ? "bg-dsfr-grey-925" : undefined
          }
          titre={
            territoireSélectionnéParent
              ? territoireSélectionnéParent.nomAffiché
              : territoireSélectionné.nomAffiché
          }
        >
          <div className="fr-py-1w jauge">
            <AvancementsTerritoire
              avancementAnnuel={avancements.regionale.annuel.moyenne}
              avancementGlobal={avancements.regionale.global.moyenne}
              couleurBarreDeProgression={
                mailleSelectionnee === "regionale"
                  ? "secondaire"
                  : "secondaire-light"
              }
              couleurJaugeDeProgression={
                mailleSelectionnee === "regionale" ? "bleu" : "bleu-clair"
              }
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
          estChantierArchive ? "bg-dsfr-grey-925" : undefined
        }
        titre="France"
      >
        <div className="fr-py-1w jauge">
          <div className="flex flex-direction-column flex-wrap justify-center align-center">
            <strong className="fr-text--sm fr-mb-0 text-center">
              Taux d'avancement national
            </strong>
            <span className="fr-text--sm fr-ml-1v">2026</span>
          </div>
          <JaugeDeProgression
            couleur={territoireCode !== "NAT-FR" ? "bleu-clair" : "bleu"}
            libellé="France"
            pourcentage={
              avancements.nationale
                ? avancements.nationale.global.moyenne
                : null
            }
            taille="lg"
          />
          <div className="fr-mt-2w">
            <p className="fr-text--xl fr-text--bold fr-mb-0 texte-gris">
              {`${(process.env.NEXT_PUBLIC_FF_TA_ANNUEL === "true" ? avancements.nationale?.annuel.moyenne?.toFixed(0) : null) ?? "- "}%`}
            </p>
            <BarreDeProgression
              afficherTexte={false}
              bordure={null}
              fond="gris-clair"
              positionTexte="dessus"
              taille="xxs"
              valeur={
                !!avancements.nationale &&
                process.env.NEXT_PUBLIC_FF_TA_ANNUEL === "true"
                  ? avancements.nationale.annuel.moyenne
                  : null
              }
              variante="secondaire-light"
            />
            <div className="flex align-center justify-center fr-text--xs  w-full relative">
              <p className="fr-text--xs fr-mb-0 fr-mt-1v">
                {`Avancement à échéance${!territoireCode.startsWith("NAT") ? ` ${jalon}` : ""}`}
              </p>
            </div>
          </div>
        </div>
      </Bloc>
      <Bloc
        backgroundClassNameTitre={
          estChantierArchive ? "bg-dsfr-grey-925" : undefined
        }
        className="h-full"
        contenuClassesSupplémentaires="fr-p-2w"
        contenuInfobulle={INFOBULLE_CONTENUS.chantiers.repartitions}
        titre="Répartition territoriale du taux d'avancement 2026"
      >
        <div className="fr-px-md-1w fr-px-lg-2w fr-py-1w">
          {mailleQuery === "regionale" ? (
            <div className="flex flex-direction-column flex-wrap justify-center align-center">
              <strong className="fr-text--sm fr-mb-0 text-center">
                Répartition régionale
              </strong>
              <span className="fr-text--sm fr-ml-1v">2026</span>
            </div>
          ) : (
            <div className="flex flex-direction-column flex-wrap justify-center align-center">
              <strong className="fr-text--sm fr-mb-0 text-center">
                Répartition départementale
              </strong>
              <span className="fr-text--sm fr-ml-1w">2026</span>
            </div>
          )}
          <div className="flex flex-column justify-center">
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
          estChantierArchive ? "bg-dsfr-grey-925" : undefined
        }
        className="h-full"
        contenuClassesSupplémentaires="fr-p-2w"
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
            <div className="fr-py-1w flex flex-direction-column flex-wrap justify-center align-center">
              <div className="flex flex-direction-column flex-wrap justify-center align-center">
                <strong className="fr-text--xs fr-mb-0 text-center">
                  SITUATION PAR RAPPORT AUX AUTRES{" "}
                  {tuileEcartTAAPartirDeLaMaille[
                    territoireSélectionné.maille
                  ].toUpperCase()}{" "}
                </strong>
                <span className="fr-text--sm fr-ml-1v fr-mb-1w">2026</span>
                <EcartTauxAvancementPPG
                  ecart={donneesComparaisonDuTauxDAvancement.ppgEcartMedian}
                />
                <p className="fr-text--xs fr-mt-1w text-center jauge-tracé">
                  <strong className="fr-mr-1v">écart</strong>
                  du taux d'avancement 2026 par rapport au taux médian des
                  autres{" "}
                  {
                    tuileEcartTAAPartirDeLaMaille[territoireSélectionné.maille]
                  }{" "}
                  (
                  {avancements.nationale &&
                  avancements.nationale.global.médiane ? (
                    <strong className="ecart-pourcentage-couleur">
                      {avancements.nationale.global.médiane.toFixed(0) + "%"}
                    </strong>
                  ) : (
                    <strong className="ecart-pourcentage-couleur">
                      Non défini
                    </strong>
                  )}
                  )
                </p>
              </div>
            </div>
            <hr className="fr-hr fr-py-1w" />
          </>
        ) : null}
        <div className="fr-py-1w flex flex-direction-column flex-wrap justify-center align-center">
          <strong className="fr-text--xs fr-mb-0 text-center">
            EVOLUTION TEMPORELLE
          </strong>
          <p className="fr-text--sm fr-ml-1v fr-mb-1w">2026</p>
          <TendanceTauxAvancementPPG
            tendance={donneesComparaisonDuTauxDAvancement.ppgTendanceChantier}
          />
          <div className="fr-text--xs fr-mb-0 fr-mt-1w text-center">
            <strong className="fr-mr-1v">tendance</strong>
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
                <strong className="tendance-pourcentage-couleur">
                  {`${donneesComparaisonDuTauxDAvancement.ppgTauxDAvancementValeurPrecedente.toFixed(0) + "%"}`}
                </strong>
                {", "}
                <p className="fr-text--xs fr-text-mention--grey fr-mb-0 fr-ml-1v">
                  {`${formaterDate(donneesComparaisonDuTauxDAvancement.ppgDateTauxDAvancementValeurPrecedente, "MM/YYYY")}`}
                </p>
                )
              </div>
            ) : (
              <p className="fr-text--xs fr-m-0 bold tendance-pourcentage-couleur">
                (Non défini)
              </p>
            )}
          </div>
        </div>
      </Bloc>
    </AvancementChantierStyled>
  );
};

export default AvancementChantier;
