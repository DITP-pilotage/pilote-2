import { FunctionComponent } from 'react';
import SélecteurMaille from '@/client/components/_commons/SélecteursMaillesEtTerritoiresChantier/SélecteurMaille/SélecteurMaille';
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS } from '@/client/constants/légendes/élémentsDeLégendesCartographieAvancement';
import { Maille, MailleInterne } from '@/server/domain/maille/Maille.interface';
import useCartographie from '@/client/components/_commons/Cartographie/useCartographieNew';
import Sélecteur from '@/client/components/_commons/Sélecteur/Sélecteur';
import { SélecteurOption } from '@/client/components/_commons/Sélecteur/Sélecteur.interface';
import Cartographie from '@/client/components/_commons/Cartographie/CartographieNew';
import CartographieLégendeListe from '@/client/components/_commons/Cartographie/Légende/Liste/CartographieLégendeListe';
import { ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS } from '@/client/constants/légendes/élémentsDeLégendesCartographieMétéo';
import { CartographieÉlémentDeLégende } from '@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface';
import { CartographieDonnées } from '@/client/components/_commons/Cartographie/Cartographie.interface';
import { ELEMENTS_LEGENDE_PROPOSITION_VALEUR_CHANTIERS } from '@/client/constants/légendes/elementDeLegendesCartographiePropositionValeur';
import { TerritoiresDonnées } from '@/server/domain/territoire/Territoire.interface';
import { CartographieType } from '@/components/PageChantier/Cartes/Cartes';
import { useCartographieMeteo } from './useCartographieMeteo';
import { useCartographiePropositionValeur } from './useCartographiePropositionValeur';
import { useCartographieAvancement } from './useCartographieAvancement';
 
const CartographieAvecSelecteur: FunctionComponent<{
  chantierMailles: Record<Maille, TerritoiresDonnées>,
  estInteractif?: boolean,
  territoireCode: string,
  mailleQuery: MailleInterne
  estAutoriseAVoirLeSelecteurDeMaille: boolean,
  jalon: number,
  cartographieSelectionnee: CartographieType,
  aLaSelectionCartographie: (valeur: CartographieType) => void
  listeCartographiesDesactives: CartographieType[]
}> = ({ chantierMailles, estAutoriseAVoirLeSelecteurDeMaille, mailleQuery, estInteractif, territoireCode, jalon, cartographieSelectionnee, aLaSelectionCartographie, listeCartographiesDesactives }) => {

  const donneesEtLegendesCartographies: Record<CartographieType, { useRecupererDonnees: () => { donneesCartographie: CartographieDonnées; legende: CartographieÉlémentDeLégende[] } } > = {
    avancementMandat: useCartographieAvancement(chantierMailles, ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS, jalon, 'MANDAT'),
    avancementJalon: useCartographieAvancement(chantierMailles, ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS, jalon, 'JALON'),
    meteo: useCartographieMeteo(chantierMailles, ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS),
    propositionValeur: useCartographiePropositionValeur(chantierMailles, ELEMENTS_LEGENDE_PROPOSITION_VALEUR_CHANTIERS),
  };

  const pathname = '/chantier/[id]/[territoireCode]';
  const { auClicTerritoireCallback } = useCartographie(territoireCode, pathname);

  const optionsCartographie: SélecteurOption<CartographieType>[] = [
    {
      valeur: 'avancementMandat',
      libellé: 'Carte des taux d\'avancement 2026',
      désactivée: listeCartographiesDesactives.includes('avancementMandat'),
    },
    {
      valeur: 'avancementJalon',
      libellé: `Carte des taux d\'avancement ${jalon}`,
      désactivée: listeCartographiesDesactives.includes('avancementJalon'),
    },
    {
      valeur: 'meteo',
      libellé: 'Carte des niveaux de confiance',
      désactivée: listeCartographiesDesactives.includes('meteo'),
    },
    {
      valeur: 'propositionValeur',
      libellé: 'Carte des propositions de valeur d\'avancement',
      désactivée: listeCartographiesDesactives.includes('propositionValeur'),
    },
  ];
  
  const { legende, donneesCartographie } = donneesEtLegendesCartographies[cartographieSelectionnee].useRecupererDonnees();
  return (
    <>
      <Sélecteur 
        htmlName='selecteur-carte' 
        options={optionsCartographie}
        valeurModifiéeCallback={aLaSelectionCartographie}
        valeurSélectionnée={cartographieSelectionnee}      
      />
      {
        estAutoriseAVoirLeSelecteurDeMaille ? (
          <SélecteurMaille
            mailleQuery={mailleQuery}
            pathname={pathname}
          />
        ) : null
      }
      <Cartographie
        auClicTerritoireCallback={auClicTerritoireCallback}
        données={donneesCartographie}
        mailleSelectionnee={mailleQuery}
        options={{ estInteractif }}
        pathname={pathname}
        territoireCode={territoireCode}
      >
        <CartographieLégendeListe contenu={legende} />
      </Cartographie>
    </>
  );
};

export default CartographieAvecSelecteur;
