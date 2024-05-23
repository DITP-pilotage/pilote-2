import Bloc from '@/components/_commons/Bloc/Bloc';
import CartographieAvancement
  from '@/components/_commons/Cartographie/CartographieAvancementNew/CartographieAvancement';
import CartographieMétéo from '@/components/_commons/Cartographie/CartographieMétéo/CartographieMétéo';
import Titre from '@/components/_commons/Titre/Titre';
import {
  ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS,
} from '@/client/constants/légendes/élémentsDeLégendesCartographieAvancement';
import { ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS } from '@/client/constants/légendes/élémentsDeLégendesCartographieMétéo';
import CartesStyled from '@/components/PageChantier/Cartes/Cartes.styled';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import INFOBULLE_CONTENUS from '@/client/constants/infobulles';
import TitreInfobulleConteneur from '@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur';
import CartesProps from './Cartes.interface';

export default function Cartes({
  donnéesCartographieAvancement,
  donnéesCartographieMétéo,
  afficheCarteAvancement,
  afficheCarteMétéo,
  territoireCode,
  mailleSelectionnee,
}: CartesProps) {

  return (
    <CartesStyled>
      {
        !!afficheCarteAvancement && (
          <div className='carte'>
            <Bloc>
              <section>
                <TitreInfobulleConteneur>
                  <Titre
                    baliseHtml='h3'
                    className='fr-text--lg fr-mb-0 fr-py-1v'
                    estInline
                  >
                    Taux d'avancement 2026
                  </Titre>
                  <Infobulle idHtml='infobulle-chantier-répartitionGéographiqueTauxAvancement'>
                    {INFOBULLE_CONTENUS.chantier.répartitionGéographiqueTauxAvancement}
                  </Infobulle>
                </TitreInfobulleConteneur>
                <CartographieAvancement
                  auClicTerritoireCallback={() => {}}
                  données={donnéesCartographieAvancement}
                  mailleSelectionnee={mailleSelectionnee}
                  options={{ estInteractif: false }}
                  territoireCode={territoireCode}
                  élémentsDeLégende={ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS}
                />
              </section>
            </Bloc>
          </div>
        )
      }
      {
        !!afficheCarteMétéo && (
          <div className='carte'>
            <Bloc>
              <section>
                <TitreInfobulleConteneur>
                  <Titre
                    baliseHtml='h3'
                    className='fr-text--lg fr-mb-0 fr-py-1v'
                    estInline
                  >
                    Niveau de confiance
                  </Titre>
                  <Infobulle idHtml='infobulle-chantier-répartitionGéographiqueNiveauDeConfiance'>
                    {INFOBULLE_CONTENUS.chantier.répartitionGéographiqueNiveauDeConfiance}
                  </Infobulle>
                </TitreInfobulleConteneur>
                <CartographieMétéo
                  auClicTerritoireCallback={() => {}}
                  données={donnéesCartographieMétéo}
                  options={{ estInteractif: false }}
                  élémentsDeLégende={ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS}
                />
              </section>
            </Bloc>
          </div>
        )
      }
    </CartesStyled>
  );
}
