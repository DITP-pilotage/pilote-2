import { FunctionComponent } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";
import CartographieAvancement from "@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement";
import CartographieMétéo from "@/components/_commons/Cartographie/CartographieMétéo/CartographieMétéo";
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieAvancement";
import { ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieMétéo";
import { Infobulle } from "@/components/shared/Infobulle";
import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import TitreInfobulleConteneur from "@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur";
import { AvancementsGlobauxTerritoriauxMoyensContrat } from "@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat";
import { CartographieDonnéesMétéo } from "@/components/_commons/Cartographie/CartographieMétéo/CartographieMétéo.interface";
import { MailleInterne } from "@/shared/maille/Maille.interface";

interface CartesProps {
  afficheCarteAvancement: boolean;
  afficheCarteMétéo: boolean;
  donnéesCartographieAvancement: AvancementsGlobauxTerritoriauxMoyensContrat;
  donnéesCartographieMétéo: CartographieDonnéesMétéo;
  territoireCode: string;
  jalon: number;
  mailleSelectionnee: MailleInterne;
}

const Cartes: FunctionComponent<CartesProps> = ({
  donnéesCartographieAvancement,
  donnéesCartographieMétéo,
  afficheCarteAvancement,
  afficheCarteMétéo,
  territoireCode,
  jalon,
  mailleSelectionnee,
}) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 print:grid-cols-2">
      {afficheCarteAvancement ? (
        <div className="print:break-inside-avoid">
          <Bloc>
            <section>
              <TitreInfobulleConteneur>
                <h3 className="text-lg mb-0 py-1 inline">
                  {`Taux d'avancement ${jalon}`}
                </h3>
                <Infobulle>
                  {
                    INFOBULLE_CONTENUS.chantier
                      .répartitionGéographiqueTauxAvancement
                  }
                </Infobulle>
              </TitreInfobulleConteneur>
              <CartographieAvancement
                données={donnéesCartographieAvancement}
                jalon={jalon}
                mailleSelectionnee={mailleSelectionnee}
                territoireCode={territoireCode}
                élémentsDeLégende={ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS}
              />
            </section>
          </Bloc>
        </div>
      ) : null}
      {afficheCarteMétéo ? (
        <div className="print:break-inside-avoid">
          <Bloc>
            <section>
              <TitreInfobulleConteneur>
                <h3 className="text-lg mb-0 py-1 inline">
                  Niveau de confiance
                </h3>
                <Infobulle>
                  {
                    INFOBULLE_CONTENUS.chantier
                      .répartitionGéographiqueNiveauDeConfiance
                  }
                </Infobulle>
              </TitreInfobulleConteneur>
              <CartographieMétéo
                données={donnéesCartographieMétéo}
                mailleSelectionnee={mailleSelectionnee}
                territoireCode={territoireCode}
                élémentsDeLégende={ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS}
              />
            </section>
          </Bloc>
        </div>
      ) : null}
    </div>
  );
};

export default Cartes;
