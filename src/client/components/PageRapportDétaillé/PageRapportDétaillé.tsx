import "@gouvfr/dsfr/dist/component/badge/badge.min.css";
import Link from "next/link";
import { FunctionComponent, useState } from "react";
import PageRapportDétailléStyled from "@/components/PageRapportDétaillé/PageRapportDétaillé.styled";
import Titre from "@/components/_commons/Titre/Titre";
import { PublicationsGroupéesParChantier } from "@/components/PageRapportDétaillé/PageRapportDétaillé.interface";
import RapportDétailléVueDEnsemble from "@/components/PageRapportDétaillé/VueDEnsemble/RapportDétailléVueDEnsemble";
import RapportDétailléChantier from "@/components/PageRapportDétaillé/Chantier/RapportDétailléChantier";
import { actionsTerritoiresStore } from "@/stores/useTerritoiresStore/useTerritoiresStore";
import PremièrePageImpressionRapportDétaillé from "@/components/PageRapportDétaillé/PremièrePageImpression/PremièrePageImpressionRapportDétaillé";
import Interrupteur from "@/components/_commons/Interrupteur/Interrupteur";
import { getQueryParamString } from "@/client/utils/getQueryParamString";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import { DétailsIndicateurs } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import {
  AvancementsGlobauxTerritoriauxMoyensContrat,
  AvancementsStatistiquesAccueilContrat,
} from "@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat";
import Axe from "@/server/domain/axe/Axe.interface";
import { AvancementChantierRapportDetaille } from "@/components/PageRapportDétaillé/AvancementChantierRapportDetaille";
import { CartographieDonnéesMétéo } from "@/components/_commons/Cartographie/CartographieMétéo/CartographieMétéo.interface";
import { TypeAlerteChantier } from "@/server/chantiers/app/contrats/TypeAlerteChantier";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { RepartitionMeteoContrat } from "@/server/fiche-territoriale/app/contrats/RepartitionMeteoContrat";
import { getFiltresActifs } from "@/client/stores/useFiltresStoreNew/useFiltresStoreNew";
import { ArrowGoBackIcon } from "@/components/_commons/Icones/ArrowGoBackIcon";
import { Icone } from "@/components/_commons/Icone";
import { Printer1Icon } from "@/components/_commons/Icones/Printer1Icon";
import { ChantierRapportDetailleContrat } from "@/server/chantiers/app/contrats/ChantierRapportDetailleContratV2";
import FiltresSélectionnés from "./FiltresSélectionnés/FiltresSélectionnés";

interface PageRapportDétailléProps {
  chantiers: ChantierRapportDetailleContrat[];
  ministères: Ministère[];
  axes: Axe[];
  indicateursGroupésParChantier: Record<string, Indicateur[]>;
  détailsIndicateursGroupésParChantier: Record<
    Chantier["id"],
    DétailsIndicateurs
  >;
  publicationsGroupéesParChantier: PublicationsGroupéesParChantier;
  mailleSelectionnee: MailleInterne;
  mapChantierStatistiques: Map<string, AvancementChantierRapportDetaille>;
  territoireCode: string;
  jalon: number;
  filtresComptesCalculés: Record<TypeAlerteChantier, number>;
  avancementsAgrégés: AvancementsStatistiquesAccueilContrat;
  avancementsGlobauxTerritoriauxMoyens: AvancementsGlobauxTerritoriauxMoyensContrat;
  repartitionMeteosChantiers: RepartitionMeteoContrat;
  estAutoriseAVoirLesBrouillons: boolean;
  mapDonnéesCartographieAvancement: Map<
    string,
    AvancementsGlobauxTerritoriauxMoyensContrat
  >;
  mapDonnéesCartographieMétéo: Map<string, CartographieDonnéesMétéo>;
  listeIndicateursPrisEnCompteAvancement: string[];
  chantiersSontArchives: boolean;
}

export const htmlId = {
  listeDesChantiers: () => "liste-des-chantiers",
  chantier: (chantierId: string) => `chantier-${chantierId}`,
};

const PageRapportDétaillé: FunctionComponent<PageRapportDétailléProps> = ({
  chantiers: chantiersFiltrés,
  ministères,
  axes,
  indicateursGroupésParChantier,
  détailsIndicateursGroupésParChantier,
  publicationsGroupéesParChantier,
  mailleSelectionnee,
  mapChantierStatistiques,
  filtresComptesCalculés,
  avancementsAgrégés,
  avancementsGlobauxTerritoriauxMoyens,
  repartitionMeteosChantiers,
  estAutoriseAVoirLesBrouillons,
  territoireCode,
  jalon,
  mapDonnéesCartographieAvancement,
  mapDonnéesCartographieMétéo,
  listeIndicateursPrisEnCompteAvancement,
  chantiersSontArchives,
}) => {
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const territoireSélectionné = récupérerDétailsSurUnTerritoire(territoireCode);
  const [afficherLesChantiers, setAfficherLesChantiers] = useState(false);

  const queryParamString = getQueryParamString(getFiltresActifs());

  const hrefBoutonRetour = `/accueil/chantier/${territoireCode}${queryParamString.length > 0 ? `?${queryParamString}` : ""}`;

  return (
    <>
      <PremièrePageImpressionRapportDétaillé
        axes={axes}
        estAutoriseAVoirLesBrouillons={estAutoriseAVoirLesBrouillons}
        ministères={ministères}
        territoireSélectionné={territoireSélectionné}
      />
      <PageRapportDétailléStyled>
        <main>
          <div className="fr-container fr-mb-0 fr-px-0 fr-px-md-2w">
            <div className="fr-px-2w fr-px-md-0 flex justify-between entête-rapport-détaillé">
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
            <div className="fr-mb-3w interrupteur-chantiers">
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
            />
            {afficherLesChantiers ? (
              <div className="chantiers">
                {chantiersFiltrés.map((chantier) => (
                  <RapportDétailléChantier
                    chantier={chantier}
                    commentaires={
                      publicationsGroupéesParChantier.commentaires[
                        chantier.id
                      ] ?? []
                    }
                    donnéesCartographieAvancement={
                      mapDonnéesCartographieAvancement.get(chantier.id)!
                    }
                    donnéesCartographieMétéo={
                      mapDonnéesCartographieMétéo.get(chantier.id)!
                    }
                    décisionStratégique={
                      publicationsGroupéesParChantier.décisionStratégique[
                        chantier.id
                      ] ?? null
                    }
                    détailsIndicateurs={
                      détailsIndicateursGroupésParChantier[chantier.id] ?? []
                    }
                    indicateurs={
                      indicateursGroupésParChantier[chantier.id] ?? []
                    }
                    jalon={jalon}
                    key={chantier.id}
                    listeIndicateursPrisEnCompteAvancement={
                      listeIndicateursPrisEnCompteAvancement
                    }
                    mailleSelectionnee={mailleSelectionnee}
                    mapChantierStatistiques={mapChantierStatistiques}
                    objectifs={
                      publicationsGroupéesParChantier.objectifs[chantier.id] ??
                      []
                    }
                    synthèseDesRésultats={
                      publicationsGroupéesParChantier.synthèsesDesRésultats[
                        chantier.id
                      ] ?? null
                    }
                    territoireCode={territoireCode}
                    territoireSélectionné={territoireSélectionné}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </main>
      </PageRapportDétailléStyled>
    </>
  );
};

export default PageRapportDétaillé;
