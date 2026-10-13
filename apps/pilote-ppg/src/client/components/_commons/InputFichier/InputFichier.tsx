import { FunctionComponent, InputHTMLAttributes } from "react";

type InputFichierProps = InputHTMLAttributes<HTMLInputElement>;

const InputFichier: FunctionComponent<InputFichierProps> = ({
  onChange,
  accept = ".csv, .xls, .xlsx",
}) => {
  return (
    <div>
      <input
        accept={accept}
        aria-label="Choisir un fichier"
        className="m-0 inline-flex w-full text-sm leading-6 file:mr-2 file:cursor-pointer file:[appearance:button] file:[font:inherit] disabled:file:cursor-not-allowed disabled:file:outline-none print:text-base print:leading-6"
        id="file-upload"
        name="file-upload"
        onChange={onChange}
        type="file"
      />
    </div>
  );
};

export default InputFichier;
