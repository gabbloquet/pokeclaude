# PokeClaude - Roadmap de Développement

a> **Progression globale : ~62%**

---

## PRIORITE HAUTE - Core Gameplay

### MODULE A : Système de Combat Avancé (100%)
> Dépendances : Aucune (combat de base existe)

- [x] **A1** - Système de statuts (Paralysie, Sommeil, Poison, Brûlure, Gel)
  - Fichiers : `src/systems/battle/StatusSystem.ts` (352 lignes)
  - Effets en combat + dégâts de fin de tour
  - Immunités de types (Feu immune brûlure, Électrik immune paralysie, etc.)

- [x] **A2** - Attaques avec effets secondaires
  - Fichiers : `src/data/moves/moves.ts`, `src/systems/battle/MoveEffects.ts` (266 lignes)
  - Boost/debuff stats, drain PV, recul, multi-hit, heal

- [x] **A3** - Coups critiques
  - Fichier : `src/utils/battleUtils.ts`
  - Formule Gen 1 basée sur vitesse, multiplicateur x2
  - Liste de 13 attaques à haut taux critique

- [x] **A4** - Précision et esquive
  - Fichier : `src/utils/battleUtils.ts`
  - Stages -6 à +6, calcul de touche complet

### MODULE B : Système de Capture (100%)
> Dépendances : Aucune

- [x] **B1** - Formule de capture complète
  - Fichier : `src/systems/capture/CaptureSystem.ts` (414 lignes)
  - Formule Gen 3 avec PV restants, statut, taux espèce, type de ball

- [x] **B2** - Types de Poké Balls (10 variantes)
  - Fichier : `src/data/items/balls.ts` (178 lignes)
  - Poké Ball, Super, Hyper, Master, Filet, Sombre, Rapide, Chrono, Luxe, Bis

- [x] **B3** - Animation de capture
  - Fichier : `src/scenes/BattleScene.ts`
  - Ball lancée, secousses (1-4), capture/échec, captures critiques

- [x] **B4** - Surnom du Pokémon capturé
  - Validation (max 12 caractères, pas de caractères spéciaux)

### MODULE C : Progression (XP/Evolution) (100%)
> Dépendances : Aucune

- [x] **C1** - Système d'expérience
  - Fichier : `src/systems/progression/ExperienceSystem.ts` (313 lignes)
  - 4 courbes (fast, mediumFast, mediumSlow, slow), cap niveau 100

- [x] **C2** - Level Up et apprentissage d'attaques
  - Fichier : `src/systems/progression/LevelUpSystem.ts`
  - Notification nouveau niveau, choix attaque si > 4
  - Scène dédiée : `src/scenes/MoveLearnScene.ts`

- [x] **C3** - Evolutions par niveau
  - Fichier : `src/systems/progression/EvolutionSystem.ts` (344 lignes)
  - Animation évolution, annulation possible
  - Scène dédiée : `src/scenes/EvolutionScene.ts`

- [ ] **C4** - Evolutions spéciales
  - Structure en place mais non fonctionnel
  - TODO: Pierre d'évolution, échange, bonheur

---

## PRIORITE MOYENNE - Systèmes Secondaires

### MODULE D : Inventaire et Objets (100%)
> Dépendances : Aucune

- [x] **D1** - Système d'inventaire (structure)
  - Fichiers : `src/store/gameStore.ts` (162 lignes)
  - Catégories : Objets, Balls définies

- [x] **D2** - Objets de soin (données)
  - Fichier : `src/data/items/items.ts` (323 lignes)
  - Potions (4 types), Rappels, soins statuts (6 types)
  - Pierres d'évolution (10 types)

- [x] **D3** - Utilisation en combat
  - Fichiers : `src/systems/battle/ItemSystem.ts`, `src/ui/battle/BattleMenus.ts`
  - Menu objets en combat, consomme le tour
  - Tests unitaires : `src/tests/itemSystem.test.ts` (44 tests)

- [x] **D4** - Utilisation hors combat
  - Fichiers : `src/systems/items/OverworldItemSystem.ts`, `src/scenes/PauseMenuScene.ts`
  - Menu pause (P ou ESC) avec gestion équipe et objets
  - Soigner les créatures avec potions et soins de statut
  - Tests unitaires : `src/tests/overworldItemSystem.test.ts` (24 tests)

### MODULE E : Equipe et Stockage PC (100%)
> Dépendances : B (Capture)

- [x] **E1** - Gestion équipe (6 max)
  - Fichier : `src/store/gameStore.ts`
  - Réorganiser, débordement auto vers PC

- [x] **E2** - Système PC (Boîtes de stockage)
  - Stockage illimité, déplacements équipe ↔ PC

- [ ] **E3** - UI du PC
  - Fichier : `src/ui/PCInterface.ts`
  - Navigation boîtes, aperçu Pokémon

### MODULE F : NPCs et Dialogues (10%)
> Dépendances : Aucune

- [ ] **F1** - Système de dialogues
  - Types définis dans `src/types/game.types.ts`
  - TODO: Textbox avec défilement, choix multiples

- [ ] **F2** - NPCs basiques
  - Types NPC définis (id, name, spriteKey, position, direction, dialogId, isTrainer, team)
  - TODO: Sprites, zone d'interaction, logique

