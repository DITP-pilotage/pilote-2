import "@gouvfr/dsfr/dist/component/badge/badge.min.css";
import Link from "next/link";
import { FunctionComponent, useState } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { RapportDétailléVueDEnsemble } from "@/components/PageRapportDétaillé/VueDEnsemble/RapportDétailléVueDEnsemble";
import { DeferredRapportDétailléChantier } from "@/components/PageRapportDétaillé/Chantier/DeferredRapportDétailléChantier";
import { DownloadRapportDetaillePdfButton } from "@/components/PageRapportDétaillé/DownloadRapportDetaillePdfButton";
import { useChantierDetailsBatches } from "@/components/PageRapportDétaillé/useChantierDetailsBatches";
import Interrupteur from "@/components/_commons/Interrupteur/Interrupteur";
import { getQueryParamString } from "@/client/utils/getQueryParamString";
import { SerializedVueDEnsemble } from "@/server/rapport-detaille/rapportDetaille.interface";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { getFiltresActifs } from "@/client/stores/useFiltresStore/useFiltresStore";
import { ArrowGoBackIcon } from "@/components/_commons/Icones/ArrowGoBackIcon";
import { Icone } from "@/components/_commons/Icone";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";
import FiltresSélectionnés from "./FiltresSélectionnés/FiltresSélectionnés";

interface PageRapportDétailléProps {
  vueDEnsemble: SerializedVueDEnsemble;
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
> = ({ vueDEnsemble, mailleSelectionnee, territoireCode, jalon }) => {
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
  const { récupérerDétailsSurUnTerritoire } = useTerritoireHabilitation();
  const territoireSélectionné = récupérerDétailsSurUnTerritoire(territoireCode);
  const [afficherLesChantiers, setAfficherLesChantiers] = useState(false);
  const { states: chantierDetailStates, request: requestChantierDetail } =
    useChantierDetailsBatches(territoireCode);

  const queryParamString = getQueryParamString({
    ...getFiltresActifs(),
    jalon,
  });

  const hrefBoutonRetour = `/accueil/chantier/${territoireCode}${queryParamString.length > 0 ? `?${queryParamString}` : ""}`;

  return (
    <div className="[&_h2]:text-primary">
      <main className="py-8 overflow-x-hidden">
        <div className="fr-container fr-mb-0 fr-px-0 fr-px-md-2w">
          <div className="fr-px-2w fr-px-md-0 flex justify-between">
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
              <DownloadRapportDetaillePdfButton
                showDetail={afficherLesChantiers}
              />
            </div>
          </div>
          <FiltresSélectionnés
            axes={axes}
            estAutoriseAVoirLesBrouillons={estAutoriseAVoirLesBrouillons}
            ministères={ministères}
            territoireSélectionné={territoireSélectionné}
          />
          <div className="fr-mb-3w">
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
              {chantiersFiltrés.map((chantier) => (
                <DeferredRapportDétailléChantier
                  chantier={chantier}
                  jalon={jalon}
                  key={chantier.id}
                  mailleSelectionnee={mailleSelectionnee}
                  onVisible={requestChantierDetail}
                  state={chantierDetailStates.get(chantier.id)}
                  territoireCode={territoireCode}
                  territoireSélectionné={territoireSélectionné}
                />
              ))}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
};
