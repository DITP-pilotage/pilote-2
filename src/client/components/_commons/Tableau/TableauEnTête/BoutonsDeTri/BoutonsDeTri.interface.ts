type Tri = 'asc' | 'desc' | false;

export default interface BoutonsDeTriProps {
  libellé: string;
  tri: Tri;
  setTri: (tri: Tri) => void
}
