import { useEffect, useState } from 'react';
import {
  mailleSélectionnéeTerritoiresStore,
  territoiresComparésTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';

function récupérerDétailIndicateursPourUnChantierDunTerritoireSelectionné(chantierId: Chantier['id'], codeInsee: string, mailleAssociéeAuTerritoireSélectionné: string) {
  return fetch(`/api/chantier/${chantierId}/indicateurs?codesInsee=${codeInsee}&maille=${mailleAssociéeAuTerritoireSélectionné}`);
}

function creerListeCodeInsee(territoiresComparés: DétailTerritoire[]) {
  return territoiresComparés.map(({ codeInsee }) => `codesInsee=${codeInsee}`).join('&');
}

function estUnUniqueTerritoireComparé(territoiresComparés: DétailTerritoire[]) {
  return territoiresComparés.length === 1;
}

function estUnTerritoireCodeInseeFR(territoiresComparés: DétailTerritoire[]) {
  return territoiresComparés.at(0)?.codeInsee === 'FR';
}

export default function useImportIndicateur(chantierId: Chantier['id']) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const territoiresComparés = territoiresComparésTerritoiresStore();

  const [détailsIndicateurs, setDétailsIndicateurs] = useState<DétailsIndicateurs | null>(null);

  useEffect(() => {
    if (estUnUniqueTerritoireComparé(territoiresComparés) && estUnTerritoireCodeInseeFR(territoiresComparés)) {
      return;
    }

    const { codesInsee, maille } = territoiresComparés.length > 0 ?
      {
        codesInsee: creerListeCodeInsee(territoiresComparés),
        maille: mailleSélectionnée,
      } :
      {
        codesInsee: territoireSélectionné!.codeInsee,
        maille: territoireSélectionné!.maille,
      };

    récupérerDétailIndicateursPourUnChantierDunTerritoireSelectionné(chantierId, codesInsee, maille)
      .then(réponse => réponse.json() as Promise<DétailsIndicateurs>)
      .then(données => setDétailsIndicateurs(données));
  }, [chantierId, mailleSélectionnée, territoireSélectionné, territoiresComparés]);

  return { détailsIndicateurs };
}
