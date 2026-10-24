# Orienteme 🎓

> **Ton avenir commence par le bon choix.**

Plateforme d'orientation post-BAC par intelligence artificielle pour les nouveaux bacheliers au Togo.

---

## 📋 Description

Orienteme analyse le profil d'un étudiant :
1. **Performances scolaires** — série du BAC et notes par matière
2. **Compétences personnelles** — ce que l'étudiant sait faire
3. **Aspirations professionnelles** — domaines d'intérêt et métiers souhaités
4. **Personnalité** (facultatif) — un mini-questionnaire de 6 questions rapides

L'intelligence artificielle génère **trois recommandations de filières** personnalisées, choisies dans un catalogue de **23 filières**, avec justifications, compétences à renforcer, débouchés et conseils. Pour chaque filière, l'étudiant voit **où l'étudier au Togo** (liste d'écoles vérifiée à la main, avec sources).

Ensuite, l'étudiant peut :
- **comparer deux filières** côte à côte (durée, prérequis, matières clés avec ses notes, débouchés, écoles) ;
- **poser ses questions** à Orienteme dans une discussion ;
- **choisir sa filière** et recevoir un **plan de rentrée** : ce qu'il doit maîtriser avant la rentrée, un plan par étapes pour les vacances et des ressources gratuites ;
- **partager** ses résultats ou son plan sur WhatsApp, et les **retrouver** plus tard (sauvegarde dans son navigateur).

Les conseillers d'orientation disposent d'un **espace conseillers** avec des statistiques anonymes.

