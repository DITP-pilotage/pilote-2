export default interface TableauChantiersTuileMinistèreProps {
  ministère: {
    nom: string;
    avancement: number | null;
  };
  estDéroulé: boolean,
}
