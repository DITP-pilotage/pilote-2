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
      <main className="pb-10">
        <div>
          <div className="sticky top-0 z-[999] w-full bg-dsfr-alt-blue-france lg:hidden py-2 px-1">
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
          <div className="flex flex-wrap justify-center -mb-2 lg:-mb-3 mt-10 mx-2">
            <div className="p-2 lg:p-3 w-full shrink-0 xl:w-1/2">
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
