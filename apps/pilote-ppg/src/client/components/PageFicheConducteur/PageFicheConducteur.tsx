import "@gouvfr/dsfr/dist/utility/colors/colors.css";

import { FunctionComponent } from "react";
import { usePrintPageStyle } from "@/client/hooks/usePrintPageStyle";
import { FicheConducteurContrat } from "@/server/fiche-conducteur/app/contrats/FicheConducteurContrat";
import Titre from "@/components/_commons/Titre/Titre";
import Bloc from "@/components/_commons/Bloc/Bloc";
import JaugeDeProgression from "@/components/_commons/JaugeDeProgression/JaugeDeProgression";
import MétéoBadge from "@/components/_commons/Meteo/Badge/MétéoBadge";
import { MeteoPicto } from "@/components/_commons/Meteo/Picto/MeteoPicto";
import { RenduContenuHtml } from "@/components/_commons/EditeurRiche/RenduContenuHtml";
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieAvancement";
import CartographieAvancement from "@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement";
import { ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieMétéo";
import CartographieMétéo from "@/components/_commons/Cartographie/CartographieMétéo/CartographieMétéo";
import { EnteteFicheConducteur } from "@/components/PageFicheConducteur/EnteteFicheConducteur";

const PageFicheConducteur: FunctionComponent<
  FicheConducteurContrat & { jalon: number }
> = ({
  chantier,
  avancement,
  jalon,
  synthèseDesRésultats,
  donnéesCartographie,
  publications,
  doitAfficherDonnéesCartographie,
}) => {
  usePrintPageStyle("margin: 0; size: landscape");

  const commentaire =
    (synthèseDesRésultats.commentaire?.length || 0) > 1000
      ? synthèseDesRésultats.commentaire?.slice(0, 930) +
        "... [commentaire coupé car dépassant les 1000 caractères]"
      : synthèseDesRésultats.commentaire;

  return (
    <div>
      <main className="fr-pb-2w">
        <div className="fr-container fr-pb-1w ">
          <EnteteFicheConducteur classNameEncart="p-2">
            {`${chantier.nom} - Principaux résultats`}
          </EnteteFicheConducteur>
        </div>
        <div className="fr-container">
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-4 flex flex-column fr-pr-1v">
              <Titre
                baliseHtml="h2"
                className="fr-h5 fr-mb-1w fr-text-title--blue-france h-full"
              >
                Responsables & État d'avancement
              </Titre>
              <Bloc
                className="h-full print:p-0 print:border-dsfr-grey-925"
                contenuClassesSupplémentaires="fr-px-1w fr-py-1v"
              >
                <div className="fr-grid-row border-b fr-pb-1v fr-text--xs fr-m-0 print:!text-[10px] print:!leading-4">
                  <span className="fr-col-2 fr-text--bold">DAC</span>
                  <span className="fr-col-8">
                    {chantier.directeursAdministrationCentrale}
                  </span>
                </div>
                <div className="fr-grid-row border-b fr-py-1v fr-text--xs fr-m-0 print:!text-[10px] print:!leading-4">
                  <span className="fr-col-2 fr-text--bold">DP</span>
                  <span className="fr-col-8">{chantier.directeursProjet}</span>
                </div>
                <div className="fr-grid-row fr-py-1w">
                  <div className="fr-col-5 flex justify-center align-end">
                    <JaugeDeProgression
                      couleur="bleu"
                      libellé={`Taux d'avancement à échéance ${jalon}`}
                      pourcentage={avancement.annuel}
                      taille="md"
                    />
                  </div>
                  <div className="fr-col-7 fr-grid-row fr-grid-row-md--gutters">
                    <div className="fr-col-4 flex justify-center align-end">
                      <JaugeDeProgression
                        couleur="orange"
                        libellé="Minimum"
                        pourcentage={avancement.minimum}
                        taille="sm"
                      />
                    </div>
                    <div className="fr-col-4 flex justify-center align-end">
                      <JaugeDeProgression
                        couleur="violet"
                        libellé="Médiane"
                        pourcentage={avancement.mediane}
                        taille="sm"
                      />
                    </div>
                    <div className="fr-col-4 flex justify-center align-end">
                      <JaugeDeProgression
                        couleur="vert"
                        libellé="Maximum"
                        pourcentage={avancement.maximum}
                        taille="sm"
                      />
                    </div>
                  </div>
                </div>
              </Bloc>
            </div>
            <div className="fr-col-8 flex flex-column fr-pl-1v">
              <Titre
                baliseHtml="h2"
                className="fr-h5 fr-mb-1w fr-text-title--blue-france h-full"
              >
                Météo et synthèse des résultats
              </Titre>
              <Bloc
                className="p-4 h-full print:p-0 print:border-dsfr-grey-925"
                contenuClassesSupplémentaires="flex gap-2"
              >
                <div className="flex flex-col gap-2 align-center">
                  <MétéoBadge
                    météo={synthèseDesRésultats.meteo || "NON_RENSEIGNEE"}
                  />
                  <MeteoPicto
                    meteo={synthèseDesRésultats.meteo || "NON_RENSEIGNEE"}
                  />
                </div>
                <div>
                  {commentaire ? (
                    <div className="fr-text--xs fr-mb-1w print:!text-[10px] print:!leading-4">
                      <RenduContenuHtml
                        className="[&_p]:text-xs [&_p]:mb-1 print:[&_p]:!text-[10px] print:[&_p]:!leading-4"
                        html={commentaire}
                      />
                    </div>
                  ) : (
                    <p className="fr-text--xs print:!text-[10px] print:!leading-4">
                      Aucune synthèse des résultats
                    </p>
                  )}
                </div>
              </Bloc>
            </div>
          </div>
        </div>
        <div className="fr-container fr-mt-1w">
          <Bloc
            className="print:p-0 print:border-dsfr-grey-925"
            contenuClassesSupplémentaires="fr-px-0 fr-py-0"
          >
            <div className="fiche-conducteur--tableau fr-container fr-text--xs fr-m-0 fr-px-0 print:!text-[10px] print:!leading-4">
              <div className="fr-grid-row fr-background-action-low--blue-france fr-px-1w fr-py-1w border-b rounded-tl-md rounded-tr-md">
                <div className="fr-col-5 fr-text--bold">
                  Avancement des indicateurs d'impact pris en compte dans le TA
                </div>
                <div className="fr-col-7 fr-grid-row">
                  <div className="fr-col-3 fr-text--bold flex align-center no-wrap">
                    {`V.Initiale ${chantier.derniereValeurInitiale}`}
                  </div>
                  <div className="fr-col-3 fr-text--bold flex align-center">
                    V. Actuelle
                  </div>
                  <div className="fr-col-3 fr-text--bold flex align-center">
                    {`Cible ${jalon}`}
                  </div>
                  <div className="fr-col-3 fr-text--bold flex align-center">
                    {`TA ${jalon}`}
                  </div>
                </div>
              </div>
              {chantier.indicateurs.map((indicateur, index) => (
                <div
                  className="fr-grid-row fr-px-1w fr-py-1v border-t"
                  key={`indicateur-${index}`}
                >
                  <div
                    className={`fr-col-5 fr-pr-1w${indicateur.type === "IMPACT" ? " fr-text--bold" : ""}`}
                  >
                    {indicateur.nom}
                  </div>
                  <div className="fr-col-7 fr-grid-row">
                    <div className="fr-col-3 flex align-center">
                      {indicateur.valeurInitiale}
                    </div>
                    <div className="fr-col-3 flex align-center fr-pr-1w">
                      {`${indicateur.valeurAvancement} ${indicateur.dateValeurAvancement}`}
                    </div>
                    <div className="fr-col-3 flex align-center">
                      {indicateur.valeurCible}
                    </div>
                    <div className="fr-col-3 flex align-center">
                      {indicateur.tauxAvancement}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Bloc>
        </div>
        <div className="page-break fr-mb-2w" />
        {doitAfficherDonnéesCartographie ? (
          <>
            <div className="fr-container fr-pb-1w hidden print:block">
              <EnteteFicheConducteur classNameEncart="p-2">
                {`${chantier.nom} - Principaux résultats`}
              </EnteteFicheConducteur>
            </div>
            <div className="fr-container">
              <div className="fr-grid-row fr-grid-row--gutters">
                <div className="fr-col-6">
                  <Titre
                    baliseHtml="h2"
                    className="fr-h5 fr-mb-1w fr-text-title--blue-france"
                  >
                    {`Taux d'avancement ${jalon}`}
                  </Titre>
                  <div>
                    <Bloc className="print:border-none">
                      <CartographieAvancement
                        auClicTerritoireCallback={() => {}}
                        données={donnéesCartographie.tauxAvancement}
                        jalon={jalon}
                        mailleSelectionnee="departementale"
                        pathname={null}
                        élémentsDeLégende={
                          ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS
                        }
                      />
                    </Bloc>
                  </div>
                </div>
                <div className="fr-col-6">
                  <Titre
                    baliseHtml="h2"
                    className="fr-h5 fr-mb-1w fr-text-title--blue-france"
                  >
                    Niveau de confiance
                  </Titre>
                  <div>
                    <Bloc className="print:border-none">
                      <CartographieMétéo
                        auClicTerritoireCallback={() => {}}
                        données={donnéesCartographie.meteo}
                        mailleSelectionnee="departementale"
                        pathname={null}
                        élémentsDeLégende={ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS}
                      />
                    </Bloc>
                  </div>
                </div>
              </div>
            </div>
            <div className="page-break fr-mb-2w" />
          </>
        ) : null}
        <div className="fr-container fr-pb-1w hidden print:block">
          <EnteteFicheConducteur classNameEncart="p-2">
            {`${chantier.nom} - Point d'avancement`}
          </EnteteFicheConducteur>
        </div>
        <div className="fr-container">
          <Bloc
            className="print:p-0 print:border-dsfr-grey-925"
            contenuClassesSupplémentaires="fr-px-0"
          >
            <div className="fiche-conducteur--tableau fr-container fr-text--xs fr-m-0 fr-px-0 print:!text-[10px] print:!leading-4">
              <div className="fr-grid-row fr-background-action-low--blue-france fr-px-1w fr-py-1w border-b rounded-tl-md rounded-tr-md">
                <div className="fr-col-2 fr-text--bold">Catégorie</div>
                <div className="fr-col-10 fr-text--bold">Détail</div>
              </div>
              {publications.map((publication, index) => (
                <div
                  className="fr-grid-row fr-px-1w fr-py-1w border-t"
                  key={`publication-${index}`}
                >
                  <div className="fr-col-2 fr-text--bold flex align-center">
                    {publication.libellé}
                  </div>
                  <div className="fr-col-10">
                    <RenduContenuHtml
                      className="[&_p]:text-xs [&_p]:mb-1 print:[&_p]:!text-[10px] print:[&_p]:!leading-4"
                      html={publication.valeur}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Bloc>
        </div>
      </main>
    </div>
  );
};

export { PageFicheConducteur };
