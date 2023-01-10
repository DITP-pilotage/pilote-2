import Titre from '@/components/_commons/Titre/Titre';
import Cartographie from '@/components/_commons/Cartographie/Cartographie';
import Chantier, { Maille, Territoire } from '@/server/domain/chantier/Chantier.interface';
import {
  CartographieValeur,
  CartographieTerritoireCodeInsee,
} from '@/components/_commons/Cartographie/CartographieAffichage/CartographieAffichage.interface';
import RépartitionGéographiqueProps from './RépartitionGéographique.interface';

function calculerLaMoyenne(valeurs: CartographieValeur[]) {
  const valeursFiltrées = valeurs.filter((valeur): valeur is number => valeur !== null);
  const somme = valeursFiltrées.reduce(
    (accumulateur, valeur) => accumulateur + valeur,
    0,
  );

  return valeursFiltrées.length === 0 ? null : somme / valeursFiltrées.length;
}

function récupérerLaDonnéeDIntérêtDesChantiers(
  chantiers: Chantier[],
  maille: Exclude<Maille, 'nationale'>,
  fonctionDExtraction: (territoire: Territoire) => CartographieValeur,
) {
  let donnéesTerritoire: Record<CartographieTerritoireCodeInsee, CartographieValeur[]> = {};

  chantiers.forEach(chantier => {
    Object.entries(chantier.mailles[maille]).forEach(([codeInsee, territoire]) => {
      if (!donnéesTerritoire[codeInsee])
        donnéesTerritoire[codeInsee] = [];
      donnéesTerritoire[codeInsee] = [...donnéesTerritoire[codeInsee], fonctionDExtraction(territoire)];
    });
  });

  return donnéesTerritoire;
}

function calculerLesMoyennesPourTousLesChantiers(donnéesTerritoires: Record<CartographieTerritoireCodeInsee, CartographieValeur[]> ) {
  let moyennes: Record<CartographieTerritoireCodeInsee, CartographieValeur> = {};

  Object.entries(donnéesTerritoires).forEach(([codeInsee, valeurs]) => {
    moyennes[codeInsee] = calculerLaMoyenne(valeurs);
  });

  return moyennes;
}

export default function RépartitionGéographique({ chantiers }: RépartitionGéographiqueProps) {
  const donnéesCartographie = {
    'régionale': calculerLesMoyennesPourTousLesChantiers(
      récupérerLaDonnéeDIntérêtDesChantiers(
        chantiers,
        'régionale',
        territoire => territoire.avancement.global,
      )),
    'départementale':  calculerLesMoyennesPourTousLesChantiers(
      récupérerLaDonnéeDIntérêtDesChantiers(
        chantiers,
        'départementale',
        territoire => territoire.avancement.global,
      )),
  };

  return (
    <>
      <Titre
        baliseHtml='h2'
        className='fr-h6'
      >
        Répartition géographique
      </Titre>
      <Cartographie
        données={donnéesCartographie}
        fonctionDAffichage={(valeur) => valeur ? `${valeur.toFixed(0)}%` : 'Non renseigné'}
        niveauDeMailleAffiché='départementale'
        territoireAffiché={{
          codeInsee: 'FR',
          divisionAdministrative: 'france',
        }}
      />
    </>
  );
}
