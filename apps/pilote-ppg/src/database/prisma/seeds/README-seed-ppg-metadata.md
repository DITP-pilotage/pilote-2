# Régénérer seed_ppg_metadata.sql

Quand les données PPG metadata changent en DB de référence, regénérer le seed avec le script ci-dessous.

## Prérequis

- Tunnel actif vers la DB de référence sur le port configuré dans `.env`
- `uv` disponible (le script tourne dans le venv de `pilote-ppg-data-management`)

## Transformations appliquées (non-évidentes)

### `metadata_chantiers`

| Colonne | Problème source | Transformation |
|---|---|---|
| `ch_territo` | Stocké `double precision` par pandas (0.0/1.0/NaN) | `COALESCE(ch_territo::integer::boolean, false)` |
| `ch_hidden_pilote` | Idem, toutes les lignes sont NULL en source | `COALESCE(ch_hidden_pilote::integer::boolean, false)` |
| `ch_saisie_ate` | Valeurs en MAJUSCULES (`ATE`, `HORS_ATE_CENTRALISE`...) | `LOWER(ch_saisie_ate::text)` pour matcher l'enum Prisma |
| `ch_state` | Enum source → cast en text | `ch_state::text` |
| `ch_descr` | Nullable en source (67 lignes NULL) | Déclaré `String?` dans Prisma |
| `maille_applicable` | Nullable en source (152 lignes NULL) | Déclaré `String?` dans Prisma |
| `porteur_id` (porteurs) | Numérique en source | `porteur_id::text` |
| `per_porteur_id` (perimetres) | Numérique en source | `per_porteur_id::text` |

### Sauts de ligne dans les valeurs texte

Certaines valeurs de `ch_descr` contiennent des sauts de ligne réels. Le script utilise la syntaxe `E'...\n...'` pour les garder sur une seule ligne SQL (nécessaire car `seed.ts` split le fichier ligne par ligne).

## Script de régénération

Depuis `apps/pilote-ppg-data-management` :

```python
uv run python3 << 'PYEOF'
import psycopg2
import psycopg2.extras

conn = psycopg2.connect("postgresql://USER:PASSWORD@HOST:PORT/DB")
cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

tables = {
    "metadata_zones": {
        "cols": ["zone_id", "nom", "zone_code", "zone_type", "zone_parent"],
    },
    "metadata_chantiers": {
        "cols": ["chantier_id", "ch_nom", "ch_descr", "ch_ppg", "ch_territo", "engagement_short", "ch_hidden_pilote", "ch_saisie_ate", "ch_state", "zg_applicable", "porteur_ids_noDAC", "porteur_shorts_noDAC", "porteur_ids_DAC", "porteur_shorts_DAC", "ch_per", "maille_applicable", "replicate_val_reg_to", "replicate_val_nat_to", "ch_cible_attendue", "conseiller_mail"],
        "casts": {
            "ch_saisie_ate": "LOWER(ch_saisie_ate::text) AS \"ch_saisie_ate\"",
            "ch_state": "::text",
            "ch_territo": "COALESCE(ch_territo::integer::boolean, false) AS \"ch_territo\"",
            "ch_hidden_pilote": "COALESCE(ch_hidden_pilote::integer::boolean, false) AS \"ch_hidden_pilote\"",
        },
    },
    "metadata_ppgs": {"cols": ["ppg_id", "ppg_nom", "ppg_desc"]},
    "metadata_porteurs": {
        "cols": ["porteur_id", "porteur_short", "porteur_name", "porteur_desc", "porteur_type_id", "porteur_type_short", "porteur_directeur", "porteur_name_short", "porteur_picto"],
        "casts": {"porteur_id": "::text"},
    },
    "metadata_perimetres": {
        "cols": ["perimetre_id", "per_nom", "per_porteur_id", "per_porteur_name_short"],
        "casts": {"per_porteur_id": "::text"},
    },
    "metadata_axes": {"cols": ["axe_id", "axe_name", "axe_desc"]},
    "metadata_engagement": {"cols": ["engagement_id", "engagement_short", "engagement_name"]},
    "metadata_indicateur_types": {"cols": ["indic_type_id", "indic_type_name", "indic_type_descr"]},
    "metadata_zonegroup": {"cols": ["zone_group_id", "zg_zones"]},
}

def build_select_expr(col, casts):
    cast = casts.get(col, "")
    if " AS " in cast:
        return cast
    elif cast:
        return f'"{col}"{cast} AS "{col}"'
    else:
        return f'"{col}"'

def escape(val):
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "true" if val else "false"
    s = str(val)
    needs_escape = "\n" in s or "\r" in s or "\\" in s
    s = s.replace("\\", "\\\\").replace("'", "''")
    if needs_escape:
        s = s.replace("\n", "\\n").replace("\r", "\\r")
        return f"E'{s}'"
    return f"'{s}'"

lines = ["-- Seed PPG metadata — INSERT ... ON CONFLICT DO NOTHING — idempotent\n"]

for table_name, cfg in tables.items():
    cols = cfg["cols"]
    casts = cfg.get("casts", {})
    select_cols = ", ".join(build_select_expr(c, casts) for c in cols)
    cur.execute(f"SELECT {select_cols} FROM raw_data.{table_name}")
    rows = cur.fetchall()
    lines.append(f"-- {table_name} ({len(rows)} rows)")
    for row in rows:
        col_list = ", ".join(f'"{c}"' for c in cols)
        val_list = ", ".join(escape(row[c]) for c in cols)
        lines.append(f"INSERT INTO raw_data.{table_name} ({col_list}) VALUES ({val_list}) ON CONFLICT DO NOTHING;")
    lines.append("")

cur.close()
conn.close()

output_path = "../pilote-ppg/src/database/prisma/seeds/seed_ppg_metadata.sql"
with open(output_path, "w") as f:
    f.write("\n".join(lines))

print(f"OK — {sum(1 for l in lines if l.startswith('INSERT'))} INSERT générés")
PYEOF
```