- [ ] **F3** - Combat contre dresseurs
  - TODO: Déclenchement par ligne de vue, dialogue avant/après
  - Fichier prévu : `src/systems/battle/TrainerBattle.ts`

- [ ] **F4** - Marchands (PokéMart)
  - TODO: Acheter/Vendre objets

### MODULE G : HM et Exploration (0%)
> Dépendances : F (NPCs pour obtenir HMs)

- [ ] **G1** - Système HM/CT
  - Fichiers prévus : `src/data/moves/hm.ts`, `src/systems/moves/HMSystem.ts`
  - Coupe, Surf, Force, Flash, Vol

- [ ] **G2** - Obstacles HM sur la map
  - Arbres (Coupe), rochers (Force), eau (Surf)

- [ ] **G3** - Vol (téléportation)
  - Menu villes visitées, animation vol

---

## PRIORITE BASSE - Contenu et Polish

### MODULE H : Arènes et Progression Histoire (0%)
> Dépendances : F (NPCs), A (Combat)

- [ ] **H1** - Structure des arènes
  - Puzzles, dresseurs, champion

- [ ] **H2** - Système de badges
  - Fichier prévu : `src/store/progressStore.ts`
  - Débloquer HMs, obéissance niveau

- [ ] **H3** - Team Rocket (événements)
  - Scénario, donjons spéciaux

- [ ] **H4** - Conseil des 4 + Champion
  - Combat enchaînés sans soin entre

### MODULE I : Safari Zone (0%)
> Dépendances : B (Capture)

- [ ] **I1** - Règles Safari
  - Pas de combat, lancer cailloux/appâts
  - Limite de pas, Safari Balls uniquement

### MODULE J : Audio (5%)
> Dépendances : Aucune

- [ ] **J1** - Musiques
  - Config volume en place dans SaveSystem
  - TODO: Thèmes : Monde, Combat sauvage, Combat dresseur, Victoire

- [ ] **J2** - Effets sonores
  - TODO: Attaques, capture, menus, level up

### MODULE K : Sauvegarde (100%)
> Dépendances : Tous les stores

- [x] **K1** - Système de sauvegarde
  - Fichier : `src/systems/save/SaveSystem.ts` (134 lignes)
  - LocalStorage, sérialisation état complet, validation

- [x] **K2** - Chargement et nouveau jeu
  - Détection sauvegarde existante, suppression possible
  - Paramètres : volume, vitesse texte, animations combat

---

## Données Existantes

### Créatures (src/data/creatures/)
```
Implémentées : 11 créatures (3 lignes de starters + 1 ligne électrik)
Cible : 30-50 créatures
- 3 lignes de starters (9 créatures) ✓
- 5-6 lignes communes (15-20 créatures) - À faire
- 2-3 légendaires (3 créatures) - À faire
```

### Attaques (src/data/moves/)
```
Fichier : src/data/moves/moves.ts (740 lignes)
Par type : 5-8 attaques minimum ✓
- Physiques et Spéciales ✓
- Attaques de statut ✓
- HMs (5) - À faire
- CTs (50) - À faire
```

### Types (src/data/types/)
```
15 types Gen 1 implémentés dans typeChart.ts :
Normal, Feu, Eau, Plante, Electrik, Glace,
Combat, Poison, Sol, Vol, Psy, Insecte,
Roche, Spectre, Dragon ✓
```

### Zones/Maps (public/assets/maps/)
```
- Map de test ✓
- Bourg initial + Route 1 - À faire
- Première ville + Arène - À faire
- Forêt (donjon) - À faire
```

---

## TODOs Identifiés dans le Code

1. ~~`BattleSystem.ts:105` - Implémenter utilisation d'items en combat~~ ✓
2. `BattleSystem.ts:109` - Implémenter switching de créatures
3. `BattleSystem.ts:259` - Ajouter vérification Pokédex pour "hasBeenCaughtBefore"
4. `ExperienceSystem.ts` - Ajouter `growthRate` dans `CreatureSpecies`
5. `EvolutionSystem.ts` - Ajouter `evolutionConditions` pour pierres/bonheur/etc

---

## Ordre d'Execution Recommandé

### Sprint 1 - TERMINÉ
- [x] Module A (Combat avancé)
- [x] Module B (Capture)
- [x] Module C (XP/Evolution) - sauf évolutions spéciales

### Sprint 2 (En cours)
- [x] **D3-D4** : Utilisation des objets (combat et hors-combat)
- [ ] **E3** : UI du PC
- [ ] **F1-F4** : NPCs et dialogues complets

### Sprint 3 (À faire)
- [ ] Module G (HMs)
- [ ] Module H (Arènes)
- [ ] Module J (Audio)

---

## Vérification

Pour chaque module :
```bash
npm run dev      # Test visuel dans le navigateur
npm run test     # Tests unitaires du module
npm run build    # Vérifier compilation
```

Tests fonctionnels :
- [x] Capturer un Pokémon avec différentes balls
- [x] Faire évoluer un Pokémon (par niveau)
- [ ] Battre un dresseur et gagner XP
- [x] Utiliser une potion en combat
- [x] Sauvegarder et recharger la partie