import pictoSoleil from '/public/img/météo/soleil.svg';
import pictoSoleilNuage from '/public/img/météo/soleil-nuage.svg';
import pictoNuage from '/public/img/météo/nuage.svg';
import pictoOrage from '/public/img/météo/orage.svg';
import Image from 'next/image';

export const météos = {
  4:{ nom: 'Objectifs compromis', picto: pictoOrage },
  3:{ nom: 'Appuis nécessaires', picto: pictoNuage },
  2:{ nom: 'Objectifs atteignables', picto: pictoSoleilNuage },
  1:{ nom: 'Objectifs sécurisés', picto: pictoSoleil },
};

export function mettreEnFormeLaMétéo(valeur: 1 | 2 | 3 | 4 | null) {
  if (valeur === null) {
    return (
      <span>
        Non renseigné
      </span>
    );
  }
    
  return (
    <Image
      alt={météos[valeur].nom}
      src={météos[valeur].picto}
    />
  );
}

