import { FunctionComponent } from 'react';
import { objectEntries } from '@/client/utils/objects/objects';
import Bloc from '@/components/_commons/Bloc/Bloc';
import CartographieAvancement
  from '@/components/_commons/Cartographie/CartographieAvancementNew/CartographieAvancement';
import CartographieMétéo from '@/components/_commons/Cartographie/CartographieMétéoNew/CartographieMétéo';
import Titre from '@/components/_commons/Titre/Titre';
import useCartographie from '@/components/_commons/Cartographie/useCartographieNew';
import {
  ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS,
} from '@/client/constants/légendes/élémentsDeLégendesCartographieAvancement';
import { ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS } from '@/client/constants/légendes/élémentsDeLégendesCartographieMétéo';
import CartesStyled from '@/components/PageChantier/Cartes/Cartes.styled';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import INFOBULLE_CONTENUS from '@/client/constants/infobulles';
import TitreInfobulleConteneur from '@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur';

import { MailleRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';

interface CartesProps {
  chantierMailles: MailleRapportDetailleContrat,
  afficheCarteAvancement: boolean,
  afficheCarteMétéo: boolean,
  estInteractif?: boolean,
  territoireCode: string,
  mailleSelectionnee: MailleInterne
}

const Cartes: FunctionComponent<CartesProps> = ({
  chantierMailles,
  afficheCarteAvancement,
  afficheCarteMétéo,
  estInteractif = true,
  territoireCode,
  mailleSelectionnee,
}) => {
  const pathname = '/chantier/[id]/[territoireCode]';
  const { auClicTerritoireCallback } = useCartographie(territoireCode, mailleSelectionnee, pathname);

  const donnéesCartographieAvancement = objectEntries(chantierMailles[mailleSelectionnee]).map(([codeInsee, territoire]) => ({
    valeur: territoire.avancement.global,
    codeInsee: codeInsee,
    estApplicable: territoire.estApplicable,
  }));

  const donnéesCartographieMétéo = objectEntries(chantierMailles[mailleSelectionnee]).map(([codeInsee, territoire]) => ({
    valeur: territoire.météo,
    codeInsee: codeInsee,
    estApplicable: territoire.estApplicable,
  }));

  return (
    <CartesStyled>
      {
        afficheCarteAvancement ? (
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
                  auClicTerritoireCallback={auClicTerritoireCallback}
                  données={donnéesCartographieAvancement}
                  mailleSelectionnee={mailleSelectionnee}
                  options={{ estInteractif: estInteractif }}
                  pathname='/chantier/[id]/[territoireCode]'
                  territoireCode={territoireCode}
                  élémentsDeLégende={ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS}
                />
              </section>
            </Bloc>
          </div>
        ) : null
      }
      {
        afficheCarteMétéo ? (
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
                  auClicTerritoireCallback={auClicTerritoireCallback}
                  données={donnéesCartographieMétéo}
                  mailleSelectionnee={mailleSelectionnee}
                  options={{ estInteractif: estInteractif }}
                  pathname='/chantier/[id]/[territoireCode]'
                  territoireCode={territoireCode}
                  élémentsDeLégende={ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS}
                />
              </section>
            </Bloc>
          </div>
        ) : null
      }
    </CartesStyled>
  );
};

export default Cartes;
