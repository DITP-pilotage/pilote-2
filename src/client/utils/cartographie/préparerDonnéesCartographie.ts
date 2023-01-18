import { Maille, Territoire } from '@/server/domain/chantier/Chantier.interface';
import { Agrégation } from '@/client/utils/types';
import { agrégerDonnéesTerritoires, DonnéesTerritoires, réduireDonnéesTerritoires, TerritoireSansCodeInsee } from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';
import { CartographieValeur } from '@/components/_commons/Cartographie/CartographieAffichage/CartographieAffichage.interface';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';

export function préparerDonnéesCartographieÀPartirDUneListe(
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

export function préparerDonnéesCartographieÀPartirDUnÉlément(
  donnéesTerritoires: DonnéesTerritoires<Territoire>,
  fonctionDExtraction: (territoire: Territoire) => CartographieValeur,
) : CartographieDonnées {
  const donnéesCartographie: CartographieDonnées = { départementale : {}, régionale: {} };
  let maille: Maille;

  for (maille in donnéesTerritoires) {
    if (maille === 'nationale') {
      continue;
    }
    for (const codeInsee in donnéesTerritoires[maille]) {
      donnéesCartographie[maille][codeInsee] = fonctionDExtraction(donnéesTerritoires[maille][codeInsee]);
    }
  }
  return donnéesCartographie;
}
