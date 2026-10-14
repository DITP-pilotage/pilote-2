// Page publique des evals de l'Assistant IA PILOTE.
// Lit data/rapport.json, produit par `pnpm eval:rapport` (evals/rapport/preparerRapport.ts).

const NIVEAUX = [
  {
    cle: "1",
    numero: "Niveau 1",
    titre: "Outils chargés",
    texte:
      "Selon le profil et l'écran, l'assistant dispose des bons outils, et seulement de ceux-là.",
  },
  {
    cle: "2",
    numero: "Niveau 2",
    titre: "Choix des outils",
    texte:
      "Pour un message donné, l'assistant appelle l'outil attendu avec les bons arguments, et s'abstient quand aucun ne convient.",
  },
  {
    cle: "3",
    numero: "Niveau 3",
    titre: "Scénarios de l'accueil",
    texte:
      "Les demandes proposées à l'accueil, jouées de bout en bout. La réponse est notée critère par critère : vérifications mécaniques et juge LLM.",
  },
  {
    cle: "juge",
    numero: "Calibration",
    titre: "Fiabilité du juge",
    texte:
      "Avant de croire le juge, on vérifie qu'il repère un défaut glissé dans une réponse de référence, sans en signaler ailleurs. Ce score n'entre pas dans celui de l'assistant.",
  },
];

const COLONNES_MARKDOWN = new Set(["Réponse", "Réponse jugée"]);
const COLONNES_CODE = new Set(["Outils appelés", "Widgets", "Verdicts"]);

// ChevronRight de lucide, comme le reste de l'iconographie KPilote.
const CHEVRON = `<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>`;

const etat = {
  rapport: null,
  recherche: "",
  echecs: false,
};

// ---------- Utilitaires ----------

const echapper = (texte) =>
  String(texte).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

const pourcent = (score) => `${Math.round(score * 100)}\u202F%`;

const moyenne = (valeurs) =>
  valeurs.length === 0
    ? 0
    : valeurs.reduce((total, v) => total + v, 0) / valeurs.length;

const etatEssai = (score) =>
  score >= 0.999 ? "tenu" : score <= 0 ? "rate" : "partiel";

const etatAgrege = (score) =>
  score >= 0.9 ? "tenu" : score >= 0.6 ? "partiel" : "rate";

const cleNiveau = (suite) =>
  suite.niveau.startsWith("3.0") ? "juge" : suite.niveau.split(".")[0];

const estOutil = (titre) => /^[a-z_]+$/.test(titre);

const jauge = (score) =>
  `<span class="jauge" style="--s:${score}" data-etat="${etatEssai(score)}"></span>`;

const jaugesCas = (cas) =>
  `<span class="jauges">${cas.essais.map((essai) => jauge(essai.score)).join("")}</span>`;

const markdown = (texte) => {
  if (!window.marked || !window.DOMPurify) {
    return `<p style="white-space:pre-wrap">${echapper(texte)}</p>`;
  }
  return window.DOMPurify.sanitize(window.marked.parse(texte));
};

const formaterDate = (date) => {
  const iso = /[zZ]|[+-]\d\d:?\d\d$/.test(date)
    ? date
    : `${date.replace(" ", "T")}Z`;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
    new Date(iso),
  );
};

// ---------- En-tête ----------

// Écart avec le run précédent, en points : « +3 pts depuis le 7 octobre ».
const ecart = ({ actuel, precedent }) => {
  if (!precedent || typeof precedent.valeur !== "number") return "";
  const points = Math.round((actuel - precedent.valeur) * 100);
  const etatEcart = points > 0 ? "tenu" : points < 0 ? "partiel" : "neutre";
  const signe = points > 0 ? "+" : points < 0 ? "−" : "±";
  return `<span class="pill${etatEcart === "neutre" ? " pill--neutre" : ""}" data-etat="${etatEcart}">${signe}${Math.abs(points)}\u202Fpt${Math.abs(points) > 1 ? "s" : ""} depuis le ${formaterDate(precedent.date)}</span>`;
};

