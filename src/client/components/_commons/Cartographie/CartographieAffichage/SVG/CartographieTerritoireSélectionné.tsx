import untypedDépartementsJSON from '@/client/components/_commons/Cartographie/départements.json';
import untypedRégionsJSON from '@/client/components/_commons/Cartographie/régions.json';
import {
  CartographieDépartementJSON,
  CartographieRégionJSON,
} from '@/components/_commons/Cartographie/Cartographie.interface';
import { périmètreGéographique } from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore';
import { TerritoireIdentifiant } from '@/server/domain/chantier/Chantier.interface';

const départementsJSON: CartographieDépartementJSON[] = untypedDépartementsJSON;
const régionsJSON: CartographieRégionJSON[] = untypedRégionsJSON;

function déterminerTerritoireSélectionnéÀTracer(périmètreSélectionné: TerritoireIdentifiant) {
  if (périmètreSélectionné.maille == 'départementale') {
    return départementsJSON.find(département => département.codeInsee == périmètreSélectionné.codeInsee);
  } else if (périmètreSélectionné.maille == 'régionale') {
    return régionsJSON.find(région => région.codeInsee == périmètreSélectionné.codeInsee);
  }
}

export default function CartographieTerritoireSélectionné() {
  const territoireATracer = déterminerTerritoireSélectionnéÀTracer(périmètreGéographique());
  if (territoireATracer) {
    return (
      <path
        className='territoire-sélectionné'
        d={territoireATracer.tracéSVG}
        key={territoireATracer.codeInsee}
      />
    );
  }
  return null;
}
