import { Button } from "@/components/shared/Button";
import Link from "next/link";
import { FunctionComponent, memo, useState } from "react";
import { RapportDétailléVueDEnsemble } from "@/components/PageRapportDétaillé/VueDEnsemble/RapportDétailléVueDEnsemble";
import { DeferredRapportDétailléChantier } from "@/components/PageRapportDétaillé/Chantier/DeferredRapportDétailléChantier";
import { DownloadRapportDetaillePdfButton } from "@/components/PageRapportDétaillé/DownloadRapportDetaillePdfButton";
import { useChantierDetailsBatches } from "@/components/PageRapportDétaillé/useChantierDetailsBatches";
import Interrupteur from "@/components/_commons/Interrupteur/Interrupteur";
import { getQueryParamString } from "@/client/utils/getQueryParamString";
import { SerializedVueDEnsemble } from "@/server/rapport-detaille/rapportDetaille.interface";
import { MailleInterne } from "@/shared/maille/Maille.interface";
import { getFiltresActifs } from "@/client/stores/useFiltresStore/useFiltresStore";
import { ArrowGoBackIcon } from "@/components/_commons/Icones/ArrowGoBackIcon";
import { Icone } from "@/components/_commons/Icone";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";
import FiltresSélectionnés from "./FiltresSélectionnés/FiltresSélectionnés";

const MemoizedVueDEnsemble = memo(RapportDétailléVueDEnsemble);
const MemoizedDeferredChantier = memo(DeferredRapportDétailléChantier);

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
        <div className="w-full mx-auto xl:max-w-[78rem] mb-0 px-0 md:px-4">
          <div className="px-4 md:px-0 flex justify-between">
            <h1 className="text-h2 md:text-h2-md">
              {`Rapport détaillé : ${chantiersFiltrés.length} ${chantiersFiltrés.length > 1 ? "chantiers" : "chantier"}`}
            </h1>
            <div>
              <Button
                asChild
                variant="tertiary-no-outline"
                className="gap-2 text-sm"
              >
                <Link href={hrefBoutonRetour} title="Revenir à l'accueil">
                  <Icone className="w-4 h-4" icone={ArrowGoBackIcon} />
                  Revenir à l'accueil
                </Link>
              </Button>
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
          <div className="mb-6">
            <Interrupteur
              checked={afficherLesChantiers}
              libellé="Afficher le détail des chantiers"
              onChange={setAfficherLesChantiers}
            />
          </div>
          <MemoizedVueDEnsemble
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
            <div>
              {chantiersFiltrés.map((chantier) => (
                <MemoizedDeferredChantier
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