const rendreEntete = ({ rapport, historique }) => {
  const suitesAssistant = rapport.suites.filter(
    (suite) => cleNiveau(suite) !== "juge",
  );
  const casAssistant = suitesAssistant.flatMap((suite) => suite.cas);
  // Le run courant est la dernière entrée de l'historique.
  const precedent = historique.at(-2);

  const essaisParCas = Math.max(
    ...casAssistant.map((cas) => cas.essais.length),
  );
  const commit = rapport.run.commit
    ? `, commit <a href="https://github.com/DITP-pilotage/pilote-2/commit/${echapper(rapport.run.commit)}"><code>${echapper(rapport.run.commit.slice(0, 7))}</code></a>`
    : "";
  document.querySelector("#contexte").innerHTML =
    `Run du ${formaterDate(rapport.run.date)}${commit}. ` +
    `${casAssistant.length} cas répartis en ${suitesAssistant.length} suites, chacun joué ${essaisParCas} fois.`;

  const parNiveau = NIVEAUX.map((niveau) => ({
    niveau,
    suites: rapport.suites.filter((suite) => cleNiveau(suite) === niveau.cle),
  })).filter(({ suites }) => suites.length > 0);

  const statAssistant = `<div class="stat stat--primary">
    <p class="kicker">Score de l'assistant</p>
    <p class="stat__valeur">${pourcent(rapport.resume.score)}</p>
    ${ecart({ actuel: rapport.resume.score, precedent: precedent && { valeur: precedent.score, date: precedent.date } })}
    <p class="stat__legende">Moyenne des ${suitesAssistant.length} suites, calibration du juge exclue</p>
  </div>`;
  document.querySelector("#stats").innerHTML =
    statAssistant +
    parNiveau
      .map(
        ({ niveau, suites }) => `<div class="stat">
    <p class="kicker kicker--muted">${niveau.numero}</p>
    <p class="stat__valeur">${pourcent(rapport.resume.niveaux[niveau.cle])}</p>
    ${ecart({ actuel: rapport.resume.niveaux[niveau.cle], precedent: precedent && { valeur: precedent.niveaux[niveau.cle], date: precedent.date } })}
    <p class="stat__legende">${niveau.titre} · ${suites.length} suites</p>
  </div>`,
      )
      .join("");

  document.querySelector("#champ").innerHTML = parNiveau
    .map(({ niveau, suites }) => {
      const grappes = suites
        .map(
          (suite) =>
            `<button class="grappe" type="button" data-suite="${suite.id}" title="${echapper(suite.titre)} · ${pourcent(suite.score)}" aria-label="${echapper(suite.titre)}, ${pourcent(suite.score)}">${suite.cas.map(jaugesCas).join("")}</button>`,
        )
        .join("");
      return `<div class="champ__niveau">
      <div class="champ__etiquette"><strong>${pourcent(moyenne(suites.map((suite) => suite.score)))}</strong>${niveau.numero} · ${niveau.titre}</div>
      <div class="champ__suites">${grappes}</div>
    </div>`;
    })
    .join("");
};

// ---------- Liste des suites ----------

const casVisibles = (suite) => {
  const terme = etat.recherche.trim().toLowerCase();
  const suiteCorrespond =
    terme !== "" &&
    `${suite.niveau} ${suite.groupe} ${suite.titre}`
      .toLowerCase()
      .includes(terme);
  return suite.cas
    .map((cas, index) => ({ cas, index }))
    .filter(({ cas }) => !etat.echecs || cas.score < 0.999)
    .filter(({ cas }) => {
      if (terme === "" || suiteCorrespond) return true;
      const texte = [cas.titre, ...cas.colonnes.map((c) => c.valeur)]
        .join(" ")
        .toLowerCase();
      return texte.includes(terme);
    });
};

