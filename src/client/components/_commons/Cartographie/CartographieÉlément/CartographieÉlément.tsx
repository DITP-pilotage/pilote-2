import CartographieÉlémentProps from './CartographieÉlément.interface';

export default function CartographieÉlément({ couleurDeFond, donnéesGeo, afficherDansLaFrance }: CartographieÉlémentProps) {
  return (
    <svg
      height="100%"
      version="1.2"
      viewBox={afficherDansLaFrance ? '0 0 700 644' : `0 0 ${donnéesGeo.minX} ${donnéesGeo.minY}`}
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={donnéesGeo.path}
        fill={couleurDeFond}
        stroke="#000000"
        transform={afficherDansLaFrance ? `translate(${donnéesGeo.originalX} ${donnéesGeo.originalY})` : ''}
      />
    </svg>
  );
}
