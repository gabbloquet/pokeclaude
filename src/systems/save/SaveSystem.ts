import type { GameSaveData } from '@/types/game.types';

const SAVE_KEY = 'pokeclaude_save';
const SETTINGS_KEY = 'pokeclaude_settings';

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  textSpeed: 'slow' | 'normal' | 'fast';
  battleAnimations: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.7,
  sfxVolume: 0.8,
  textSpeed: 'normal',
  battleAnimations: true,
};

export function saveGame(data: GameSaveData): boolean {
  try {
    const saveData = {
      ...data,
      savedAt: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    return false;
  }
}

export function loadGame(): GameSaveData | null {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return null;

    const data = JSON.parse(saved) as GameSaveData;

    // Validate basic structure
    if (
      !data.player ||
      !data.team ||
      !Array.isArray(data.team) ||
      !data.inventory ||
      !Array.isArray(data.inventory)
    ) {
      console.error('Données de sauvegarde invalides');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur lors du chargement:', error);
    return null;
  }
}

export function deleteSave(): boolean {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return false;
  }
}

export function hasSaveData(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function getSaveInfo(): { savedAt: number; playTime: number } | null {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return null;

    const data = JSON.parse(saved) as GameSaveData;
    return {
      savedAt: data.savedAt,
      playTime: data.playTime,
    };
  } catch {
    return null;
  }
}

export function saveSettings(settings: Partial<GameSettings>): boolean {
  try {
    const currentSettings = loadSettings();
    const newSettings = { ...currentSettings, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres:', error);
    return false;
  }
}

export function loadSettings(): GameSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return { ...DEFAULT_SETTINGS };

    const settings = JSON.parse(saved) as GameSettings;
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function formatPlayTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }
  return `${minutes}m ${secs.toString().padStart(2, '0')}s`;
}

export function formatSaveDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