const rendreSuite = (suite, visibles) => {
  const nombre = suite.cas.length;
  return `<details class="suite" id="${suite.id}" data-suite="${suite.id}">
    <summary class="suite__tete">
      <span class="suite__nom ${estOutil(suite.titre) ? "suite__nom--outil" : ""}">
        ${CHEVRON}
        <span><span class="suite__libelle">${echapper(suite.titre)}</span>
          <span class="suite__nombre">${nombre} cas${visibles.length !== nombre ? ` · ${visibles.length} affichés` : ""}</span>
        </span>
      </span>
      <span class="suite__bande" aria-hidden="true">${suite.cas.map(jaugesCas).join("")}</span>
      <span class="score" data-etat="${etatAgrege(suite.score)}">${pourcent(suite.score)}</span>
    </summary>
    <div class="suite__corps">
      <p class="suite__fichier">${echapper(suite.fichier)}</p>
      ${visibles
        .map(
          ({
            cas,
            index,
          }) => `<details class="cas" data-suite="${suite.id}" data-cas="${index}">
        <summary class="cas__tete">
          <span class="cas__titre">${echapper(cas.titre)}</span>
          <span class="jauges-cas" aria-hidden="true">${jaugesCas(cas)}</span>
          <span class="pill" data-etat="${etatAgrege(cas.score)}">${pourcent(cas.score)}</span>
        </summary>
        <div class="cas__corps"></div>
      </details>`,
        )
        .join("")}
    </div>
  </details>`;
};

const rendreListe = () => {
  const { rapport } = etat;
  const blocs = NIVEAUX.map((niveau) => {
    const suites = rapport.suites
      .filter((suite) => cleNiveau(suite) === niveau.cle)
      .map((suite) => ({ suite, visibles: casVisibles(suite) }))
      .filter(({ visibles }) => visibles.length > 0);
    if (suites.length === 0) return "";

    const groupes = Map.groupBy(suites, ({ suite }) =>
      [suite.niveau, suite.groupe].filter(Boolean).join(" · "),
    );
    return `<section class="niveau-bloc">
      <div>
        <p class="kicker">${niveau.numero}</p>
        <h3 class="niveau-bloc__titre">${niveau.titre}</h3>
      </div>
      <p class="niveau-bloc__intro">${niveau.texte}</p>
      <div class="tableau">
        <div class="tableau__entete" aria-hidden="true"><span>Suite</span><span>Essais</span><span>Score</span></div>
        ${[...groupes]
          .map(
            ([
              groupe,
              items,
            ]) => `<h4 class="groupe__titre">${echapper(groupe)}</h4>
          ${items.map(({ suite, visibles }) => rendreSuite(suite, visibles)).join("")}`,
          )
          .join("")}
      </div>
    </section>`;
  }).join("");

  document.querySelector("#liste").innerHTML =
    blocs || `<p class="vide">Aucun cas ne correspond à ces filtres.</p>`;
};

// ---------- Détail d'un cas ----------

const rendreColonnes = (colonnes, { variante = "" } = {}) =>
  colonnes.length === 0
    ? ""
    : `<dl class="colonnes ${variante}">${colonnes
        .map(({ libelle, valeur }) => {
          if (COLONNES_MARKDOWN.has(libelle)) {
            return `<dt>${echapper(libelle)}</dt><dd><div class="reponse">${markdown(valeur)}</div></dd>`;
          }
          const classe = COLONNES_CODE.has(libelle) ? ' class="code"' : "";
          return `<dt>${echapper(libelle)}</dt><dd${classe}>${echapper(valeur)}</dd>`;
        })
        .join("")}</dl>`;

