import './styles.css';
import {
  calculateEntropyBits,
  generatePassword,
  normalizeSymbolCharacters,
} from '../core/PasswordGenerator';
import {
  DEFAULT_POPUP_STATE,
  DEFAULT_SYMBOL_CHARACTERS,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  type CharacterOptions,
  type ExtensionSettings,
  type PopupState,
  toPasswordOptions,
} from '../core/PasswordOptions';
import { passwordStrength } from '../core/PasswordStrength';
import { SettingsRepository } from '../storage/SettingsRepository';
import {
  arrowLeftIcon,
  copyIcon,
  lockKeyholeIcon,
  refreshCwIcon,
  rotateCcwIcon,
  settingsIcon,
  shieldCheckIcon,
} from '../ui/lucideIcons';

const settingsRepository = new SettingsRepository();

function requiredElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

const elements = {
  mainView: requiredElement<HTMLElement>('#mainView'),
  settingsView: requiredElement<HTMLElement>('#settingsView'),
  password: requiredElement<HTMLDivElement>('#password'),
  copyButton: requiredElement<HTMLButtonElement>('#copyButton'),
  generateIconButton: requiredElement<HTMLButtonElement>('#generateIconButton'),
  length: requiredElement<HTMLInputElement>('#length'),
  lengthValue: requiredElement<HTMLInputElement>('#lengthValue'),
  strengthLabel: requiredElement<HTMLSpanElement>('#strengthLabel'),
  error: requiredElement<HTMLParagraphElement>('#error'),
  settingsOpenButton: requiredElement<HTMLButtonElement>('#openSettingsButton'),
  settingsBackButton: requiredElement<HTMLButtonElement>('#closeSettingsButton'),
  uppercase: requiredElement<HTMLInputElement>('#uppercase'),
  lowercase: requiredElement<HTMLInputElement>('#lowercase'),
  numbers: requiredElement<HTMLInputElement>('#numbers'),
  excludeSimilar: requiredElement<HTMLInputElement>('#excludeSimilar'),
  symbols: requiredElement<HTMLInputElement>('#symbols'),
  symbolCharacters: requiredElement<HTMLInputElement>('#symbolCharacters'),
  symbolEditor: requiredElement<HTMLDivElement>('#symbolEditor'),
  toggleSymbolEditorButton: requiredElement<HTMLButtonElement>('#toggleSymbolEditorButton'),
  resetSymbols: requiredElement<HTMLButtonElement>('#resetSymbols'),
  autoCopy: requiredElement<HTMLInputElement>('#autoCopy'),
  generateOnOpen: requiredElement<HTMLInputElement>('#generateOnOpen'),
  resetAll: requiredElement<HTMLButtonElement>('#resetAll'),
  brandIcon: requiredElement<HTMLSpanElement>('#brandIcon'),
  settingsButtonIcon: requiredElement<HTMLSpanElement>('#settingsButtonIcon'),
  privacyIcon: requiredElement<HTMLSpanElement>('#privacyIcon'),
  copyButtonIcon: requiredElement<HTMLSpanElement>('#copyButtonIcon'),
  generateButtonIcon: requiredElement<HTMLSpanElement>('#generateButtonIcon'),
  backButtonIcon: requiredElement<HTMLSpanElement>('#backButtonIcon'),
  resetSymbolsIcon: requiredElement<HTMLSpanElement>('#resetSymbolsIcon'),
  resetAllIcon: requiredElement<HTMLSpanElement>('#resetAllIcon'),
  strengthSegments: Array.from(document.querySelectorAll<HTMLElement>('.strength-segment')),
  checkboxControls: Array.from(document.querySelectorAll<HTMLInputElement>('.checkbox-control')),
};

let currentPassword = '';
let currentSettings: ExtensionSettings;
let currentPopupState: PopupState;
let symbolEditorExpanded = false;

function renderIcons(): void {
  elements.brandIcon.innerHTML = lockKeyholeIcon();
  elements.settingsButtonIcon.innerHTML = settingsIcon();
  elements.privacyIcon.innerHTML = shieldCheckIcon();
  elements.copyButtonIcon.innerHTML = copyIcon();
  elements.generateButtonIcon.innerHTML = refreshCwIcon();
  elements.backButtonIcon.innerHTML = arrowLeftIcon();
  elements.resetSymbolsIcon.innerHTML = rotateCcwIcon();
  elements.resetAllIcon.innerHTML = rotateCcwIcon();
}

function showView(view: 'main' | 'settings'): void {
  const showingMain = view === 'main';
  elements.mainView.hidden = !showingMain;
  elements.settingsView.hidden = showingMain;
}

function hideError(): void {
  elements.error.hidden = true;
  elements.error.textContent = '';
}

