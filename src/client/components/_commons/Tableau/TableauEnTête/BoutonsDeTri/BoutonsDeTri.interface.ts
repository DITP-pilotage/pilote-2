type Tri = 'asc' | 'desc' | false;

export default interface BoutonsDeTriProps {
  tri: Tri;
  setTri: (tri: Tri) => void
}