const rendreGrille = (cas) => {
  const noms = [
    ...new Set(cas.essais.flatMap((essai) => essai.scores.map((s) => s.nom))),
  ];
  const premierScore = (nom) =>
    cas.essais.flatMap((essai) => essai.scores).find((s) => s.nom === nom);
  return `<div class="grille"><table>
    <caption class="visuellement-cache">Critères, essai par essai</caption>
    <thead><tr><th scope="col">Critère</th>${cas.essais
      .map((_, i) => `<th scope="col" class="cellule">Essai ${i + 1}</th>`)
      .join("")}</tr></thead>
    <tbody>${noms
      .map((nom) => {
        const nature = premierScore(nom)?.nature;
        const pastille = nature
          ? `<span class="pill ${nature === "juge" ? "pill--info" : "pill--neutre"}">${nature === "juge" ? "Jugé" : "Mécanique"}</span>`
          : "";
        return `<tr><th scope="row">${pastille}${echapper(nom)}</th>${cas.essais
          .map((essai, i) => {
            const score = essai.scores.find((s) => s.nom === nom);
            if (!score) return `<td class="cellule">—</td>`;
            return `<td class="cellule"><button type="button" data-essai="${i}" data-critere="${echapper(nom)}" aria-pressed="false" aria-label="Essai ${i + 1}, ${echapper(nom)} : ${pourcent(score.score)}">${jauge(score.score)}${pourcent(score.score)}</button></td>`;
          })
          .join("")}</tr>`;
      })
      .join("")}</tbody>
  </table></div>`;
};

const rendreEssai = (essai) => `
  ${rendreColonnes(essai.colonnes, { variante: "colonnes--essai" })}
  <p class="kicker kicker--muted">Verdicts</p>
  <ul class="verdicts">${essai.scores
    // Les critères ratés d'abord : ce sont eux qu'on vient lire.
    .toSorted((a, b) => a.score - b.score)
    .map(
      (score) => `<li class="verdict" data-critere="${echapper(score.nom)}">
      ${jauge(score.score)}
      <div>
        <div><span class="verdict__nom">${echapper(score.nom)}</span> <span class="verdict__regle">— ${echapper(score.regle)}</span></div>
        <div class="verdict__detail">${echapper(score.detail)}</div>
      </div>
    </li>`,
    )
    .join("")}</ul>`;

const selectionnerEssai = (corps, cas, index, critere = null) => {
  corps.querySelectorAll(".onglet").forEach((onglet, i) => {
    onglet.setAttribute("aria-selected", String(i === index));
    onglet.tabIndex = i === index ? 0 : -1;
  });
  corps.querySelectorAll(".cellule button").forEach((bouton) => {
    const actif =
      Number(bouton.dataset.essai) === index &&
      bouton.dataset.critere === critere;
    bouton.setAttribute("aria-pressed", String(actif));
  });
  const panneau = corps.querySelector(".panneau");
  panneau.innerHTML = rendreEssai(cas.essais[index]);
  if (critere) {
    const verdict = [...panneau.querySelectorAll(".verdict")].find(
      (element) => element.dataset.critere === critere,
    );
    verdict?.classList.add("verdict--en-avant");
    verdict?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
};

const ouvrirCas = (details) => {
  const corps = details.querySelector(".cas__corps");
  const suite = etat.rapport.suites.find((s) => s.id === details.dataset.suite);
  const cas = suite.cas[Number(details.dataset.cas)];

  if (!corps.dataset.rendu) {
    corps.dataset.rendu = "1";
    corps.innerHTML = `
      ${rendreColonnes(cas.colonnes)}
      ${rendreGrille(cas)}
      <div class="onglets" role="tablist" aria-label="Essais">${cas.essais
        .map(
          (essai, i) =>
            `<button class="onglet" role="tab" type="button" data-essai="${i}">Essai ${i + 1} · ${pourcent(essai.score)}</button>`,
        )
        .join("")}</div>
      <div class="panneau" role="tabpanel"></div>`;

    corps.addEventListener("click", (event) => {
      const cible = event.target.closest("[data-essai]");
      if (!cible) return;
      selectionnerEssai(
        corps,
        cas,
        Number(cible.dataset.essai),
        cible.dataset.critere ?? null,
      );
    });
    corps.querySelector(".onglets").addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const onglets = [...corps.querySelectorAll(".onglet")];
      const courant = onglets.findIndex(
        (o) => o.getAttribute("aria-selected") === "true",
      );
      const suivant =
        (courant + (event.key === "ArrowRight" ? 1 : -1) + onglets.length) %
        onglets.length;
      selectionnerEssai(corps, cas, suivant);
      onglets[suivant].focus();
    });

    // On ouvre sur le premier essai imparfait : c'est celui qu'on vient voir.
    const premierImparfait = cas.essais.findIndex(
      (essai) => essai.score < 0.999,
    );
    selectionnerEssai(corps, cas, Math.max(premierImparfait, 0));
  }

  history.replaceState(null, "", `#${suite.id}/${details.dataset.cas}`);
};

