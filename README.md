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
| `GEMINI_MODEL` | `gemma-4-26b-a4b-it` | Modèle principal |
| `GEMINI_FALLBACK_MODELS` | `gemma-4-31b-it` | Modèles de secours, séparés par des virgules (vide = aucun) |
| `GEMINI_TIMEOUT_MS` | `60000` | Budget total d'une analyse, tous modèles confondus |
| `GEMINI_THINKING_LEVEL` | — | Optionnel : `minimal` ou `high` (réflexion du modèle) |
| `CORS_ORIGINS` | ports localhost de Vite | Origines autorisées, séparées par des virgules |

Déroulement d'une analyse (`server/src/services/gemini.ts`) :
1. **Prompt** : les règles et le catalogue détaillé (description, matières clés, compétences utiles, prérequis) sont envoyés en instruction système ; le profil de l'étudiant en message utilisateur. Le prénom n'est jamais transmis au modèle.
2. **Sortie JSON** : le mode JSON natif est demandé avec un schéma qui restreint `filiereId` aux identifiants du catalogue. Si un modèle refuse le mode JSON ou l'instruction système (cas de certains modèles Gemma), le serveur bascule automatiquement sur un JSON guidé par le prompt et mémorise ce choix.
3. **Validation** : la réponse est extraite (même entourée de Markdown), validée par Zod, puis vérifiée contre le catalogue (3 filières distinctes et existantes).
4. **Auto-correction** : si la réponse est invalide, la raison est renvoyée au modèle, qui a une seconde chance.
5. **Secours** : en cas de quota épuisé (429), de surcharge (5xx), de modèle introuvable (404) ou de réponse toujours invalide, le modèle suivant de `GEMINI_FALLBACK_MODELS` prend le relais.
6. **Enrichissement** : le nom officiel, la description et les prérequis de chaque filière sont ajoutés depuis le catalogue.

---

## 🗂️ Structure du projet

```
OrientMe/
├── client/                    # Frontend React + Vite
│   └── src/
│       ├── components/        # Logo, Navbar, ProgressBar, LoadingScreen, ErrorCard
│       ├── pages/             # AccueilPage, FormulaireOrientation, ResultatsPage
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
    │   │   └── demo.ts        # Données de démonstration
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

## 🎭 Mode Démonstration

Si l'IA n'est pas disponible ou la clé non configurée :
- Un message d'erreur clair s'affiche
- L'utilisateur peut choisir de voir une démonstration avec un profil fictif (Kofi, BAC C)
- Le mode démo est **toujours clairement identifié** comme simulation

---

## 📡 API Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/orientation` | Analyse du profil par Gemma |
| GET | `/api/demo` | Résultat de démonstration |
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

## 🏆 Hackathon Togo 2026

Projet réalisé dans le cadre d'un hackathon au Togo pour aider les nouveaux bacheliers à s'orienter vers les filières universitaires et professionnelles adaptées à leur profil.
