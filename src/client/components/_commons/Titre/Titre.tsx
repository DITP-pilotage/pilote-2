import TitreProps from './Titre.interface';

export default function Titre({ children, baliseHtml, apparence, id }: TitreProps) {
  const Balise = `${baliseHtml}` as keyof JSX.IntrinsicElements;

  return (
    <Balise
      className={apparence}
      id={id}
    >
      {children}
    </Balise>
  );
}
