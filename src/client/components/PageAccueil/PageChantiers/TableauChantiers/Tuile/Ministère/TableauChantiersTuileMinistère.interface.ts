export default interface TableauChantiersTuileMinistèreProps {
  ministère: {
    nom: string;
    icône: string | null;
    avancement: number | null;
  };
  estDéroulé: boolean,
}
