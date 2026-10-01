import "@gouvfr/dsfr/dist/component/badge/badge.min.css";
import Link from "next/link";
import { FunctionComponent, useState } from "react";
import { usePrintPageStyle } from "@/client/hooks/usePrintPageStyle";
import Titre from "@/components/_commons/Titre/Titre";
import { RapportDétailléVueDEnsemble } from "@/components/PageRapportDétaillé/VueDEnsemble/RapportDétailléVueDEnsemble";
import { RapportDétailléChantier } from "@/components/PageRapportDétaillé/Chantier/RapportDétailléChantier";
import PremièrePageImpressionRapportDétaillé from "@/components/PageRapportDétaillé/PremièrePageImpression/PremièrePageImpressionRapportDétaillé";
import Interrupteur from "@/components/_commons/Interrupteur/Interrupteur";
import { getQueryParamString } from "@/client/utils/getQueryParamString";
import {
  ChantierDetail,
  SerializedVueDEnsemble,
} from "@/server/rapport-detaille/rapportDetaille.interface";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { getFiltresActifs } from "@/client/stores/useFiltresStore/useFiltresStore";
import { ArrowGoBackIcon } from "@/components/_commons/Icones/ArrowGoBackIcon";
import { Icone } from "@/components/_commons/Icone";
import { Printer1Icon } from "@/components/_commons/Icones/Printer1Icon";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";
import FiltresSélectionnés from "./FiltresSélectionnés/FiltresSélectionnés";

interface PageRapportDétailléProps {
  vueDEnsemble: SerializedVueDEnsemble;
  details: ChantierDetail[];
  mailleSelectionnee: MailleInterne;
  territoireCode: string;
  jalon: number;
}

export const htmlId = {
  listeDesChantiers: () => "liste-des-chantiers",
  chantier: (chantierId: string) => `chantier-${chantierId}`,
};

export const PageRapportDétaillé: FunctionComponent<
  PageRapportDétailléProps
> = ({ vueDEnsemble, details, mailleSelectionnee, territoireCode, jalon }) => {
  const {
    chantiers: chantiersFiltrés,
    ministères,
    axes,
    filtresComptesCalculés,
    avancementsAgrégés,
    avancementsGlobauxTerritoriauxMoyens,
    repartitionMeteosChantiers,
    estAutoriseAVoirLesBrouillons,
    chantiersSontArchives,
    moyenneTauxAvancementTerritoire,
  } = vueDEnsemble;
  const detailsByChantier = new Map(
    details.map((detail) => [detail.chantierId, detail]),
  );
  usePrintPageStyle("margin: 12mm 0; size: 280mm 396mm");
  const { récupérerDétailsSurUnTerritoire } = useTerritoireHabilitation();
  const territoireSélectionné = récupérerDétailsSurUnTerritoire(territoireCode);
  const [afficherLesChantiers, setAfficherLesChantiers] = useState(false);

  const queryParamString = getQueryParamString({
    ...getFiltresActifs(),
    jalon,
  });

  const hrefBoutonRetour = `/accueil/chantier/${territoireCode}${queryParamString.length > 0 ? `?${queryParamString}` : ""}`;

  return (
    <>
      <PremièrePageImpressionRapportDétaillé
        axes={axes}
        estAutoriseAVoirLesBrouillons={estAutoriseAVoirLesBrouillons}
        ministères={ministères}
        territoireSélectionné={territoireSélectionné}
      />
      <div className="[&_h2]:text-primary print:m-[12mm] print:[&_table]:overflow-hidden print:[&_table_td]:bg-white">
        <main className="py-8 overflow-x-hidden print:p-0">
          <div className="fr-container fr-mb-0 fr-px-0 fr-px-md-2w">
            <div className="fr-px-2w fr-px-md-0 flex justify-between print:hidden">
              <Titre baliseHtml="h1" className="fr-h2">
                {`Rapport détaillé : ${chantiersFiltrés.length} ${chantiersFiltrés.length > 1 ? "chantiers" : "chantier"}`}
              </Titre>
              <div>
                <Link
                  className="fr-btn gap-2 fr-btn--tertiary-no-outline fr-text--sm"
                  href={hrefBoutonRetour}
                  title="Revenir à l'accueil"
                >
                  <Icone className="w-4 h-4" icone={ArrowGoBackIcon} />
                  Revenir à l'accueil
                </Link>
                <button
                  className="fr-btn gap-2 fr-btn--tertiary-no-outline fr-text--sm"
                  onClick={() => window.print()}
                  type="button"
                >
                  <Icone className="w-4 h-4" icone={Printer1Icon} />
                  Imprimer
                </button>
              </div>
            </div>
            <FiltresSélectionnés
              axes={axes}
              estAutoriseAVoirLesBrouillons={estAutoriseAVoirLesBrouillons}
              ministères={ministères}
              territoireSélectionné={territoireSélectionné}
            />
            <div className="fr-mb-3w print:hidden">
              <Interrupteur
                checked={afficherLesChantiers}
                libellé="Afficher le détail des chantiers"
                onChange={setAfficherLesChantiers}
              />
            </div>
            <RapportDétailléVueDEnsemble
              avancementsAgrégés={avancementsAgrégés}
              avancementsGlobauxTerritoriauxMoyens={
                avancementsGlobauxTerritoriauxMoyens
              }
              chantiers={chantiersFiltrés}
              chantiersSontArchives={chantiersSontArchives}
              filtresComptesCalculés={filtresComptesCalculés}
              jalon={jalon}
              mailleSelectionnee={mailleSelectionnee}
              repartitionMeteosChantiers={repartitionMeteosChantiers}
              territoireCode={territoireCode}
              moyenneTauxAvancementTerritoire={moyenneTauxAvancementTerritoire}
            />
            {afficherLesChantiers ? (
              <div className="chantiers">
                {chantiersFiltrés.map((chantier) => {
                  const detail = detailsByChantier.get(chantier.id);
                  return detail ? (
                    <RapportDétailléChantier
                      chantier={chantier}
                      detail={detail}
                      jalon={jalon}
                      key={chantier.id}
                      mailleSelectionnee={mailleSelectionnee}
                      territoireCode={territoireCode}
                      territoireSélectionné={territoireSélectionné}
                    />
                  ) : null;
                })}
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </>
  );
};