function showError(message: string): void {
  elements.error.textContent = message;
  elements.error.hidden = false;
}

function hasAnyCharacterTypeSelected(options: CharacterOptions): boolean {
  return options.uppercase || options.lowercase || options.numbers || options.symbols;
}

function getCurrentPasswordOptions() {
  return toPasswordOptions(currentPopupState.length, currentSettings.characterOptions);
}

function renderLengthControls(): void {
  elements.length.value = String(currentPopupState.length);
  elements.lengthValue.value = String(currentPopupState.length);
}

function renderStrength(): void {
  const strength = passwordStrength(calculateEntropyBits(getCurrentPasswordOptions()));
  const activeCount = Math.max(1, Math.round(strength.percentage / 20));

  elements.strengthLabel.textContent = strength.label;
  elements.strengthSegments.forEach((segment, index) => {
    segment.classList.toggle('is-active', index < activeCount);
  });
}

function renderSettings(): void {
  const options = currentSettings.characterOptions;

  elements.uppercase.checked = options.uppercase;
  elements.lowercase.checked = options.lowercase;
  elements.numbers.checked = options.numbers;
  elements.excludeSimilar.checked = options.excludeSimilar;
  elements.symbols.checked = options.symbols;
  elements.symbolCharacters.value = options.symbolCharacters;
  elements.autoCopy.checked = currentSettings.behavior.autoCopy;
  elements.generateOnOpen.checked = currentSettings.behavior.generateOnOpen;

  updateSymbolControls();
}

function updateSymbolControls(): void {
  const enabled = currentSettings.characterOptions.symbols;
  const expanded = enabled && symbolEditorExpanded;

  elements.symbolCharacters.disabled = !enabled;
  elements.resetSymbols.disabled = !enabled;
  elements.toggleSymbolEditorButton.disabled = !enabled;
  elements.toggleSymbolEditorButton.textContent = expanded ? 'Hide' : 'Customize';
  elements.symbolEditor.hidden = !expanded;
  elements.resetSymbols.hidden = !enabled;
}

async function writeSettingsAndRefresh(optionsChanged: boolean, autoCopy = false): Promise<void> {
  renderSettings();
  renderStrength();
  await settingsRepository.saveSettings(currentSettings);

  if (optionsChanged) {
    await generateAndRender(autoCopy);
  }
}

async function generateAndRender(allowAutoCopy = false): Promise<void> {
  hideError();
  renderLengthControls();

  try {
    if (currentSettings.characterOptions.symbols) {
      const normalizedSymbols = normalizeSymbolCharacters(
        currentSettings.characterOptions.symbolCharacters,
      );

      if (normalizedSymbols !== currentSettings.characterOptions.symbolCharacters) {
        currentSettings.characterOptions.symbolCharacters = normalizedSymbols;
        elements.symbolCharacters.value = normalizedSymbols;
        await settingsRepository.saveSettings(currentSettings);
      }
    }

    const options = getCurrentPasswordOptions();
    currentPassword = generatePassword(options);
    elements.password.textContent = currentPassword;
    renderStrength();
    await settingsRepository.savePopupState(currentPopupState);

    if (allowAutoCopy && currentSettings.behavior.autoCopy) {
      await navigator.clipboard.writeText(currentPassword);
      const originalText = elements.copyButton.lastChild?.textContent ?? 'Copy';
      const labelSpan = elements.copyButton.querySelector('.button-label');
      if (labelSpan) {
        labelSpan.textContent = 'Copied!';
      }
      window.setTimeout(() => {
        if (labelSpan) {
          labelSpan.textContent = originalText;
        }
      }, 1200);
    }
  } catch (error) {
    currentPassword = '';
    elements.password.textContent = '—';
    elements.strengthLabel.textContent = 'Unavailable';
    elements.strengthSegments.forEach((segment) => segment.classList.remove('is-active'));
    showError(error instanceof Error ? error.message : 'Unable to generate password.');
  }
}

async function copyPassword(): Promise<void> {
  if (!currentPassword) {
    return;
  }

  try {
    await navigator.clipboard.writeText(currentPassword);
    const labelSpan = elements.copyButton.querySelector('.button-label');
    const originalText = labelSpan?.textContent ?? 'Copy';
    if (labelSpan) {
      labelSpan.textContent = 'Copied!';
    }
    window.setTimeout(() => {
      if (labelSpan) {
        labelSpan.textContent = originalText;
      }
    }, 1200);
  } catch {
    showError('Could not copy the password to the clipboard.');
  }
}

function clampLength(value: number): number {
  return Math.min(MAX_PASSWORD_LENGTH, Math.max(MIN_PASSWORD_LENGTH, Math.trunc(value)));
}

