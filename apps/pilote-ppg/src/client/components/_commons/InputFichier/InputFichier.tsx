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
        className="m-0 inline-flex w-full text-sm leading-6 [&::-webkit-file-upload-button]:mr-2 [&::-webkit-file-upload-button]:cursor-pointer [&::-webkit-file-upload-button]:[appearance:button] [&::-webkit-file-upload-button]:[font:inherit] disabled:[&::-webkit-file-upload-button]:cursor-not-allowed disabled:[&::-webkit-file-upload-button]:outline-none print:text-base print:leading-6"
        id="file-upload"
        name="file-upload"
        onChange={onChange}
        type="file"
      />
    </div>
  );
};

export default InputFichier;
