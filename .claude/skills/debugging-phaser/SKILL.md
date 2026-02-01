---
name: debugging-phaser
description: Debugs Phaser 3 game issues. Use when user reports rendering problems, scene issues, input bugs, or Phaser-specific errors.
---

# Debug Phaser

## Scene Lifecycle
```
Boot → Preload → Create → Update (loop)
```

## Common Issues

### Sprite Not Showing
1. Asset loaded in `preload()`?
2. Key matches between load and create?
3. Position within camera bounds?
4. Check `setDepth()` for z-index

### Input Not Working
```typescript
// Keyboard
this.input.keyboard.on('keydown-SPACE', callback);

// Pointer
sprite.setInteractive();
sprite.on('pointerdown', callback);
```

### Animation Issues
```typescript
console.log(this.anims.exists('walk'));
console.log(sprite.anims.currentFrame);
```

## Debug Tools
```typescript
// Show physics bodies
this.physics.world.createDebugGraphic();

// FPS counter
this.game.config.fps.forceSetTimeOut = true;
```

## Project Files
- Scenes: `src/scenes/`
- Config: `src/config/`
- Entities: `src/entities/`

## Example
Input: "Le joueur ne s'affiche pas"
Output: Check preload key, create call, position, and depth
