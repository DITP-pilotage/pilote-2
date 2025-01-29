import { FunctionComponent, useState } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import CartesStyled from '@/components/PageChantier/Cartes/Cartes.styled';
import { Maille, MailleInterne } from '@/server/domain/maille/Maille.interface';
import Alerte from '@/components/_commons/Alerte/Alerte';
import CartographieAvecSelecteur from '@/components/_commons/Cartographie/CartographieAvecSelecteur/CartographieAvecSelecteur';
import { TerritoiresDonnées } from '@/server/domain/territoire/Territoire.interface';

export type CartographieType = 'avancementMandat' | 'avancementJalon' | 'meteo' | 'propositionValeur';
interface CartesProps {
  chantierMailles: Record<Maille, TerritoiresDonnées>,
  afficheCarteAvancement: boolean,
  afficheCarteMétéo: boolean,
  estInteractif?: boolean,
  territoireCode: string,
  jalon: number,
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
  jalon,
  mailleQuery,
  mailleSourceDonnees,
  estAutoriseAVoirLeSelecteurDeMaille,
}) => {
  const [cartographieGaucheSelection, setCartographieGaucheSelection] = useState<CartographieType>('avancementMandat');
  const [cartographieDroiteSelection, setCartographieDroiteSelection] = useState<CartographieType>('meteo');

  return (
    <CartesStyled>
      {
        afficheCarteAvancement ? (
          <div className='carte'>
            <Bloc>
              <section>
                <CartographieAvecSelecteur 
                  cartographieSelectionnee={cartographieGaucheSelection}
                  chantierMailles={chantierMailles} 
                  estAutoriseAVoirLeSelecteurDeMaille={estAutoriseAVoirLeSelecteurDeMaille}
                  estInteractif={estInteractif}
                  jalon={jalon} 
                  listeCartographiesDesactives={[cartographieDroiteSelection]}
                  mailleQuery={mailleQuery}
                  setCartographieSelectionnee={setCartographieGaucheSelection}
                  territoireCode={territoireCode}       
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
                <CartographieAvecSelecteur 
                  cartographieSelectionnee={cartographieDroiteSelection}
                  chantierMailles={chantierMailles} 
                  estAutoriseAVoirLeSelecteurDeMaille={estAutoriseAVoirLeSelecteurDeMaille}
                  estInteractif={estInteractif}
                  jalon={jalon} 
                  listeCartographiesDesactives={[cartographieGaucheSelection]}    
                  mailleQuery={mailleQuery}
                  setCartographieSelectionnee={setCartographieDroiteSelection}    
                  territoireCode={territoireCode}        
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
