import { Territoire } from '@/server/domain/chantier/Chantier.interface';
import { Agrégation } from '@/client/utils/types';
import {
  agrégerDonnéesTerritoires, DonnéesTerritoires, réduireDonnéesTerritoires,
  TerritoireSansCodeInsee,
} from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';
import {
  CartographieValeur,
} from '@/components/_commons/Cartographie/CartographieAffichage/CartographieAffichage.interface';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';

export default function préparerDonnéesCartographie(
  listeDonnéesTerritoires: DonnéesTerritoires<Territoire>[],
  fonctionDeRéduction: (territoiresAgrégés: Agrégation<TerritoireSansCodeInsee>) => CartographieValeur,
): CartographieDonnées {
  const donnéesTerritoiresAgrégés = agrégerDonnéesTerritoires(listeDonnéesTerritoires);

  return réduireDonnéesTerritoires<CartographieValeur>(
    donnéesTerritoiresAgrégés,
    fonctionDeRéduction,
    null,
  );
}
