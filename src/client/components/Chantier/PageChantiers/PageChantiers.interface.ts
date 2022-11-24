export default interface PageChantiersProps {
  chantiers: ChantierDeLaPageChantiers[]
}

export type ChantierDeLaPageChantiers = {
  id: number,
  nom: string,
  meteo: number | null,
  avancement: number | null,
};