// ---------- Navigation ----------

const allerA = (hash, comportement = "smooth") => {
  const [suiteId, casIndex] = decodeURIComponent(hash.replace(/^#/, "")).split(
    "/",
  );
  const suite =
    suiteId &&
    document.querySelector(
      `details.suite[data-suite="${CSS.escape(suiteId)}"]`,
    );
  if (!suite) return;
  suite.open = true;
  let cible = suite;
  if (casIndex !== undefined) {
    const cas = suite.querySelector(
      `details.cas[data-cas="${CSS.escape(casIndex)}"]`,
    );
    if (cas) {
      cas.open = true;
      cible = cas;
    }
  }
  cible.scrollIntoView({ block: "start", behavior: comportement });
};

const brancherEvenements = () => {
  document.querySelector("#liste").addEventListener(
    "toggle",
    (event) => {
      const details = event.target;
      if (!details.open) return;
      if (details.classList.contains("cas")) ouvrirCas(details);
      else if (details.classList.contains("suite")) {
        history.replaceState(null, "", `#${details.dataset.suite}`);
      }
    },
    true,
  );

  document.querySelector("#champ").addEventListener("click", (event) => {
    const grappe = event.target.closest(".grappe");
    if (!grappe) return;
    if (etat.recherche || etat.echecs) {
      etat.recherche = "";
      etat.echecs = false;
      document.querySelector("#recherche").value = "";
      document.querySelector("#echecs").setAttribute("aria-pressed", "false");
      rendreListe();
    }
    allerA(`#${grappe.dataset.suite}`);
  });

  let minuterie;
  document.querySelector("#recherche").addEventListener("input", (event) => {
    clearTimeout(minuterie);
    minuterie = setTimeout(() => {
      etat.recherche = event.target.value;
      rendreListe();
      if (etat.recherche.trim()) {
        document
          .querySelectorAll("details.suite")
          .forEach((suite) => (suite.open = true));
      }
    }, 150);
  });

  document.querySelector("#echecs").addEventListener("click", (event) => {
    etat.echecs = !etat.echecs;
    event.currentTarget.setAttribute("aria-pressed", String(etat.echecs));
    rendreListe();
  });
};

// ---------- Démarrage ----------

// L'historique est un plus : sans lui, la page s'affiche sans les écarts.
const chargerHistorique = async () => {
  try {
    const reponse = await fetch("data/historique.json", { cache: "no-cache" });
    return reponse.ok ? await reponse.json() : [];
  } catch {
    return [];
  }
};

const demarrer = async () => {
  try {
    const reponse = await fetch("data/rapport.json", { cache: "no-cache" });
    if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
    etat.rapport = await reponse.json();
  } catch {
    document.querySelector("#contexte").innerHTML =
      "Aucun run publié pour l'instant. Le rapport se génère à partir des résultats d'Evalite : <code>pnpm eval:rapport &lt;resultats.json&gt;</code>.";
    return;
  }

  rendreEntete({
    rapport: etat.rapport,
    historique: await chargerHistorique(),
  });
  rendreListe();
  brancherEvenements();
  if (location.hash) {
    // Sans attendre les polices, la mise en page bouge encore sous le défilement.
    await document.fonts.ready;
    allerA(location.hash, "instant");
  }
};

// marked et DOMPurify sont chargés en `defer` : on attend qu'ils soient là.
if (document.readyState === "complete") demarrer();
else window.addEventListener("load", demarrer);
