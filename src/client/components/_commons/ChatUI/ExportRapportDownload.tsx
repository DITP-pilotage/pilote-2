import { Bouton } from "@/components/_commons/Bouton/Bouton";

export const ExportRapportDownload = ({
  url,
  format,
}: {
  url: string;
  format: "markdown" | "pdf";
}) => {
  const handleDownload = () => {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "";
    anchor.click();
  };

  const label =
    format === "pdf"
      ? "Télécharger le rapport PDF"
      : "Télécharger le rapport Markdown";

  return (
    <div className="my-2 max-w-3xl mx-auto flex justify-center">
      <Bouton
        label={label}
        variant="primary"
        onClick={handleDownload}
        type="button"
      />
    </div>
  );
};
