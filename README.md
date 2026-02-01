# PokeClaude

Un jeu de type Pokémon développé en TypeScript avec Phaser 3 et Claude Code.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Phaser](https://img.shields.io/badge/Phaser-8B89CC?style=flat&logo=phaser&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)

## Objectifs

Ce projet a trois objectifs principaux :

1. **Démontrer la puissance de Claude Code** : Prouver qu'il est possible de créer un jeu vidéo complet sans aucune expérience préalable en développement de jeux, uniquement grâce à Claude Code et des prompts bien construits.

2. **Monter en compétences sur les pratiques IA avancées** : Explorer les fonctionnalités avancées de Claude Code (Skills, Hooks, Sub-agents, Tasks, MCP) et développer une expertise sur les meilleures pratiques de l'ingénierie assistée par IA.

3. **Se préparer à l'ère des agents IA** : Développer une posture d'**orchestrateur** plutôt que d'opérateur. Apprendre à déléguer des pans entiers de travail à l'IA, comprendre la structure "sous le capot" (données, architecture), et formuler des intentions claires. La valeur n'est plus dans "savoir où cliquer" mais dans la capacité à concevoir des systèmes et diriger les agents.

> *"Le meilleur moyen d'apprendre, c'est de construire quelque chose."*
>
> *"Fuis les postes où tu es un simple utilisateur d'interface. Cherche à concevoir la logique et à diriger les machines."*

## Fonctionnalités

- **Exploration** : Déplacez-vous dans un monde en pixel art avec WASD ou les flèches
- **Combats tour par tour** : Affrontez des créatures sauvages avec un système de types
- **Capture** : Attrapez des créatures pour agrandir votre équipe
- **Progression** : Gagnez de l'expérience et faites évoluer vos créatures
- **IA Avancée** : NPCs conversationnels et ennemis intelligents propulsés par GPT-5-mini

## Installation

```bash
# Cloner le repository
git clone git@github.com:gabbloquet/pokeclaude.git
cd pokeclaude

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Le jeu sera accessible sur `http://localhost:3000` (ou le port suivant si occupé).

## Configuration IA (Optionnel)

Pour activer les fonctionnalités IA avancées (NPCs conversationnels, ennemis intelligents), créez un fichier `.env.local` :

```bash
VITE_OPENAI_API_KEY=sk-your-key-here
VITE_AI_ENABLED=true
```

Sans clé API, le jeu fonctionne normalement avec des fallbacks (dialogues statiques, agents heuristiques).

## Contrôles

| Touche | Action |
|--------|--------|
| W / ↑ | Se déplacer vers le haut |
| S / ↓ | Se déplacer vers le bas |
| A / ← | Se déplacer vers la gauche |
| D / → | Se déplacer vers la droite |
| Clic | Sélectionner une option en combat |

## Screenshots

### Exploration
Explorez le monde, traversez différents terrains (herbe, chemins, eau) et rencontrez des créatures sauvages dans les hautes herbes.

### Combat
Combattez en tour par tour avec un système de types inspiré de Pokémon. Choisissez vos attaques stratégiquement !

## Créatures

Le jeu inclut 11 créatures réparties en 4 lignées évolutives :

| Starter | Type | Évolutions |
|---------|------|------------|
| Flamling | Feu | Flamero → Flamaster |
| Aqualing | Eau | Aquaro → Aquaster |
| Leafling | Plante | Leafero → Leafaster |
| Sparkit | Électrik | Sparkolt |

## Stack Technique

- **[Phaser 3](https://phaser.io/)** - Framework de jeu HTML5
- **[TypeScript](https://www.typescriptlang.org/)** - Typage statique
- **[Vite](https://vitejs.dev/)** - Bundler ultra-rapide
- **[Zustand](https://zustand-demo.pmnd.rs/)** - State management
- **[Vitest](https://vitest.dev/)** - Tests unitaires
- **[OpenAI API](https://openai.com/)** - IA pour NPCs et génération procédurale

## Structure du Projet

```
pokeclaude/
├── public/assets/       # Sprites et assets graphiques
├── src/
│   ├── config/          # Configuration du jeu
│   ├── data/            # Données (créatures, attaques, maps, NPCs)
│   ├── entities/        # Entités (Player)
│   ├── scenes/          # Scènes Phaser
│   ├── services/ai/     # Service IA (OpenAI, générateurs, validators)
│   ├── systems/         # Systèmes de jeu (combat, capture, dialogue)
│   │   └── battle/agents/  # Agents IA de combat
│   ├── store/           # State management
│   ├── types/           # Types TypeScript
│   └── utils/           # Utilitaires
├── scripts/             # Scripts de génération d'assets
└── tests/               # Tests unitaires
```

## Scripts Disponibles

```bash
npm run dev       # Serveur de développement avec HMR
npm run build     # Build de production
npm run preview   # Prévisualiser le build
npm run test      # Lancer les tests
```

## Génération des Sprites

Les sprites pixel art sont générés programmatiquement :

```bash
node scripts/generateSprites.cjs
```

## Roadmap

- [x] Système d'exploration avec tiles
- [x] Mouvement du joueur avec animation
- [x] Rencontres aléatoires
- [x] Combat tour par tour
- [x] Système de types et dégâts
- [x] Sprites pixel art
- [x] **Intégration IA (OpenAI GPT-5-mini)**
- [x] **Agents de combat intelligents** (Random, Heuristic, LLM)
- [x] **Génération procédurale** (créatures, descriptions, quêtes)
- [x] **NPCs conversationnels** avec personnalités
- [ ] Système de capture complet
- [ ] Inventaire et objets
- [ ] Système d'XP et level up
- [ ] Évolutions
- [ ] Sauvegarde/Chargement
- [ ] Plus de maps et zones
- [ ] Musique et effets sonores

## Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## Licence

MIT

## Crédits

- Développé avec [Claude Code](https://claude.ai/claude-code) par Anthropic
- Inspiré par la série Pokémon de Nintendo/Game Freak
- Sprites générés programmatiquement en pixel art

---

*Fait avec Claude Code*
