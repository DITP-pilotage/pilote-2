export function territoireCodeVersMailleCodeInsee(territoireCode: string) {
  const tupleMailleCodeInsee = territoireCode.split('-');

  return {
    maille:tupleMailleCodeInsee[0], 
    codeInsee: tupleMailleCodeInsee[1],
  };
}
