export const IconeDocumentationIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      clipRule="evenodd"
      d="M20.9955 6.99631V21.0006C20.9949 21.5485 20.5505 21.9926 20.0026 21.9926H3.99292C3.44661 21.9888 3.00436 21.5469 3 21.0006V2.9895C3 2.44164 3.44505 1.99756 3.99292 1.99756H15.9967L20.9955 6.99631ZM10.998 10.9953V16.9938H12.9975V10.9953H10.998ZM10.998 6.99631V8.99581H12.9975V6.99631H10.998Z"
      fill={fill}
      fillRule="evenodd"
    />
  </svg>
);
