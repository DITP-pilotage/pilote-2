import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useProfilUtilisateurConnecte } from "@/client/hooks/useProfilUtilisateurConnecte";
import { monProfilFormSchema, MonProfilFormValues } from "./form";

export default function useMonProfilFormulaire() {
  const profilUtilisateur = useProfilUtilisateurConnecte();

  return useForm<MonProfilFormValues>({
    resolver: zodResolver(monProfilFormSchema),
    defaultValues: {
      email: profilUtilisateur.email,
      prenom: profilUtilisateur.prenom,
      nom: profilUtilisateur.nom,
      fonction: profilUtilisateur.fonction || "",
      ministere: profilUtilisateur.ministere || undefined,
      service: profilUtilisateur.service || undefined,
      serviceAutre: profilUtilisateur.serviceAutre || undefined,
    },
  });
}
