-- Suppression des lignes avec Flag==TRUE
--  Cela signifie que ces lignes n'ont pas été mises à jour durant les dj
--  donc ces lignes sont obseletes -> à supprimer

DELETE FROM public.axe WHERE a_supprimer = TRUE;
DELETE FROM public.perimetre WHERE a_supprimer = TRUE;
DELETE FROM public.ppg WHERE a_supprimer = TRUE;
DELETE FROM public.chantier_identite WHERE a_supprimer = TRUE;
DELETE FROM public.indicateur_identite WHERE a_supprimer = TRUE;
DELETE FROM public.ministere WHERE a_supprimer = TRUE;
