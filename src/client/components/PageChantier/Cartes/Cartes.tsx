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
import { Maille, MailleInterne } from '@/server/domain/maille/Maille.interface';
import Alerte from '@/components/_commons/Alerte/Alerte';
import SélecteurMaille
  from '@/components/_commons/SélecteursMaillesEtTerritoiresChantier/SélecteurMaille/SélecteurMaille';

interface CartesProps {
  chantierMailles: MailleRapportDetailleContrat,
  afficheCarteAvancement: boolean,
  afficheCarteMétéo: boolean,
  estInteractif?: boolean,
  territoireCode: string,
  mailleQuery: MailleInterne
  mailleSourceDonnees?: Maille | null
  estAutoriseAVoirLeSelecteurDeMaille: boolean,
}

const Cartes: FunctionComponent<CartesProps> = ({
  chantierMailles,
  afficheCarteAvancement,
  afficheCarteMétéo,
  estInteractif = true,
  territoireCode,
  mailleQuery,
  mailleSourceDonnees,
  estAutoriseAVoirLeSelecteurDeMaille,
}) => {
  const pathname = '/chantier/[id]/[territoireCode]';
  const { auClicTerritoireCallback } = useCartographie(territoireCode, pathname);

  const donnéesCartographieAvancement = objectEntries(({ ...chantierMailles.departementale, ...chantierMailles.regionale })).map(([territoireCodeDonnee, territoire]) => ({
    valeur: territoire.avancement.global,
    valeurAnnuelle: territoire.avancement.annuel,
    territoireCode: territoireCodeDonnee as string,
    estApplicable: territoire.estApplicable,
  }));

  const donnéesCartographieMétéo = objectEntries({ ...chantierMailles.departementale, ...chantierMailles.regionale }).map(([territoireCodeDonnee, territoire]) => ({
    valeur: territoire.météo,
    territoireCode: territoireCodeDonnee as string,
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
                {
                  estAutoriseAVoirLeSelecteurDeMaille ? (
                    <SélecteurMaille
                      mailleQuery={mailleQuery}
                      pathname={pathname}
                    />
                  ) : null
                }
                <CartographieAvancement
                  auClicTerritoireCallback={auClicTerritoireCallback}
                  données={donnéesCartographieAvancement}
                  mailleSelectionnee={mailleQuery}
                  options={{ estInteractif }}
                  pathname={pathname}
                  territoireCode={territoireCode}
                  élémentsDeLégende={ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS}
                />
                {
                  mailleSourceDonnees === 'regionale' &&
                  <Alerte
                    classesSupplementaires='fr-mt-2w'
                    message='Données régionales'
                    type='info'
                  />
                }
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
                {
                  estAutoriseAVoirLeSelecteurDeMaille ? (
                    <SélecteurMaille
                      mailleQuery={mailleQuery}
                      pathname={pathname}
                    />
                  ) : null
                }
                <CartographieMétéo
                  auClicTerritoireCallback={auClicTerritoireCallback}
                  données={donnéesCartographieMétéo}
                  mailleSelectionnee={mailleQuery}
                  options={{ estInteractif }}
                  pathname={pathname}
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
