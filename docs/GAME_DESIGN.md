# Game Design - PokeClaude

## Type Chart

### Efficacités

```
         Défenseur →
Attaque  │ FEU │ EAU │ PLA │ ELE │ VOL │ POI │ ROC │ NOR │
─────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
FEU      │ 0.5 │ 0.5 │  2  │  1  │  1  │  1  │ 0.5 │  1  │
EAU      │  2  │ 0.5 │ 0.5 │  1  │  1  │  1  │  2  │  1  │
PLANTE   │ 0.5 │  2  │ 0.5 │  1  │ 0.5 │ 0.5 │  2  │  1  │
ELECTRIK │  1  │  2  │ 0.5 │ 0.5 │  2  │  1  │  1  │  1  │
VOL      │  1  │  1  │  2  │ 0.5 │  1  │  1  │ 0.5 │  1  │
POISON   │  1  │  1  │  2  │  1  │  1  │ 0.5 │ 0.5 │  1  │
ROCHE    │  2  │  1  │  1  │  1  │  2  │  1  │  1  │  1  │
NORMAL   │  1  │  1  │  1  │  1  │  1  │  1  │ 0.5 │  1  │
```

### Résumé rapide

| Type | Fort contre | Faible contre |
|------|-------------|---------------|
| Feu | Plante, Glace | Eau, Roche |
| Eau | Feu, Roche | Plante, Électrik |
| Plante | Eau, Roche | Feu, Vol, Poison |
| Électrik | Eau, Vol | Plante, Électrik |

## Formule de dégâts

```
damage = floor(
  ((2 * level / 5 + 2) * power * (atk / def) / 50 + 2)
  * STAB
  * typeEffectiveness
  * random(0.85, 1.0)
)
```

### Variables

| Variable | Description | Valeurs |
|----------|-------------|---------|
| `level` | Niveau attaquant | 1-100 |
| `power` | Puissance move | 0-200 |
| `atk` | Attack ou Sp.Atk | stat |
| `def` | Defense ou Sp.Def | stat |
| `STAB` | Same Type Attack Bonus | 1.0 ou 1.5 |
| `typeEffectiveness` | Efficacité type | 0.5, 1, 2 |
| `random` | Variance aléatoire | 0.85-1.0 |

### Catégories de moves

| Catégorie | Stat attaque | Stat défense |
|-----------|--------------|--------------|
| Physical | Attack | Defense |
| Special | Sp.Atk | Sp.Def |
| Status | - | - |

## Stats des créatures

### Base Stat Total (BST) par stage

| Stage | BST | Distribution typique |
|-------|-----|---------------------|
| Base | 280-320 | Équilibrée ou spécialisée |
| Mid | 380-420 | +100 du base |
| Final | 480-540 | +100 du mid |

### Archétypes

```
Tank      : HP+++ / Def++ / Atk+ / Spd-
Sweeper   : Atk+++ / Spd++ / Def- / HP-
Balanced  : Stats équilibrées
Glass Cannon : Atk+++ / Spd++ / Def-- / HP--
Wall      : Def+++ / HP++ / Atk- / Spd-
```

### Exemple équilibré (Final, BST 500)

```typescript
{
  hp: 80,      // ~16%
  attack: 100, // ~20%
  defense: 80, // ~16%
  spAtk: 100,  // ~20%
  spDef: 80,   // ~16%
  speed: 60    // ~12%
}
```

## Moves - Balance

### Power / Accuracy trade-off

| Tier | Power | Accuracy | PP | Exemple |
|------|-------|----------|----|---------|
| Weak | 40-60 | 100% | 25-35 | Tackle, Ember |
| Medium | 70-90 | 90-95% | 15-20 | Flame Wheel |
| Strong | 100-120 | 80-85% | 5-10 | Fire Blast |
| Ultimate | 130-150 | 70-75% | 5 | Hyper Beam |

### Status moves

```typescript
{
  power: 0,
  accuracy: 100,  // ou 75-90 pour effets puissants
  pp: 10-20,
  effect: StatusEffect
}
```

### Effets spéciaux

| Effet | Probabilité | Impact |
|-------|-------------|--------|
| Burn | 10-30% | -50% Attack |
| Paralyze | 10-30% | -50% Speed, 25% skip |
| Poison | 10-30% | -12.5% HP/tour |
| Sleep | 10-20% | Skip 1-3 tours |
| Confuse | 10-30% | 33% self-hit |

## Courbe d'XP

### Formule XP requise

```typescript
function xpForLevel(level: number): number {
  return Math.floor(level ** 3);  // Cubic growth
}

// Exemples
// Level 10: 1,000 XP
// Level 50: 125,000 XP
// Level 100: 1,000,000 XP
```

### XP gagnée

```typescript
function xpGained(baseXP: number, enemyLevel: number, playerLevel: number): number {
  const levelFactor = enemyLevel / playerLevel;
  return Math.floor(baseXP * levelFactor * 1.5);
}
```

### Base XP par stage

| Stage | Base XP |
|-------|---------|
| Base | 50-70 |
| Mid | 120-150 |
| Final | 200-250 |

## Évolutions

### Triggers

| Type | Condition | Exemple |
|------|-----------|---------|
| Level | Atteindre niveau X | Flamling → Flamero (Nv.16) |
| Item | Utiliser item | Pierre Feu |
| Trade | Échange | - |
| Happiness | Bonheur max | - |
| Time | Jour/Nuit | - |

### Boost stats à l'évolution

```typescript
// Chaque stat augmente proportionnellement
newStat = Math.floor(oldStat * (newBST / oldBST));
```

## Capture

### Formule taux de capture

```typescript
function catchRate(
  creatureRate: number,  // 0-255
  currentHp: number,
  maxHp: number,
  ballBonus: number,     // 1, 1.5, 2
  statusBonus: number    // 1, 1.5, 2
): number {
  const hpFactor = (3 * maxHp - 2 * currentHp) / (3 * maxHp);
  return (creatureRate * hpFactor * ballBonus * statusBonus) / 255;
}
```

### Catch rates

| Rareté | Rate | Exemple |
|--------|------|---------|
| Common | 200-255 | Starters faibles |
| Uncommon | 120-180 | Évolutions mid |
| Rare | 45-90 | Finaux |
| Legendary | 3-10 | Légendaires |

### Ball bonuses

| Ball | Bonus | Condition |
|------|-------|-----------|
| Poké Ball | 1x | - |
| Super Ball | 1.5x | - |
| Hyper Ball | 2x | - |
| Quick Ball | 4x | Tour 1 seulement |

## Encounters

### Taux de rencontre

```typescript
// Par pas dans tallGrass
const ENCOUNTER_RATE = 0.15;  // 15%

// Modifié par items
// Repel: 0%
// Lure: 30%
```

### Distribution zones

```typescript
// Exemple zone Forêt
{
  common: ['Leafling', 'Sparkit'],     // 60%
  uncommon: ['Leafero'],               // 30%
  rare: ['Sparkolt']                   // 10%
}
```

## Économie

### Prix items

| Catégorie | Range | Exemple |
|-----------|-------|---------|
| Potion | 200-2500 | Potion 200, Hyper 2500 |
| Ball | 200-1200 | Poké 200, Hyper 1200 |
| Status heal | 100-600 | Antidote 100, Full Heal 600 |
| Battle | 500-1000 | X Attack 500 |

### Gains combat

```typescript
money = baseReward * trainerClass * badgeMultiplier;
// Wild: 0
// Trainer: level * 50
// Gym Leader: level * 200
```
