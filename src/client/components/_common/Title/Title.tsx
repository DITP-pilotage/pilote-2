import TitleProps from './Title.interface';

export default function Title({ children, as, look }: TitleProps) {
  const HtmlTag = `${as}` as keyof JSX.IntrinsicElements;

  return (
    <HtmlTag className={look}>
      {children}
    </HtmlTag>
  );
}