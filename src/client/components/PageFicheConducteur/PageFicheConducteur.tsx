import "@gouvfr/dsfr/dist/utility/colors/colors.css";

import { FunctionComponent } from "react";
import { FicheConducteurContrat } from "@/server/fiche-conducteur/app/contrats/FicheConducteurContrat";
import PageFicheConducteurStyled from "@/components/PageFicheConducteur/PageFicheConducteur.styled";
import Titre from "@/components/_commons/Titre/Titre";
import Bloc from "@/components/_commons/Bloc/Bloc";
import JaugeDeProgression from "@/components/_commons/JaugeDeProgression/JaugeDeProgression";
import MétéoBadge from "@/components/_commons/Meteo/Badge/MétéoBadge";
import { MeteoPicto } from "@/components/_commons/Meteo/Picto/MeteoPicto";
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
  const commentaire =
    (synthèseDesRésultats.commentaire?.length || 0) > 1000
      ? synthèseDesRésultats.commentaire?.slice(0, 930) +
        "... [commentaire coupé car dépassant les 1000 caractères]"
      : synthèseDesRésultats.commentaire;

  return (
    <PageFicheConducteurStyled>
      <main className="fr-pb-2w">
        <div className="fr-container fr-pb-1w fiche-conducteur__container">
          <EnteteFicheConducteur>
            {`${chantier.nom} - Principaux résultats`}
          </EnteteFicheConducteur>
        </div>
        <div className="fr-container">
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-4 flex flex-column fiche-conducteur__bloc fiche-conducteur__bloc--border-light fr-pr-1v">
              <Titre
                baliseHtml="h2"
                className="fr-h5 fr-mb-1w fr-text-title--blue-france"
              >
                Responsables & État d'avancement
              </Titre>
              <Bloc contenuClassesSupplémentaires="fr-px-1w fr-py-1v">
                <div className="fr-grid-row border-b fr-pb-1v fr-text--xs fr-m-0">
                  <span className="fr-col-2 fr-text--bold">DAC</span>
                  <span className="fr-col-8">
                    {chantier.directeursAdministrationCentrale}
                  </span>
                </div>
                <div className="fr-grid-row border-b fr-py-1v fr-text--xs fr-m-0">
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
            <div className="fr-col-8 flex flex-column fiche-conducteur__bloc fiche-conducteur__bloc--border-light fr-pl-1v">
              <Titre
                baliseHtml="h2"
                className="fr-h5 fr-mb-1w fr-text-title--blue-france"
              >
                Météo et synthèse des résultats
              </Titre>
              <Bloc className="p-4" contenuClassesSupplémentaires="flex gap-2">
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
                    commentaire
                      ?.split("\n")
                      .map((paragrapheCommentaire, index) => (
                        <p
                          className="fr-text--xs fr-mb-1w"
                          key={`paragraphe-commentaire-${index}`}
                        >
                          {paragrapheCommentaire}
                        </p>
                      ))
                  ) : (
                    <p className="fr-text--xs">Aucune synthèse des résultats</p>
                  )}
                </div>
              </Bloc>
            </div>
          </div>
        </div>
        <div className="fr-container fiche-conducteur__bloc--border-light fr-mt-1w">
          <Bloc contenuClassesSupplémentaires="fr-px-0 fr-py-0">
            <div className="fiche-conducteur--tableau fr-container fr-text--xs fr-m-0 fr-px-0">
              <div className="fr-grid-row fr-background-action-low--blue-france fr-px-1w fr-py-1w border-b grid-row--header">
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
                      {indicateur.objectifValeurCibleIntermediaire}
                    </div>
                    <div className="fr-col-3 flex align-center">
                      {indicateur.objectifTauxAvancementIntermediaire}
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
            <div className="fr-container fr-pb-1w fiche-conducteur__container fiche-conducteur__bloc--no-border only-print">
              <EnteteFicheConducteur>
                {`${chantier.nom} - Principaux résultats`}
              </EnteteFicheConducteur>
            </div>
            <div className="fr-container fiche-conducteur__bloc--no-border">
              <div className="fr-grid-row fr-grid-row--gutters">
                <div className="fr-col-6">
                  <Titre
                    baliseHtml="h2"
                    className="fr-h5 fr-mb-1w fr-text-title--blue-france"
                  >
                    {`Taux d'avancement ${jalon}`}
                  </Titre>
                  <div>
                    <Bloc>
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
                    <Bloc>
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
        <div className="fr-container fr-pb-1w fiche-conducteur__container only-print">
          <EnteteFicheConducteur>
            {`${chantier.nom} - Point d'avancement`}
          </EnteteFicheConducteur>
        </div>
        <div className="fr-container fiche-conducteur__bloc--border-light">
          <Bloc contenuClassesSupplémentaires="fr-px-0">
            <div className="fiche-conducteur--tableau fr-container fr-text--xs fr-m-0 fr-px-0">
              <div className="fr-grid-row fr-background-action-low--blue-france fr-px-1w fr-py-1w border-b grid-row--header">
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
                  <div className="fr-col-10">{publication.valeur}</div>
                </div>
              ))}
            </div>
          </Bloc>
        </div>
      </main>
    </PageFicheConducteurStyled>
  );
};

export { PageFicheConducteur };
