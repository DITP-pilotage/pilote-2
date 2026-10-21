import { FunctionComponent } from "react";
import { usePrintPageStyle } from "@/client/hooks/usePrintPageStyle";
import { FicheConducteurContrat } from "@/server/fiche-conducteur/app/contrats/FicheConducteurContrat";
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
      <main className="pb-4">
        <div className="w-full mx-auto px-4 lg:px-6 xl:max-w-[78rem] pb-2">
          <EnteteFicheConducteur titleBandClassName="p-2">
            {`${chantier.nom} - Principaux résultats`}
          </EnteteFicheConducteur>
        </div>
        <div className="w-full mx-auto px-4 lg:px-6 xl:max-w-[78rem]">
          <div className="flex flex-wrap -m-2 lg:-m-3">
            <div className="pl-2 py-2 lg:pl-3 lg:py-3 w-1/3 shrink-0 flex flex-col pr-1">
              <h2 className="text-h5 md:text-h5-md mb-2 text-dsfr-blue-france-sun-113 h-full">
                Responsables & État d'avancement
              </h2>
              <Bloc
                className="h-full print:p-0 print:border-dsfr-grey-925"
                contenuClassesSupplémentaires="px-2 py-1"
              >
                <div className="flex flex-wrap text-xs border-b pb-1 m-0 print:text-[10px] print:leading-4">
                  <span className="w-1/6 shrink-0 font-bold">DAC</span>
                  <span className="w-2/3 max-w-2/3 shrink-0 grow-0 basis-2/3">
                    {chantier.directeursAdministrationCentrale}
                  </span>
                </div>
                <div className="flex flex-wrap text-xs border-b py-1 m-0 print:text-[10px] print:leading-4">
                  <span className="w-1/6 shrink-0 font-bold">DP</span>
                  <span className="w-2/3 max-w-2/3 shrink-0 grow-0 basis-2/3">
                    {chantier.directeursProjet}
                  </span>
                </div>
                <div className="flex flex-wrap py-2">
                  <div className="w-5/12 shrink-0 flex justify-center items-end">
                    <JaugeDeProgression
                      couleur="bleu"
                      libellé={`Taux d'avancement à échéance ${jalon}`}
                      pourcentage={avancement.annuel}
                      taille="md"
                    />
                  </div>
                  <div className="flex flex-wrap md:-m-2 lg:-m-3 w-7/12 shrink-0">
                    <div className="md:p-2 lg:p-3 w-1/3 shrink-0 flex justify-center items-end">
                      <JaugeDeProgression
                        couleur="orange"
                        libellé="Minimum"
                        pourcentage={avancement.minimum}
                        taille="sm"
                      />
                    </div>
                    <div className="md:p-2 lg:p-3 w-1/3 shrink-0 flex justify-center items-end">
                      <JaugeDeProgression
                        couleur="violet"
                        libellé="Médiane"
                        pourcentage={avancement.mediane}
                        taille="sm"
                      />
                    </div>
                    <div className="md:p-2 lg:p-3 w-1/3 shrink-0 flex justify-center items-end">
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
            <div className="w-2/3 max-w-2/3 shrink-0 grow-0 basis-2/3 py-2 pr-2 pl-1 lg:py-3 lg:pr-3 flex flex-col">
              <h2 className="text-h5 md:text-h5-md mb-2 text-dsfr-blue-france-sun-113 h-full">
                Météo et synthèse des résultats
              </h2>
              <Bloc
                className="p-4 h-full print:p-0 print:border-dsfr-grey-925"
                contenuClassesSupplémentaires="flex gap-2"
              >
                <div className="flex flex-col gap-2 items-center">
                  <MétéoBadge
                    météo={synthèseDesRésultats.meteo || "NON_RENSEIGNEE"}
                  />
                  <MeteoPicto
                    meteo={synthèseDesRésultats.meteo || "NON_RENSEIGNEE"}
                  />
                </div>
                <div>
                  {commentaire ? (
                    <div className="m-[var(--text-spacing)] text-xs mb-2 print:text-[10px] print:leading-4">
                      <RenduContenuHtml
                        className="[&_p]:text-xs [&_p]:mb-1 print:[&_p]:text-[10px] print:[&_p]:leading-4"
                        html={commentaire}
                      />
                    </div>
                  ) : (
                    <p className="text-xs print:text-[10px] print:leading-4">
                      Aucune synthèse des résultats
                    </p>
                  )}
                </div>
              </Bloc>
            </div>
          </div>
        </div>
        <div className="w-full mx-auto px-4 lg:px-6 xl:max-w-[78rem] mt-2">
          <Bloc
            className="print:p-0 print:border-dsfr-grey-925"
            contenuClassesSupplémentaires="px-0 py-0"
          >
            <div className="w-full xl:max-w-[78rem] text-xs m-0 px-0 print:text-[10px] print:leading-4">
              <div className="flex flex-wrap bg-dsfr-blue-france-925 px-2 py-2 border-b rounded-tl-md rounded-tr-md">
                <div className="w-5/12 shrink-0 font-bold">
                  Avancement des indicateurs d'impact pris en compte dans le TA
                </div>
                <div className="flex flex-wrap w-7/12 shrink-0">
                  <div className="w-1/4 shrink-0 font-bold flex items-center whitespace-nowrap">
                    {`V.Initiale ${chantier.derniereValeurInitiale}`}
                  </div>
                  <div className="w-1/4 shrink-0 font-bold flex items-center">
                    V. Actuelle
                  </div>
                  <div className="w-1/4 shrink-0 font-bold flex items-center">
                    {`Cible ${jalon}`}
                  </div>
                  <div className="w-1/4 shrink-0 font-bold flex items-center">
                    {`TA ${jalon}`}
                  </div>
                </div>
              </div>
              {chantier.indicateurs.map((indicateur, index) => (
                <div
                  className="flex flex-wrap px-2 py-1 border-t"
                  key={`indicateur-${index}`}
                >
                  <div
                    className={`w-5/12 shrink-0 pr-2${indicateur.type === "IMPACT" ? " font-bold" : ""}`}
                  >
                    {indicateur.nom}
                  </div>
                  <div className="flex flex-wrap w-7/12 shrink-0">
                    <div className="w-1/4 shrink-0 flex items-center">
                      {indicateur.valeurInitiale}
                    </div>
                    <div className="w-1/4 shrink-0 flex items-center pr-2">
                      {`${indicateur.valeurAvancement} ${indicateur.dateValeurAvancement}`}
                    </div>
                    <div className="w-1/4 shrink-0 flex items-center">
                      {indicateur.valeurCible}
                    </div>
                    <div className="w-1/4 shrink-0 flex items-center">
                      {indicateur.tauxAvancement}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Bloc>
        </div>
        <div className="break-after-page mb-4" />
        {doitAfficherDonnéesCartographie ? (
          <>
            <div className="w-full mx-auto px-4 lg:px-6 xl:max-w-[78rem] pb-2 hidden print:block">
              <EnteteFicheConducteur titleBandClassName="p-2">
                {`${chantier.nom} - Principaux résultats`}
              </EnteteFicheConducteur>
            </div>
            <div className="w-full mx-auto px-4 lg:px-6 xl:max-w-[78rem]">
              <div className="flex flex-wrap -m-2 lg:-m-3">
                <div className="p-2 lg:p-3 w-1/2 shrink-0">
                  <h2 className="text-h5 md:text-h5-md mb-2 text-dsfr-blue-france-sun-113">
                    {`Taux d'avancement ${jalon}`}
                  </h2>
                  <div>
                    <Bloc className="print:border-none">
                      <CartographieAvancement
                        données={donnéesCartographie.tauxAvancement}
                        jalon={jalon}
                        mailleSelectionnee="departementale"
                        élémentsDeLégende={
                          ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS
                        }
                      />
                    </Bloc>
                  </div>
                </div>
                <div className="p-2 lg:p-3 w-1/2 shrink-0">
                  <h2 className="text-h5 md:text-h5-md mb-2 text-dsfr-blue-france-sun-113">
                    Niveau de confiance
                  </h2>
                  <div>
                    <Bloc className="print:border-none">
                      <CartographieMétéo
                        données={donnéesCartographie.meteo}
                        mailleSelectionnee="departementale"
                        élémentsDeLégende={ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS}
                      />
                    </Bloc>
                  </div>
                </div>
              </div>
            </div>
            <div className="break-after-page mb-4" />
          </>
        ) : null}
        <div className="w-full mx-auto px-4 lg:px-6 xl:max-w-[78rem] pb-2 hidden print:block">
          <EnteteFicheConducteur titleBandClassName="p-2">
            {`${chantier.nom} - Point d'avancement`}
          </EnteteFicheConducteur>
        </div>
        <div className="w-full mx-auto px-4 lg:px-6 xl:max-w-[78rem]">
          <Bloc
            className="print:p-0 print:border-dsfr-grey-925"
            contenuClassesSupplémentaires="px-0"
          >
            <div className="w-full xl:max-w-[78rem] text-xs m-0 px-0 print:text-[10px] print:leading-4">
              <div className="flex flex-wrap bg-dsfr-blue-france-925 px-2 py-2 border-b rounded-tl-md rounded-tr-md">
                <div className="w-1/6 shrink-0 font-bold">Catégorie</div>
                <div className="w-5/6 shrink-0 font-bold">Détail</div>
              </div>
              {publications.map((publication, index) => (
                <div
                  className="flex flex-wrap px-2 py-2 border-t"
                  key={`publication-${index}`}
                >
                  <div className="w-1/6 shrink-0 font-bold flex items-center">
                    {publication.libellé}
                  </div>
                  <div className="w-5/6 shrink-0">
                    <RenduContenuHtml
                      className="[&_p]:text-xs [&_p]:mb-1 print:[&_p]:text-[10px] print:[&_p]:leading-4"
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
