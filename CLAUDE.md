# PokeClaude - Guide pour Claude Code

## Description du Projet

PokeClaude est un jeu de type Pokémon développé en TypeScript avec Phaser 3. Le jeu inclut l'exploration d'un monde en pixel art, des combats tour par tour, la capture de créatures et un système de progression.

## Stack Technique

- **Framework de jeu** : Phaser 3.80+
- **Langage** : TypeScript 5.x
- **Bundler** : Vite
- **Tests** : Vitest
- **State Management** : Zustand

## Structure du Projet

```
src/
├── config/          # Configuration Phaser et constantes UI
├── data/            # Données statiques (créatures, attaques, items, maps)
├── entities/        # Entités du jeu (Player)
├── events/          # EventBus et définitions d'événements
├── scenes/          # Scènes Phaser (Boot, Preload, World, Battle)
├── systems/         # Logique métier (battle, capture, progression, save)
├── store/           # State management avec Zustand
├── types/           # Types TypeScript
├── ui/              # Composants UI (dont ui/battle/)
└── utils/           # Fonctions utilitaires

public/assets/
├── sprites/
│   ├── player/      # Spritesheet du joueur (4 directions x 4 frames)
│   ├── creatures/   # Sprites des créatures
│   ├── tiles/       # Tiles de la map (grass, water, path, wall, tallGrass)
│   └── ui/          # Éléments d'interface
└── audio/           # Musiques et effets sonores (à venir)
```

## Commandes Utiles

```bash
npm run dev      # Lancer le serveur de développement
npm run build    # Build de production
npm run test     # Lancer les tests
npm run preview  # Prévisualiser le build
```

## Conventions de Code

- **Scènes** : Une scène par fichier dans `src/scenes/`
- **Systèmes** : Logique métier découplée dans `src/systems/`
- **Types** : Interfaces TypeScript dans `src/types/`
- **Données** : Données statiques (créatures, attaques) dans `src/data/`

## Architecture Event-Driven

Le projet utilise une architecture Event-Driven pour découpler les modules. Un **EventBus** singleton centralise la communication entre composants.

### Fichiers clés

```
src/events/
├── EventBus.ts        # Singleton EventEmitter global
├── BattleEvents.ts    # Définition des événements de combat
└── index.ts           # Exports publics
```

### Utilisation

```typescript
import { EventBus, BATTLE_EVENTS } from '../events';

// Émettre un événement
EventBus.emitBattle(BATTLE_EVENTS.MOVE_SELECTED, { moveId: 1 });

// Écouter un événement
EventBus.onBattle(BATTLE_EVENTS.HP_UPDATE, (payload) => {
  console.log(payload.target, payload.currentHp);
});

// Nettoyer les listeners (important dans destroy())
EventBus.offBattle(BATTLE_EVENTS.HP_UPDATE, this.handleHpUpdate, this);
```

### Événements disponibles

| Catégorie | Événements |
|-----------|------------|
| Actions joueur | `ACTION_SELECTED`, `MOVE_SELECTED`, `BALL_SELECTED`, `ITEM_SELECTED`, `RUN_SELECTED` |
| Combat | `TURN_START`, `TURN_END`, `DAMAGE_DEALT`, `CREATURE_FAINTED`, `BATTLE_END` |
| Capture | `CAPTURE_START`, `CAPTURE_SHAKE`, `CAPTURE_SUCCESS`, `CAPTURE_FAIL` |
| Progression | `EXP_GAINED`, `LEVEL_UP`, `MOVE_LEARNED`, `EVOLUTION_START` |
| UI | `MESSAGE_SHOW`, `MESSAGE_COMPLETE`, `MENU_SHOW`, `HP_UPDATE` |
| Audio | `SFX_PLAY`, `MUSIC_PLAY`, `MUSIC_STOP` |

### Bonnes pratiques

- Toujours nettoyer les listeners dans `destroy()` ou `shutdown()`
- Utiliser les types `BattleEventPayloads` pour le typage fort des payloads
- Les composants UI supportent un mode `useEventBus: true` pour activer l'EventBus
- Debug avec `EventBus.setDebug(true)` pour logger tous les événements

## Génération des Sprites

Les sprites sont générés programmatiquement via le script :
```bash
node scripts/generateSprites.cjs
```

Ce script crée tous les assets pixel art (tiles, joueur, créatures, UI).

## Fonctionnalités Implémentées

- [x] Exploration du monde avec mouvement grille
- [x] Système de collision
- [x] Rencontres aléatoires dans les hautes herbes
- [x] Combat tour par tour avec système de types
- [x] Calcul de dégâts avec STAB et efficacités
- [x] Interface de combat (menus, barres de vie)
- [x] Sprites pixel art pour tiles, joueur et créatures
- [x] Animation de marche du joueur
- [x] Ombre dynamique sous le joueur
- [x] Caméra avec suivi fluide
- [x] Architecture Event-Driven avec EventBus
- [x] UI de combat modulaire (InfoBox, BattleMenus, BattleUIManager)

## Fonctionnalités À Implémenter

- [ ] Système de capture complet avec animation
- [ ] Inventaire fonctionnel (objets, balls)
- [ ] Système d'expérience et level up
- [ ] Évolutions des créatures
- [ ] Sauvegarde/Chargement
- [ ] NPCs et dialogues
- [ ] Plus de zones et maps
- [ ] Audio (musiques et SFX)

## Créatures Disponibles

| ID | Nom | Type(s) | Évolution |
|----|-----|---------|-----------|
| 1 | Flamling | Feu | → Flamero (Nv.16) |
| 2 | Flamero | Feu | → Flamaster (Nv.36) |
| 3 | Flamaster | Feu/Vol | - |
| 4 | Aqualing | Eau | → Aquaro (Nv.16) |
| 5 | Aquaro | Eau | → Aquaster (Nv.36) |
| 6 | Aquaster | Eau | - |
| 7 | Leafling | Plante | → Leafero (Nv.16) |
| 8 | Leafero | Plante/Poison | → Leafaster (Nv.32) |
| 9 | Leafaster | Plante/Poison | - |
| 10 | Sparkit | Électrik | → Sparkolt (Nv.26) |
| 11 | Sparkolt | Électrik | - |

## Notes pour le Développement

- Les tiles font 32x32 pixels
- Le joueur spawn au centre de la map de test
- Les combats se déclenchent avec 15% de chance par pas dans les hautes herbes
- Le système de types suit les efficacités classiques Pokémon
