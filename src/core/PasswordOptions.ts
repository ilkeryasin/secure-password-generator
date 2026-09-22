export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 2048;
export const DEFAULT_PASSWORD_LENGTH = 32;
export const DEFAULT_SYMBOL_CHARACTERS = '!@#$%^&*()-_=+[]{};:,.?';

export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  symbolCharacters: string;
  excludeSimilar: boolean;
}

export type CharacterOptions = Omit<PasswordOptions, 'length'>;

export interface BehaviorSettings {
  autoCopy: boolean;
  generateOnOpen: boolean;
}

export interface ExtensionSettings {
  characterOptions: CharacterOptions;
  behavior: BehaviorSettings;
}

export interface PopupState {
  length: number;
}

export const DEFAULT_CHARACTER_OPTIONS: CharacterOptions = {
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  symbolCharacters: DEFAULT_SYMBOL_CHARACTERS,
  excludeSimilar: false,
};

export const DEFAULT_BEHAVIOR_SETTINGS: BehaviorSettings = {
  autoCopy: false,
  generateOnOpen: true,
};

export const DEFAULT_EXTENSION_SETTINGS: ExtensionSettings = {
  characterOptions: { ...DEFAULT_CHARACTER_OPTIONS },
  behavior: { ...DEFAULT_BEHAVIOR_SETTINGS },
};

export const DEFAULT_POPUP_STATE: PopupState = {
  length: DEFAULT_PASSWORD_LENGTH,
};

export function toPasswordOptions(
  length: number,
  characterOptions: CharacterOptions,
): PasswordOptions {
  return {
    length,
    uppercase: characterOptions.uppercase,
    lowercase: characterOptions.lowercase,
    numbers: characterOptions.numbers,
    symbols: characterOptions.symbols,
    symbolCharacters: characterOptions.symbolCharacters,
    excludeSimilar: characterOptions.excludeSimilar,
  };
}
