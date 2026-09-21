import {
  DEFAULT_CHARACTER_OPTIONS,
  DEFAULT_EXTENSION_SETTINGS,
  DEFAULT_POPUP_STATE,
  DEFAULT_SYMBOL_CHARACTERS,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  type CharacterOptions,
  type ExtensionSettings,
  type PasswordOptions,
  type PopupState,
} from '../core/PasswordOptions';

const SETTINGS_STORAGE_KEY = 'extensionSettings';
const POPUP_STATE_STORAGE_KEY = 'popupState';
const LEGACY_PASSWORD_OPTIONS_KEY = 'passwordOptions';

interface StoredShape {
  settings: ExtensionSettings;
  popupState: PopupState;
}

interface StorageAdapter {
  get<T>(keys: string | string[]): Promise<Record<string, T | undefined>>;
  set(values: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
}

function hasChromeStorage(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    typeof chrome.storage !== 'undefined' &&
    typeof chrome.storage.local !== 'undefined'
  );
}

function createStorageAdapter(): StorageAdapter {
  if (hasChromeStorage()) {
    return {
      async get<T>(keys: string | string[]): Promise<Record<string, T | undefined>> {
        return chrome.storage.local.get(keys) as Promise<Record<string, T | undefined>>;
      },
      async set(values: Record<string, unknown>): Promise<void> {
        await chrome.storage.local.set(values);
      },
      async remove(keys: string | string[]): Promise<void> {
        await chrome.storage.local.remove(keys);
      },
    };
  }

  return {
    async get<T>(keys: string | string[]): Promise<Record<string, T | undefined>> {
      const entries = Array.isArray(keys) ? keys : [keys];
      const result: Record<string, T | undefined> = {};

      entries.forEach((key) => {
        const rawValue = window.localStorage.getItem(key);
        result[key] = rawValue === null ? undefined : (JSON.parse(rawValue) as T);
      });

      return result;
    },
    async set(values: Record<string, unknown>): Promise<void> {
      Object.entries(values).forEach(([key, value]) => {
        window.localStorage.setItem(key, JSON.stringify(value));
      });
    },
    async remove(keys: string | string[]): Promise<void> {
      const entries = Array.isArray(keys) ? keys : [keys];
      entries.forEach((key) => window.localStorage.removeItem(key));
    },
  };
}

function parseCharacterOptions(value: unknown): CharacterOptions | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as Partial<CharacterOptions>;
  const { uppercase, lowercase, numbers, symbols, symbolCharacters, excludeSimilar } = candidate;

  if (
    typeof uppercase !== 'boolean' ||
    typeof lowercase !== 'boolean' ||
    typeof numbers !== 'boolean' ||
    typeof symbols !== 'boolean' ||
    typeof excludeSimilar !== 'boolean'
  ) {
    return null;
  }

  return {
    uppercase,
    lowercase,
    numbers,
    symbols,
    symbolCharacters:
      typeof symbolCharacters === 'string' ? symbolCharacters : DEFAULT_SYMBOL_CHARACTERS,
    excludeSimilar,
  };
}

function parsePopupState(value: unknown): PopupState | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as Partial<PopupState>;
  const { length } = candidate;

  if (
    typeof length !== 'number' ||
    !Number.isInteger(length) ||
    length < MIN_PASSWORD_LENGTH ||
    length > MAX_PASSWORD_LENGTH
  ) {
    return null;
  }

  return { length };
}

function parseExtensionSettings(value: unknown): ExtensionSettings | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as Partial<ExtensionSettings>;
  const characterOptions = parseCharacterOptions(candidate.characterOptions);
  const behavior = candidate.behavior;

  if (
    characterOptions === null ||
    typeof behavior !== 'object' ||
    behavior === null ||
    typeof behavior.autoCopy !== 'boolean' ||
    typeof behavior.generateOnOpen !== 'boolean'
  ) {
    return null;
  }

  return {
    characterOptions,
    behavior: {
      autoCopy: behavior.autoCopy,
      generateOnOpen: behavior.generateOnOpen,
    },
  };
}