async function handleLengthInput(value: number): Promise<void> {
  if (!Number.isFinite(value)) {
    return;
  }

  currentPopupState.length = clampLength(value);
  renderLengthControls();
  await generateAndRender();
}

async function handleCharacterToggle(
  key: keyof CharacterOptions,
  nextValue: boolean,
): Promise<void> {
  const nextOptions: CharacterOptions = {
    ...currentSettings.characterOptions,
    [key]: nextValue,
  };

  if (!hasAnyCharacterTypeSelected(nextOptions)) {
    renderSettings();
    showError('At least one character type must remain selected.');
    return;
  }

  currentSettings.characterOptions = nextOptions;
  if (key === 'symbols' && nextValue) {
    symbolEditorExpanded = true;
  }
  await writeSettingsAndRefresh(true, true);
}

async function handleBehaviorToggle(): Promise<void> {
  currentSettings.behavior.autoCopy = elements.autoCopy.checked;
  currentSettings.behavior.generateOnOpen = elements.generateOnOpen.checked;
  await settingsRepository.saveSettings(currentSettings);
}

async function handleSymbolInput(): Promise<void> {
  currentSettings.characterOptions.symbolCharacters = elements.symbolCharacters.value;
  await writeSettingsAndRefresh(true, true);
}

async function resetSymbolCharacters(): Promise<void> {
  currentSettings.characterOptions.symbolCharacters = DEFAULT_SYMBOL_CHARACTERS;
  await writeSettingsAndRefresh(true, true);
  elements.symbolCharacters.focus();
}

async function resetAllSettings(): Promise<void> {
  const reset = await settingsRepository.resetAll();
  currentSettings = reset.settings;
  currentPopupState = reset.popupState;
  symbolEditorExpanded = true;

  renderLengthControls();
  renderSettings();
  await generateAndRender();
}

async function initialize(): Promise<void> {
  renderIcons();

  const stored = await settingsRepository.loadAll();
  currentSettings = stored.settings;
  currentPopupState = stored.popupState;

  renderLengthControls();
  renderSettings();
  showView('main');

  if (currentSettings.behavior.generateOnOpen) {
    await generateAndRender();
  } else {
    elements.password.textContent = 'Click refresh to generate a password';
    renderStrength();
  }

  elements.generateIconButton.addEventListener('click', () => void generateAndRender(true));
  elements.copyButton.addEventListener('click', () => void copyPassword());
  elements.settingsOpenButton.addEventListener('click', () => showView('settings'));
  elements.settingsBackButton.addEventListener('click', () => showView('main'));
  elements.toggleSymbolEditorButton.addEventListener('click', () => {
    symbolEditorExpanded = !symbolEditorExpanded;
    updateSymbolControls();
  });
  elements.resetSymbols.addEventListener('click', () => void resetSymbolCharacters());
  elements.resetAll.addEventListener('click', () => void resetAllSettings());

  elements.length.addEventListener('input', () => {
    void handleLengthInput(Number(elements.length.value));
  });

  elements.lengthValue.addEventListener('input', () => {
    const parsed = Number(elements.lengthValue.value);
    if (Number.isInteger(parsed) && parsed >= MIN_PASSWORD_LENGTH && parsed <= MAX_PASSWORD_LENGTH) {
      currentPopupState.length = parsed;
      elements.length.value = String(parsed);
      void generateAndRender();
    }
  });

  elements.lengthValue.addEventListener('change', () => {
    const parsed = Number(elements.lengthValue.value);
    const nextLength = Number.isFinite(parsed)
      ? clampLength(parsed)
      : DEFAULT_POPUP_STATE.length;
    void handleLengthInput(nextLength);
  });

  elements.lengthValue.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      elements.lengthValue.blur();
    }
  });

  elements.uppercase.addEventListener('change', () =>
    void handleCharacterToggle('uppercase', elements.uppercase.checked),
  );
  elements.lowercase.addEventListener('change', () =>
    void handleCharacterToggle('lowercase', elements.lowercase.checked),
  );
  elements.numbers.addEventListener('change', () =>
    void handleCharacterToggle('numbers', elements.numbers.checked),
  );
  elements.excludeSimilar.addEventListener('change', () =>
    void handleCharacterToggle('excludeSimilar', elements.excludeSimilar.checked),
  );
  elements.symbols.addEventListener('change', () =>
    void handleCharacterToggle('symbols', elements.symbols.checked),
  );
  elements.symbolCharacters.addEventListener('input', () => void handleSymbolInput());
  elements.autoCopy.addEventListener('change', () => void handleBehaviorToggle());
  elements.generateOnOpen.addEventListener('change', () => void handleBehaviorToggle());
}

void initialize();
