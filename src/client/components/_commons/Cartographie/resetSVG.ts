export default function resetSVG(path: string) {
  const arrayPath = path.split(' ');
  const cleanedArrayPath = arrayPath.filter(
    (coordinate) => !Number.isNaN(Number.parseFloat(coordinate)),
  );
  const xPositions = cleanedArrayPath.filter((_v, i) => !(i % 2));
  const yPositions = cleanedArrayPath.filter((_v, i) => i % 2);
  const xPositionsFloat = xPositions.map((position) => Number.parseFloat(position));
  const yPositionsFloat = yPositions.map((position) => Number.parseFloat(position));

  const smallestX = Math.min(...xPositionsFloat);
  const smallestY = Math.min(...yPositionsFloat);

  let isY = false;

  const resetPath = arrayPath.map((position) => {
    if (Number.isNaN(Number.parseFloat(position))) return position;

    if (isY) {
      isY = false;
      return Number.parseFloat(position) - smallestY;
    } else {
      isY = true;
      return Number.parseFloat(position) - smallestX;
    }
  });

  return {
    path: resetPath.toString().replaceAll(',', ' '),
    originalX: smallestX,
    originalY: smallestY,
  };
}