function parseLegacyPasswordOptions(value: unknown): PasswordOptions | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as Partial<PasswordOptions>;
  const { length, uppercase, lowercase, numbers, symbols, symbolCharacters, excludeSimilar } = candidate;

  if (
    typeof length !== 'number' ||
    !Number.isInteger(length) ||
    length < MIN_PASSWORD_LENGTH ||
    length > MAX_PASSWORD_LENGTH ||
    typeof uppercase !== 'boolean' ||
    typeof lowercase !== 'boolean' ||
    typeof numbers !== 'boolean' ||
    typeof symbols !== 'boolean' ||
    typeof excludeSimilar !== 'boolean'
  ) {
    return null;
  }

  return {
    length,
    uppercase,
    lowercase,
    numbers,
    symbols,
    symbolCharacters:
      typeof symbolCharacters === 'string' ? symbolCharacters : DEFAULT_SYMBOL_CHARACTERS,
    excludeSimilar,
  };
}

function fromLegacyPasswordOptions(options: PasswordOptions): StoredShape {
  return {
    settings: {
      characterOptions: {
        uppercase: options.uppercase,
        lowercase: options.lowercase,
        numbers: options.numbers,
        symbols: options.symbols,
        symbolCharacters: options.symbolCharacters,
        excludeSimilar: options.excludeSimilar,
      },
      behavior: { ...DEFAULT_EXTENSION_SETTINGS.behavior },
    },
    popupState: { length: options.length },
  };
}

export class SettingsRepository {
  private readonly storageAdapter = createStorageAdapter();

  async loadAll(): Promise<StoredShape> {
    const result = await this.storageAdapter.get<unknown>([
      SETTINGS_STORAGE_KEY,
      POPUP_STATE_STORAGE_KEY,
      LEGACY_PASSWORD_OPTIONS_KEY,
    ]);

    const settings = parseExtensionSettings(result[SETTINGS_STORAGE_KEY]);
    const popupState = parsePopupState(result[POPUP_STATE_STORAGE_KEY]);

    if (settings !== null && popupState !== null) {
      return { settings, popupState };
    }

    const legacy = parseLegacyPasswordOptions(result[LEGACY_PASSWORD_OPTIONS_KEY]);
    if (legacy !== null) {
      const migrated = fromLegacyPasswordOptions(legacy);
      await this.storageAdapter.set({
        [SETTINGS_STORAGE_KEY]: migrated.settings,
        [POPUP_STATE_STORAGE_KEY]: migrated.popupState,
      });
      await this.storageAdapter.remove(LEGACY_PASSWORD_OPTIONS_KEY);
      return migrated;
    }

    return {
      settings: {
        characterOptions: { ...DEFAULT_CHARACTER_OPTIONS },
        behavior: { ...DEFAULT_EXTENSION_SETTINGS.behavior },
      },
      popupState: { ...DEFAULT_POPUP_STATE },
    };
  }

  async saveSettings(settings: ExtensionSettings): Promise<void> {
    await this.storageAdapter.set({ [SETTINGS_STORAGE_KEY]: settings });
  }

  async savePopupState(popupState: PopupState): Promise<void> {
    await this.storageAdapter.set({ [POPUP_STATE_STORAGE_KEY]: popupState });
  }

  async resetAll(): Promise<StoredShape> {
    const resetValue: StoredShape = {
      settings: {
        characterOptions: { ...DEFAULT_CHARACTER_OPTIONS },
        behavior: { ...DEFAULT_EXTENSION_SETTINGS.behavior },
      },
      popupState: { ...DEFAULT_POPUP_STATE },
    };

    await this.storageAdapter.set({
      [SETTINGS_STORAGE_KEY]: resetValue.settings,
      [POPUP_STATE_STORAGE_KEY]: resetValue.popupState,
    });
    await this.storageAdapter.remove(LEGACY_PASSWORD_OPTIONS_KEY);

    return resetValue;
  }
}
