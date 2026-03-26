import Bloc from "@/components/_commons/Bloc/Bloc";
import { MeteoPicto } from "@/components/_commons/Meteo/Picto/MeteoPicto";
import MétéoBadge from "@/components/_commons/Meteo/Badge/MétéoBadge";
import Alerte from "@/components/_commons/Alerte/Alerte";
import SynthèseDesRésultatsAffichage from "@/components/PageRapportDétaillé/SynthèseDesRésultats/Affichage/Affichage";
import { Maille } from "@/server/domain/maille/Maille.interface";
import SynthèseDesRésultatsInterface from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";

interface SynthèseDesRésultatsProps {
  synthèseDesRésultats: SynthèseDesRésultatsInterface;
  nomTerritoire: string;
  mailleSourceDonnees?: Maille | null;
}

const SynthèseDesRésultats = ({
  synthèseDesRésultats,
  nomTerritoire,
  mailleSourceDonnees,
}: SynthèseDesRésultatsProps) => {
  return (
    <div>
      <Bloc
        titre={nomTerritoire}
        backgroundClassNameTitre="bg-dsfr-blue-france-925"
      >
        <div className="fr-py-1w">
          {mailleSourceDonnees === "regionale" && (
            <Alerte
              classesSupplementaires="fr-mb-4w"
              message="Commentaires facultatifs mais souhaités pour apporter un éclairage départemental au pilotage régional."
              titre="Données régionales"
              type="info"
            />
          )}
          <div className="flex flex-wrap gap-x-4 justify-center">
            <div className="fr-mx-1w fr-mb-2w fr-mb-md-0 basis-32 text-center">
              <div className="fr-mb-2w">
                <MétéoBadge
                  météo={synthèseDesRésultats?.météo ?? "NON_RENSEIGNEE"}
                />
              </div>
              {!!synthèseDesRésultats && (
                <div>
                  <MeteoPicto meteo={synthèseDesRésultats.météo} />
                </div>
              )}
            </div>
            <div className="basis-72 grow">
              <SynthèseDesRésultatsAffichage
                synthèseDesRésultats={synthèseDesRésultats}
              />
            </div>
          </div>
        </div>
      </Bloc>
    </div>
  );
};

export default SynthèseDesRésultats;
