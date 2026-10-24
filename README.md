# OrientaTogo AI 🎓

> **Ton avenir commence par le bon choix.**

Plateforme d'orientation post-BAC par intelligence artificielle pour les nouveaux bacheliers au Togo.

---

## 📋 Description

OrientaTogo AI analyse trois dimensions du profil d'un étudiant :
1. **Performances scolaires** — série du BAC et notes par matière
2. **Compétences personnelles** — ce que l'étudiant sait faire
3. **Aspirations professionnelles** — domaines d'intérêt et métiers souhaités

Le modèle **Gemma 4**, servi par l'**API Google Gemini**, génère **trois recommandations de filières** personnalisées, choisies dans un catalogue de 15 filières, avec justifications, compétences à renforcer, débouchés et conseils.

Une fois sa filière choisie, l'étudiant reçoit de Gemma un **plan de rentrée** personnalisé : ce qu'il doit maîtriser avant la rentrée, un plan par étapes pour les vacances et des ressources gratuites.

> **Toute orientation passe par Gemma.** Aucun résultat préenregistré n'est jamais affiché, et le serveur refuse de démarrer si un modèle autre que Gemma est configuré.

---

## 🚀 Lancement rapide

### Prérequis
- Node.js 18+ installé
- Une clé API Google AI Studio (obtenue sur [aistudio.google.com/apikey](https://aistudio.google.com/apikey))

### 1. Installer les dépendances

```powershell
npm run install:all
```

### 2. Configurer la clé Gemini

Copie `server/.env.example` en `server/.env` puis renseigne ta clé :

```env
GEMINI_API_KEY=ta_vraie_cle_api_ici
GEMINI_MODEL=gemma-4-26b-a4b-it
GEMINI_FALLBACK_MODELS=gemma-4-31b-it
PORT=3001
```

### 3. Démarrer le serveur (Terminal 1)

```powershell
cd server
npm run dev
```

Le serveur démarre sur **http://localhost:3001**

### 4. Démarrer le client (Terminal 2)

```powershell
cd client
npm run dev
```

L'application est disponible sur **http://localhost:5173**. En développement, Vite relaie les appels `/api` vers le serveur : aucune URL à configurer.

---

## 🤖 Intégration Gemma (API Gemini)

| Variable (`server/.env`) | Défaut | Rôle |
|---|---|---|
| `GEMINI_API_KEY` | — | Clé Google AI Studio (obligatoire hors démo) |
| `GEMINI_MODEL` | `gemma-4-26b-a4b-it` | Modèle principal (Gemma obligatoire) |
| `GEMINI_FALLBACK_MODELS` | `gemma-4-31b-it` | Modèles de secours Gemma, séparés par des virgules (vide = aucun) |
| `GEMINI_TIMEOUT_MS` | `60000` | Budget total d'une analyse, tous modèles confondus |
| `GEMINI_THINKING_LEVEL` | `minimal` | Réflexion du modèle. `high` fait passer Gemma 4 de ~20 s à 45-110 s par réponse |
| `CORS_ORIGINS` | ports localhost de Vite | Origines autorisées, séparées par des virgules |

Déroulement d'une analyse (`server/src/services/gemini.ts`) :
1. **Prompt** : les règles et le catalogue détaillé (description, matières clés, compétences utiles, prérequis) sont envoyés en instruction système ; le profil de l'étudiant en message utilisateur. Le prénom n'est jamais transmis au modèle.
2. **Sortie JSON** : le mode JSON natif est demandé, **sans schéma imposé** : avec un schéma, Gemma 4 tombe dans des boucles de répétition jusqu'à la limite de jetons ; sans schéma, il répond en ~20 s. Si un modèle refuse le mode JSON ou l'instruction système (cas de Gemma 3), le serveur bascule automatiquement sur un JSON guidé par le prompt et mémorise ce choix.
3. **Validation** : la réponse est extraite (même entourée de Markdown), validée par Zod, puis vérifiée contre le catalogue (3 filières distinctes et existantes).
4. **Auto-correction** : si la réponse est invalide, la raison est renvoyée au modèle, qui a une seconde chance.
5. **Secours** : en cas de quota épuisé (429), de surcharge (5xx), de modèle introuvable (404) ou de réponse toujours invalide, le modèle suivant de `GEMINI_FALLBACK_MODELS` prend le relais.
6. **Fiche filière** : le nom officiel, la description et les prérequis de chaque filière choisie par Gemma sont ajoutés depuis le catalogue. Le choix, la justification, les compétences, les débouchés et les conseils viennent uniquement de Gemma.

---

## 🗂️ Structure du projet

```
OrientMe/
├── client/                    # Frontend React + Vite
│   └── src/
│       ├── components/        # Logo, Navbar, ProgressBar, LoadingScreen, ErrorCard
│       ├── pages/             # AccueilPage, FormulaireOrientation, ResultatsPage, PreparationPage
│       ├── services/api.ts    # Appels API + traduction des erreurs serveur
│       ├── types/index.ts     # Types TypeScript partagés
│       ├── App.tsx            # Composant racine + navigation
│       └── App.css            # Design system complet
│
└── server/                    # Backend Express + Node.js
    ├── src/
    │   ├── config.ts          # Lecture et valeurs par défaut de server/.env
    │   ├── catalog.ts         # Catalogue des filières
    │   ├── errors.ts          # Erreurs métier (code + statut HTTP)
    │   ├── schemas.ts         # Validation Zod (requête et réponse IA)
    │   ├── middleware/
    │   │   └── rateLimit.ts   # Limitation : 10 analyses / minute / IP
    │   ├── routes/
    │   │   └── orientation.ts # Routes API
    │   ├── services/
    │   │   ├── gemini.ts      # Appel Gemma : secours, auto-correction, timeout
    │   │   ├── prompt.ts      # Instruction système, prompt, schéma JSON
    │   │   ├── parsing.ts     # Extraction, validation et enrichissement
    │   │   └── exemple.fixture.ts # Réponse de référence pour les tests (hors build)
    │   ├── data/
    │   │   └── filieres.json  # Catalogue des 15 filières
    │   └── index.ts           # Serveur Express
    ├── .env                   # ⚠️ Contient ta clé Gemini (ne pas partager)
    └── .env.example           # Modèle de configuration
```

---

## 🔑 Où mettre la clé Gemini

**Fichier :** `server/.env`

```env
GEMINI_API_KEY=AIzaSy...ta_cle...
```

> ⚠️ Ne jamais committer ce fichier (il est ignoré par Git). La clé n'est jamais exposée au frontend.

---

## 🎒 Plan de rentrée

Sur la page de résultats, chaque recommandation a un bouton **« Je choisis cette filière »** (aussi présent dans la fenêtre de détails). Gemma reçoit alors le profil de l'étudiant, la fiche de la filière et les compétences à renforcer identifiées lors de l'orientation, et renvoie :
- **Ce qu'il faut maîtriser avant la rentrée** : 3 à 5 points prioritaires, avec pourquoi et comment progresser ;
- **Un plan d'ici la rentrée** : 3 ou 4 étapes (« Semaines 1 et 2 »…) faisables gratuitement, avec un smartphone ;
- **Des ressources gratuites** : Gemma a pour consigne de ne nommer que des ressources dont il est certain, sinon d'en décrire le type, et de ne donner aucune URL ;
- **Un mot d'encouragement**.

La page est imprimable et permet de revenir aux recommandations pour comparer une autre filière.

## 🧪 Profil exemple

Le bouton **« Remplir avec un profil exemple (Kofi, BAC C) »** de la première étape pré-remplit le formulaire, pratique pour une présentation. L'analyse est ensuite faite par Gemma, comme pour n'importe quel profil.

Si Gemma n'est pas disponible (clé absente, quota, délai), un message d'erreur clair s'affiche : aucun résultat de substitution n'est proposé.

---

## 📡 API Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/orientation` | Analyse du profil par Gemma |
| POST | `/api/preparation` | Plan de rentrée Gemma pour la filière choisie (`{ profil, filiereId, competencesARenforcer }`) |
| GET | `/api/filieres` | Catalogue des filières |
| GET | `/health` | Statut du serveur et de la configuration IA |

En cas d'erreur, la réponse a la forme `{ "success": false, "code": "...", "message": "..." }` :

| Code | HTTP | Signification |
|---|---|---|
| `INVALID_INPUT` | 400 | Profil invalide (détails par champ dans `details`) |
| `RATE_LIMITED` | 429 | Plus de 10 analyses par minute depuis la même IP |
| `AI_NOT_CONFIGURED` | 503 | Clé absente, invalide ou sans accès au modèle |
| `AI_QUOTA` | 429 | Quota de l'API Gemini épuisé sur tous les modèles |
| `AI_TIMEOUT` | 504 | Budget `GEMINI_TIMEOUT_MS` dépassé |
| `AI_INVALID_RESPONSE` | 502 | Réponse inexploitable malgré la correction et les secours |
| `AI_UNAVAILABLE` | 502 | Autre erreur de l'API |

---

## ✅ Tests

```powershell
npm test
```

Les tests (`server/src/**/*.test.ts`, runner natif de Node) simulent l'API Gemini : bascule de modèle, auto-correction, timeout, refus du mode JSON ou de l'instruction système, validation du catalogue.

| Test | Statut |
|------|--------|
| Notes < 0 ou > 20 refusées | ✅ Validation Zod |
| Filières inconnues ou en double rejetées | ✅ Vérification contre catalogue + auto-correction |
| Clé Gemini absente du frontend | ✅ Backend uniquement |
| Erreur API ≠ écran blanc | ✅ Codes d'erreur + écran dédié |
| Parcours mobile | ✅ CSS responsive |
| Timeout Gemma | ✅ AbortController (60 s par défaut) |

---

## 🏆 Hackathon Togo 2024

Projet réalisé dans le cadre d'un hackathon au Togo pour aider les nouveaux bacheliers à s'orienter vers les filières universitaires et professionnelles adaptées à leur profil.
