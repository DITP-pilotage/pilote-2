import CartographieProps, {
  CartographieDonnées, CartographieDépartementJSON,
  CartographieTerritoireAffiché,
  CartographieRégionJSON, CartographieOptions,
} from './Cartographie.interface';
import CartographieAffichage from './CartographieAffichage/CartographieAffichage';
import { CartographieTerritoireCodeInsee } from './CartographieAffichage/CartographieAffichage.interface';
import untypedDépartementsJSON from './départements.json';
import untypedRégionsJSON from './régions.json';

const départementsJSON: CartographieDépartementJSON[] = untypedDépartementsJSON;
const régionsJSON: CartographieRégionJSON[] = untypedRégionsJSON;

function déterminerRégionsÀTracer(territoireAffiché: CartographieTerritoireAffiché) {
  return territoireAffiché.divisionAdministrative === 'région'
    ? régionsJSON.filter(régionJSON => régionJSON.codeInsee === territoireAffiché.codeInsee)
    : régionsJSON;
}

function récupérerDépartementsDUneRégion(codeInseeRégion: CartographieTerritoireCodeInsee) {
  return départementsJSON
    .filter(département => département.codeInseeRégion === codeInseeRégion);
}

function créerTerritoires(
  régionsÀTracer: CartographieRégionJSON[],
  données: CartographieDonnées,
  afficherDépartements: boolean,
) {
  return régionsÀTracer.map(région => ({
    codeInsee: région.codeInsee,
    divisionAdministrative: 'région' as const,
    nom: région.nom,
    tracéSVG: région.tracéSVG,
    valeur: données.régionale[région.codeInsee],
    sousTerritoires: afficherDépartements
      ? récupérerDépartementsDUneRégion(région.codeInsee)
        .map(département => ({
          codeInsee: département.codeInsee,
          divisionAdministrative: 'département' as const,
          nom: département.nom,
          tracéSVG: département.tracéSVG,
          valeur: données.départementale[département.codeInsee],
          codeInseeParent: département.codeInseeRégion,
          sousTerritoires: [],
        }))
      : [],
  }),
  );
}

const optionsParDéfaut: CartographieOptions = {
  territoireAffiché: {
    codeInsee: 'FR',
    divisionAdministrative: 'france',
  },
  couleurDeRemplissage: () => '#dedede',
  formaterValeur: (valeur) => valeur ? String(valeur) : '-',
  territoireSélectionnable: false,
};

export default function Cartographie({ children, données, niveauDeMaille, options }: CartographieProps) {
  const optionsEffectives = { ...optionsParDéfaut, ...options };

  const régionsFiltrées =  déterminerRégionsÀTracer(optionsEffectives.territoireAffiché);
  const territoires = créerTerritoires(régionsFiltrées, données, niveauDeMaille === 'départementale');

  return (
    <CartographieAffichage
      options={optionsEffectives}
      territoires={territoires}
    >
      { children }
    </CartographieAffichage>
  );
}
