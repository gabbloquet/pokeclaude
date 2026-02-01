---
name: debugging-phaser
description: Debugs Phaser 3 game issues including rendering, scenes, input, and animations. Use when encountering game bugs, display problems, or Phaser-specific errors.
---

# Phaser 3 Debugging

## Common Issues

### Scene Lifecycle
```
Boot → Preload → Create → Update (loop)
```

Check:
- Assets loaded in `preload()`?
- Objects created in `create()`?
- `this.scene.start()` called correctly?

### Sprite Not Showing

1. Asset loaded? Check `this.load.image()` in preload
2. Correct key? Match load key with create key
3. Position visible? Check x, y within camera bounds
4. Depth/z-index? Use `setDepth()`

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
// Check animation exists
console.log(this.anims.exists('walk'));

// Debug current frame
console.log(sprite.anims.currentFrame);
```

## Debug Tools

```typescript
// Show physics bodies
this.physics.world.createDebugGraphic();

// FPS counter
this.game.config.fps.forceSetTimeOut = true;
```

## Project-Specific Files

- Scenes: `src/scenes/`
- Config: `src/config/`
- Entities: `src/entities/`
