import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, type PasswordOptions } from './PasswordOptions';

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SIMILAR_CHARACTERS = new Set(['O', '0', 'I', 'l', '1']);
const UINT32_RANGE = 0x1_0000_0000;
const SPECIAL_CHARACTER_PATTERN = /[\p{P}\p{S}]/u;

function toUniqueCharacters(value: string): string[] {
  return [...new Set(Array.from(value))];
}

function removeSimilarCharacters(characters: string[]): string[] {
  return characters.filter((character) => !SIMILAR_CHARACTERS.has(character));
}

export function normalizeSymbolCharacters(value: string): string {
  return toUniqueCharacters(value)
    .filter((character) => SPECIAL_CHARACTER_PATTERN.test(character))
    .join('');
}

function secureRandomInt(maxExclusive: number): number {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0 || maxExclusive > UINT32_RANGE) {
    throw new RangeError('maxExclusive must be an integer between 1 and 2^32.');
  }

  const upperBound = Math.floor(UINT32_RANGE / maxExclusive) * maxExclusive;
  const randomValues = new Uint32Array(1);
  let value: number;

  do {
    crypto.getRandomValues(randomValues);
    value = randomValues[0] ?? 0;
  } while (value >= upperBound);

  return value % maxExclusive;
}

function randomCharacter(characters: readonly string[]): string {
  const character = characters[secureRandomInt(characters.length)];
  if (character === undefined) {
    throw new Error('Unable to select a random character.');
  }
  return character;
}

function secureShuffle(characters: string[]): void {
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const randomIndex = secureRandomInt(index + 1);
    const current = characters[index];
    const random = characters[randomIndex];

    if (current === undefined || random === undefined) {
      throw new Error('Unable to shuffle password characters.');
    }

    characters[index] = random;
    characters[randomIndex] = current;
  }
}

function enabledCharacterSets(options: PasswordOptions): string[][] {
  const normalizeStandardSet = (characters: string): string[] => {
    const values = Array.from(characters);
    return options.excludeSimilar ? removeSimilarCharacters(values) : values;
  };

  const sets: string[][] = [];
  if (options.uppercase) sets.push(normalizeStandardSet(UPPERCASE));
  if (options.lowercase) sets.push(normalizeStandardSet(LOWERCASE));
  if (options.numbers) sets.push(normalizeStandardSet(NUMBERS));

  if (options.symbols) {
    const symbolCharacters = Array.from(normalizeSymbolCharacters(options.symbolCharacters));
    if (symbolCharacters.length === 0) {
      throw new Error('Add at least one special character to the symbol set.');
    }
    sets.push(symbolCharacters);
  }

  return sets;
}

export function generatePassword(options: PasswordOptions): string {
  if (
    !Number.isInteger(options.length) ||
    options.length < MIN_PASSWORD_LENGTH ||
    options.length > MAX_PASSWORD_LENGTH
  ) {
    throw new Error(
      `Password length must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH}.`,
    );
  }

  const characterSets = enabledCharacterSets(options);
  if (characterSets.length === 0) {
    throw new Error('Select at least one character type.');
  }

  if (options.length < characterSets.length) {
    throw new Error(`Password length must be at least ${characterSets.length}.`);
  }

  const password = characterSets.map(randomCharacter);
  const allCharacters = characterSets.flat();

  while (password.length < options.length) {
    password.push(randomCharacter(allCharacters));
  }

  secureShuffle(password);
  return password.join('');
}

export function calculateEntropyBits(options: PasswordOptions): number {
  try {
    const poolSize = new Set(enabledCharacterSets(options).flat()).size;
    return poolSize === 0 ? 0 : options.length * Math.log2(poolSize);
  } catch {
    return 0;
  }
}
