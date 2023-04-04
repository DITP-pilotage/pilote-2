export default interface TableauChantierTuileMinistèreProps {
  ministère: {
    nom: string;
    avancement: number | null;
  };
  estDéroulé: boolean,
}
