import Hachure from '@/client/constants/nuanciers/hachure/hachure';

const hachuresGrisBlanc: Hachure = {
  id: 'hachures-gris-blanc',
  patternSVG: (
    <pattern
      height="1"
      id="hachures-gris-blanc"
      patternTransform="rotate(45)"
      patternUnits="userSpaceOnUse"
      width="1"
    >
      <line
        stroke="#666666"
        strokeWidth="0.75"
        y2="1"
      />
    </pattern>
  ),
};

export default hachuresGrisBlanc;
