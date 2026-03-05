-- depends_on: "dev_pilote__6230"."public"."utilisateur"

select 
    "id"::uuid,
    "date_creation"::timestamptz,
    "utilisateur_email",
    "est_valide"::bool
from "dev_pilote__6230"."seeds"."rapport_import_mesure_indicateur_py"