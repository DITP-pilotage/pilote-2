import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { BarreLatérale } from "@/components/_commons/BarreLatérale/BarreLatérale";
import BarreLatéraleEncart from "@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart";
import { SélecteursMaillesEtTerritoires } from "@/components/_commons/SélecteursMaillesEtTerritoiresChantier/SélecteursMaillesEtTerritoires";
import PageChantierEnTête from "@/components/PageChantier/EnTête/EnTête";
import { CartographieV2 } from "@/components/_commons/CartographieV2/CartographieV2";
import useCartographie from "@/components/_commons/Cartographie/useCartographie";
import Bloc from "@/components/_commons/Bloc/Bloc";
import { estLargeurDÉcranActuelleMoinsLargeQue } from "@/client/stores/useLargeurDÉcranStore/useLargeurDÉcranStore";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { Icone } from "@/components/_commons/Icone";
import { Equalizer1Icon } from "@/components/_commons/Icones/Equalizer1Icon";
import { useChoixTerritoire } from "./useChoixTerritoire";

const ChoixTerritoire = () => {
  const { territoireCode, mailleSelectionnee, mailleQuery } =
    pageChantier.useServerSidePropsContext();

  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const estVueMobile = estLargeurDÉcranActuelleMoinsLargeQue("md");
  const [estVisibleEnMobile, setEstVisibleEnMobile] = useState(false);
  const { donnéesCartographie, territoiresSelectionnables } =
    useChoixTerritoire(mailleSelectionnee);

  const { auClicTerritoireCallback } = useCartographie(
    territoireCode,
    "/chantier/[id]/[territoireCode]",
  );

  return (
    <div className="flex">
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <BarreLatéraleEncart>
          {estVueMobile && estVisibleEnMobile ? (
            <h3 className="text-h6 md:text-h6-md my-4 w-2/3 max-w-2/3 shrink-0 grow-0 basis-2/3">
              Maille géographique
            </h3>
          ) : null}
          <SélecteursMaillesEtTerritoires
            pathname="/chantier/[id]/[territoireCode]"
            territoireCode={territoireCode}
          />
        </BarreLatéraleEncart>
      </BarreLatérale>
      <main className="fr-pb-5w">
        <div>
          <div className="sticky top-0 z-[999] w-full bg-dsfr-alt-blue-france fr-hidden-lg fr-py-1w fr-px-1v">
            <Button
              variant="tertiary-no-outline"
              className="text-primary gap-2"
              onClick={() => {
                setEstOuverteBarreLatérale(true);
                setEstVisibleEnMobile(true);
              }}
              title="Filtrer"
              type="button"
            >
              <Icone className="w-4 h-4" icone={Equalizer1Icon} />
              Filtrer
            </Button>
          </div>
          <PageChantierEnTête />
          <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--center fr-mt-5w fr-mx-1w">
            <div className="fr-col-12 fr-col-xl-6">
              <Bloc>
                <section>
                  <h3 className="text-lg">Veuillez sélectionner un DROM</h3>
                  <CartographieV2
                    donnees={donnéesCartographie}
                    maille={mailleQuery}
                    onTerritoireSelect={(code) =>
                      auClicTerritoireCallback(code, true)
                    }
                    territoiresSelectionnables={territoiresSelectionnables}
                    territoiresSelectionnes={
                      territoireCode === "NAT-FR" ? [] : [territoireCode]
                    }
                  />
                </section>
              </Bloc>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChoixTerritoire;
