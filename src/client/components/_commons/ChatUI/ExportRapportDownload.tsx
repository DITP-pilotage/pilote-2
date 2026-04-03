import { Bouton } from "@/components/_commons/Bouton/Bouton";

export const ExportRapportDownload = ({ url }: { url: string }) => {
  const handleDownload = () => {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "";
    anchor.click();
  };

  return (
    <div className="my-2 max-w-3xl mx-auto flex justify-center">
      <Bouton
        label="Télécharger le rapport PDF"
        variant="primary"
        onClick={handleDownload}
        type="button"
      />
    </div>
  );
};
