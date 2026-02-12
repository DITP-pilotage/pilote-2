import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useProfilUtilisateurConnecte } from "@/client/hooks/useProfilUtilisateurConnecte";
import { monProfilFormSchema, MonProfilFormValues } from "./form";

export function useMonProfilFormulaire() {
  const profilUtilisateur = useProfilUtilisateurConnecte();

  return useForm<MonProfilFormValues>({
    resolver: zodResolver(monProfilFormSchema),
    defaultValues: {
      email: profilUtilisateur.email,
      prenom: profilUtilisateur.prenom,
      nom: profilUtilisateur.nom,
      fonction: profilUtilisateur.fonction || "",
      service: profilUtilisateur.service || "",
      serviceAutre: profilUtilisateur.serviceAutre || "",
    },
  });
}