> **Toute orientation est générée par l'IA.** Aucun résultat préenregistré n'est jamais affiché. Le modèle utilisé (Gemma, via l'API Gemini) n'est mentionné nulle part dans l'interface ; il n'apparaît que dans la configuration technique ci-dessous.

---

## 🚀 Lancement rapide

### Prérequis
- Node.js 18+ installé
- Une clé API Google AI Studio (obtenue sur [aistudio.google.com/apikey](https://aistudio.google.com/apikey))

### 1. Installer les dépendances

```powershell
npm run install:all
```

### 2. Configurer la clé

Copie `server/.env.example` en `server/.env` (et **pas** dans `.env.example`, qui est publié sur GitHub), puis renseigne ta clé :

```env
GEMINI_API_KEY=ta_vraie_cle_api_ici
GEMINI_MODEL=gemma-4-26b-a4b-it
GEMINI_FALLBACK_MODELS=gemma-4-31b-it
PORT=3001
ADMIN_TOKEN=un-mot-de-passe-long-pour-les-conseillers
```

`server/.env` n'est lu qu'au démarrage : redémarre le serveur après l'avoir modifié.

### 3. Démarrer le serveur (Terminal 1)

```powershell
cd server
npm run dev
```

### 4. Démarrer le client (Terminal 2)

```powershell
cd client
npm run dev
```

L'application est disponible sur **http://localhost:5173**. En développement, Vite relaie les appels `/api` vers le serveur (port 3001).

---

## 🌍 Mise en ligne (Render, gratuit)

Le fichier `render.yaml` décrit un service unique : le serveur Express distribue l'API **et** l'interface compilée.

1. Crée un compte sur [render.com](https://render.com) et connecte ton compte GitHub.
2. **New + → Blueprint**, puis choisis le dépôt `OrientMe` (branche `main`).
3. Render demande la valeur de **`GEMINI_API_KEY`** : colle ta clé. `ADMIN_TOKEN` (mot de passe des conseillers) est généré automatiquement ; tu le retrouves dans l'onglet **Environment** du service.
4. Après le déploiement, l'application est disponible sur `https://orienteme.onrender.com` (ou l'adresse indiquée par Render).

À savoir sur l'offre gratuite de Render :
- le service s'endort après 15 minutes sans visite ; le premier chargement suivant prend environ une minute ;
- le disque n'est pas conservé entre deux déploiements : les statistiques de l'espace conseillers repartent de zéro à chaque mise à jour (un disque persistant payant ou une base de données règle ce point).

En local, la même version de production se lance avec `npm run build` puis `npm start` (http://localhost:3001).

---

## 🏫 Écoles au Togo

`server/src/data/etablissements.json` liste 26 établissements (publics, inter-États et privés reconnus) rattachés aux filières du catalogue, chacun avec sa **source**. Ils ont été vérifiés en octobre 2026 à partir des annonces de concours 2026-2027 et de fiches publiques, par exemple :
- Université de Lomé : FSS (médecine, pharmacie), ESTBA, ISICA, FASEG, IUT de Gestion, ESA, Faculté de Droit, Faculté des Sciences, INSE ;
- Université de Kara : FSS, FAST, FaSEG, FDSP, ISMA ;
- École Nationale Polytechnique (ENP, ex-EPL) à Lomé et à Kara ; ENAM et ENSF dans six villes ; INFA de Tové ; ENS d'Atakpamé ;
- EAMAU (architecture, inter-États) ; ESGIS, IPNET Institute of Technology, Lomé Business School, ESTH Stella Matutina, Hôtel École La Savoureuse (privés).

**L'IA ne génère jamais de nom d'école** : la liste vient uniquement de ce fichier, et la discussion a pour consigne de ne citer que ces établissements. Les filières et dates de concours changent chaque année : mets ce fichier à jour à chaque rentrée (un test vérifie que chaque école cite sa source et que chaque filière a au moins une école).

---

## 🤖 Intégration de l'IA (Gemma via l'API Gemini)

| Variable (`server/.env`) | Défaut | Rôle |
|---|---|---|
| `GEMINI_API_KEY` | — | Clé Google AI Studio (obligatoire) |
| `GEMINI_MODEL` | `gemma-4-26b-a4b-it` | Modèle principal (Gemma obligatoire, sinon le serveur refuse de démarrer) |
| `GEMINI_FALLBACK_MODELS` | `gemma-4-31b-it` | Modèles de secours Gemma, séparés par des virgules (vide = aucun) |
| `GEMINI_TIMEOUT_MS` | `60000` | Budget total d'une réponse, tous modèles confondus |
| `GEMINI_THINKING_LEVEL` | `minimal` | Réflexion du modèle. `high` fait passer Gemma 4 de ~20 s à 45-110 s par réponse |
| `ADMIN_TOKEN` | — | Mot de passe de l'espace conseillers (vide = espace désactivé) |
| `TRUST_PROXY` | — | `1` derrière un hébergeur (Render…) pour lire la vraie IP des visiteurs |
| `STATS_FILE` | `server/data/stats.jsonl` | Fichier des statistiques anonymes |
| `CORS_ORIGINS` | ports localhost de Vite | Origines autorisées, séparées par des virgules |

Trois tâches utilisent le même moteur (`server/src/services/gemini.ts`) : l'**orientation** (~20 s), le **plan de rentrée** (~20 s) et la **discussion** (~4 s).
1. **Prompt** : les règles, le catalogue détaillé (description, matières clés, compétences utiles, prérequis, durée) et, pour la discussion, les écoles vérifiées sont envoyés en instruction système. Le prénom n'est jamais transmis au modèle.
2. **Sortie JSON** : le mode JSON natif est demandé, **sans schéma imposé** : avec un schéma, Gemma 4 tombe dans des boucles de répétition jusqu'à la limite de jetons. Si un modèle refuse le mode JSON ou l'instruction système (cas de Gemma 3), le serveur bascule automatiquement sur un JSON guidé par le prompt.
3. **Validation** : la réponse est extraite (même entourée de Markdown ou d'un tableau), validée par Zod, puis vérifiée contre le catalogue (3 filières distinctes et existantes).
4. **Auto-correction** : si la réponse est invalide, la raison est renvoyée au modèle, qui a une seconde chance.
5. **Secours** : en cas de quota épuisé (429), de surcharge (5xx), de modèle introuvable (404) ou de réponse toujours invalide, le modèle suivant prend le relais.
6. **Fiche filière** : nom officiel, description, prérequis, durée, matières clés et écoles viennent du catalogue. Le choix, la justification, les compétences, les débouchés et les conseils viennent uniquement de l'IA.

---

## 📊 Espace conseillers

Adresse : `…/#conseillers` (lien « Espace conseillers » en bas de la page d'accueil), protégé par `ADMIN_TOKEN`.

Il affiche le nombre d'orientations et de plans de rentrée, la part d'élèves qui jugent les recommandations utiles (avis 👍/👎 en bas des résultats), les orientations par jour, les filières les plus recommandées et les plus choisies, les séries du BAC et les domaines d'intérêt. **Aucune donnée personnelle n'est enregistrée** : ni prénom, ni notes, ni texte libre — seulement la série du BAC, les domaines cochés et les identifiants de filières.

---

## 🗂️ Structure du projet

```
OrientMe/
├── render.yaml                    # Déploiement Render (un seul service)
├── client/                        # Frontend React + Vite
│   └── src/
│       ├── components/            # Logo, Navbar, ProgressBar, LoadingScreen, ErrorCard,
│       │                          # ListeEtablissements, ComparateurFilieres, ChatOrienteme
│       ├── pages/                 # Accueil, Formulaire (4 étapes), Résultats, Préparation, Conseillers
│       ├── services/
│       │   ├── api.ts             # Appels API + traduction des erreurs serveur
│       │   └── partage.ts         # Textes et lien de partage WhatsApp
│       ├── types/index.ts         # Types partagés, questionnaire de personnalité, profil exemple
│       ├── App.tsx                # Navigation, sauvegarde dans le navigateur
│       └── App.css                # Design system complet
│
└── server/                        # Backend Express + Node.js
    ├── src/
    │   ├── config.ts              # Lecture et valeurs par défaut de server/.env
    │   ├── catalog.ts             # Filières et établissements
    │   ├── errors.ts              # Erreurs métier (code + statut HTTP)
    │   ├── schemas.ts             # Validation Zod (requêtes et réponses IA)
    │   ├── middleware/rateLimit.ts # 20 appels à l'IA / minute / IP
    │   ├── routes/orientation.ts  # Routes API
    │   ├── services/
    │   │   ├── gemini.ts          # Moteur IA : secours, auto-correction, timeout
    │   │   ├── prompt.ts          # Consignes et prompts des trois tâches
    │   │   ├── parsing.ts         # Extraction, validation et enrichissement
    │   │   ├── stats.ts           # Statistiques anonymes
    │   │   └── exemple.fixture.ts # Réponses de référence pour les tests (hors build)
    │   ├── data/
    │   │   ├── filieres.json      # Catalogue des 23 filières
    │   │   └── etablissements.json # Écoles du Togo, avec sources
    │   └── index.ts               # Serveur Express (+ interface compilée en production)
    ├── .env                       # ⚠️ Contient ta clé (ignoré par Git)
    └── .env.example               # Modèle de configuration
```

---

## 📡 API Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/orientation` | Analyse du profil par l'IA |
| POST | `/api/preparation` | Plan de rentrée pour la filière choisie (`{ profil, filiereId, competencesARenforcer }`) |
| POST | `/api/chat` | Question de l'étudiant (`{ profil, recommandations, historique, question }`) |
| POST | `/api/avis` | Avis anonyme « Ces recommandations t'aident-elles ? » (`{ utile: true/false }`) |
| GET | `/api/filieres` | Catalogue des filières, avec leurs écoles |
| GET | `/api/stats` | Statistiques anonymes (en-tête `Authorization: Bearer <ADMIN_TOKEN>`) |
| GET | `/health` | Statut du serveur et de la configuration IA |

En cas d'erreur, la réponse a la forme `{ "success": false, "code": "...", "message": "..." }` :

| Code | HTTP | Signification |
|---|---|---|
| `INVALID_INPUT` | 400 | Données invalides (détails par champ dans `details`) |
| `RATE_LIMITED` | 429 | Plus de 20 appels à l'IA par minute depuis la même IP |
| `UNAUTHORIZED` | 401 | Mot de passe de l'espace conseillers incorrect |
| `STATS_DISABLED` | 503 | `ADMIN_TOKEN` non défini sur le serveur |
| `AI_NOT_CONFIGURED` | 503 | Clé absente, invalide ou sans accès au modèle |
| `AI_QUOTA` | 429 | Quota de l'API épuisé sur tous les modèles |
| `AI_TIMEOUT` | 504 | Budget `GEMINI_TIMEOUT_MS` dépassé |
| `AI_INVALID_RESPONSE` | 502 | Réponse inexploitable malgré la correction et les secours |
| `AI_UNAVAILABLE` | 502 | Autre erreur de l'API |

---

## ✅ Tests

```powershell
npm test
```

Les tests (`server/src/**/*.test.ts`, runner natif de Node) simulent l'API : bascule de modèle, auto-correction, timeout, refus du mode JSON ou de l'instruction système, plan de rentrée, discussion, personnalité, statistiques, et cohérence du catalogue et des écoles.

| Test | Statut |
|------|--------|
| Notes < 0 ou > 20 refusées | ✅ Validation Zod |
| Filières inconnues ou en double rejetées | ✅ Vérification contre catalogue + auto-correction |
| Chaque filière a une école, chaque école une source | ✅ Test du catalogue |
| Clé API absente du frontend | ✅ Backend uniquement |
| Erreur API ≠ écran blanc | ✅ Codes d'erreur + écran dédié |
| Parcours mobile | ✅ CSS responsive, sans débordement horizontal |
| Timeout | ✅ AbortController (60 s par défaut) |

---

## 🏆 Projet de hackathon

Projet réalisé dans le cadre d'un hackathon au Togo pour aider les nouveaux bacheliers à s'orienter vers les filières universitaires et professionnelles adaptées à leur profil.
