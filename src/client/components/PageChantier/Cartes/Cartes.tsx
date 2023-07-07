import { mailleSélectionnéeTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { objectEntries } from '@/client/utils/objects/objects';
import Bloc from '@/components/_commons/Bloc/Bloc';
import CartographieAvancement from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement';
import CartographieMétéo from '@/components/_commons/Cartographie/CartographieMétéo/CartographieMétéo';
import Titre from '@/components/_commons/Titre/Titre';
import useCartographie from '@/components/_commons/Cartographie/useCartographie';
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS } from '@/client/constants/légendes/élémentsDeLégendesCartographieAvancement';
import { ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS } from '@/client/constants/légendes/élémentsDeLégendesCartographieMétéo';
import CartesStyled from '@/components/PageChantier/Cartes/Cartes.styled';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import INFOBULLE_CONTENUS from '@/client/constants/infobulles';
import TitreInfobulleConteneur from '@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur';
import CartesProps from './Cartes.interface';

export default function Cartes({ chantierMailles, estInteractif = true }: CartesProps) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const { auClicTerritoireCallback } = useCartographie();

  const donnéesCartographieAvancement = objectEntries(chantierMailles[mailleSélectionnée]).map(([codeInsee, territoire]) => ({
    valeur: territoire.avancement.global,
    codeInsee: codeInsee,
  }));

  const donnéesCartographieMétéo = objectEntries(chantierMailles[mailleSélectionnée]).map(([codeInsee, territoire]) => ({
    valeur: territoire.météo,
    codeInsee: codeInsee,
  }));

  return (
    <CartesStyled>
      <div className='carte'>
        <Bloc>
          <section>
            <TitreInfobulleConteneur>
              <Titre
                baliseHtml='h3'
                className='fr-text--lg fr-mb-0 fr-py-1v'
                estInline
              >
                Taux d&apos;avancement
              </Titre>
              <Infobulle idHtml="infobulle-chantier-répartitionGéographiqueTauxAvancement">
                { INFOBULLE_CONTENUS.chantier.répartitionGéographiqueTauxAvancement }
              </Infobulle>
            </TitreInfobulleConteneur>
            <CartographieAvancement
              auClicTerritoireCallback={auClicTerritoireCallback}
              données={donnéesCartographieAvancement}
              options={{ estInteractif: estInteractif }}
              élémentsDeLégende={ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS}
            />
          </section>
        </Bloc>
      </div>
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
              <Infobulle idHtml="infobulle-chantier-répartitionGéographiqueNiveauDeConfiance">
                { INFOBULLE_CONTENUS.chantier.répartitionGéographiqueNiveauDeConfiance }
              </Infobulle>
            </TitreInfobulleConteneur>
            <CartographieMétéo
              auClicTerritoireCallback={auClicTerritoireCallback}
              données={donnéesCartographieMétéo}
              options={{ estInteractif: estInteractif }}
              élémentsDeLégende={ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS}
            />
          </section>
        </Bloc>
      </div>
    </CartesStyled>
  );
}
