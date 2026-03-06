import { Bouton } from "@/components/_commons/Bouton/Bouton";

export const ExportRapportDownload = ({ contenu }: { contenu: string }) => {
  const handleDownload = () => {
    const date = new Date().toISOString().slice(0, 10);
    const filename = `rapport-pilote-${date}.txt`;
    const blob = new Blob([contenu], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-2 max-w-3xl mx-auto flex justify-center">
      <Bouton
        label="Télécharger le rapport"
        variant="primary"
        onClick={handleDownload}
        type="button"
      />
    </div>
  );
};
