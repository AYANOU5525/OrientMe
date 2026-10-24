# OrientaTogo AI 🎓

> **Ton avenir commence par le bon choix.**

Plateforme d'orientation post-BAC par intelligence artificielle pour les nouveaux bacheliers au Togo.

---

## 📋 Description

OrientaTogo AI analyse trois dimensions du profil d'un étudiant :
1. **Performances scolaires** — série du BAC et notes par matière
2. **Compétences personnelles** — ce que l'étudiant sait faire
3. **Aspirations professionnelles** — domaines d'intérêt et métiers souhaités

L'API Google Gemini génère **trois recommandations de filières** personnalisées avec justifications, compétences à renforcer, débouchés et conseils.

---

## 🚀 Lancement rapide

### Prérequis
- Node.js 18+ installé
- Une clé API Google Gemini (obtenue sur [aistudio.google.com](https://aistudio.google.com))

### 1. Configurer la clé Gemini

Édite le fichier `server/.env` :
```
GEMINI_API_KEY=ta_vraie_cle_api_ici
GEMINI_MODEL=gemini-2.0-flash
PORT=3001
```

### 2. Démarrer le serveur (Terminal 1)

```powershell
cd server
npm run dev
```

Le serveur démarre sur **http://localhost:3001**

### 3. Démarrer le client (Terminal 2)

```powershell
cd client
npm run dev
```

L'application est disponible sur **http://localhost:5173**

---

## 🗂️ Structure du projet

```
OrientMe/
├── client/                    # Frontend React + Vite
│   └── src/
│       ├── components/        # Composants réutilisables
│       │   ├── Logo.tsx
│       │   ├── Navbar.tsx
│       │   ├── ProgressBar.tsx
│       │   ├── LoadingScreen.tsx
│       │   └── ErrorCard.tsx
│       ├── pages/             # Pages principales
│       │   ├── AccueilPage.tsx
│       │   ├── FormulaireOrientation.tsx
│       │   └── ResultatsPage.tsx
│       ├── services/
│       │   └── api.ts         # Appels API vers le backend
│       ├── types/
│       │   └── index.ts       # Types TypeScript partagés
│       ├── App.tsx            # Composant racine + navigation
│       └── App.css            # Design system complet
│
└── server/                    # Backend Express + Node.js
    ├── src/
    │   ├── routes/
    │   │   └── orientation.ts # Routes API
    │   ├── services/
    │   │   ├── gemini.ts      # Intégration Gemini API
    │   │   └── demo.ts        # Données de démonstration
    │   ├── data/
    │   │   └── filieres.json  # Catalogue des 15 filières
    │   ├── schemas.ts         # Validation Zod
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

> ⚠️ Ne jamais committer ce fichier. La clé n'est jamais exposée au frontend.

---

## 🎭 Mode Démonstration

Si Gemini n'est pas disponible ou la clé non configurée :
- Un message d'erreur clair s'affiche
- L'utilisateur peut choisir de voir une démonstration avec un profil fictif (Kofi, BAC C)
- Le mode démo est **toujours clairement identifié** comme simulation

---

## 📡 API Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/orientation` | Analyse Gemini du profil |
| GET | `/api/demo` | Résultat de démonstration |
| GET | `/api/filieres` | Catalogue des filières |
| GET | `/health` | Statut du serveur |

---

## ✅ Tests de validation

| Test | Statut |
|------|--------|
| Notes < 0 ou > 20 refusées | ✅ Validation Zod |
| Filières inconnues rejetées | ✅ Vérification contre catalogue |
| Clé Gemini absente du frontend | ✅ Backend uniquement |
| Erreur API = écran blanc | ✅ Gestion des erreurs |
| Parcours mobile | ✅ CSS responsive |
| Timeout 30s Gemini | ✅ Promise.race |

---

## 🏆 Hackathon Togo 2024

Projet réalisé dans le cadre d'un hackathon au Togo pour aider les nouveaux bacheliers à s'orienter vers les filières universitaires et professionnelles adaptées à leur profil.
