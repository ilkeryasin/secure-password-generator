function svg(paths: string, className = 'lucide-icon'): string {
  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="${className}"
      aria-hidden="true"
      focusable="false"
    >
      ${paths}
    </svg>
  `;
}

export const lockKeyholeIcon = (): string =>
  svg(`
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <circle cx="12" cy="16" r="1" />
    <path d="M12 17v2" />
  `);

export const settingsIcon = (): string =>
  svg(`
    <path d="M12.22 2h-.44a2 2 0 0 0-1.94 1.5l-.27 1.07a8 8 0 0 0-1.79.74l-.96-.58a2 2 0 0 0-2.45.25l-.31.31a2 2 0 0 0-.25 2.45l.58.96c-.32.57-.57 1.16-.74 1.79l-1.07.27A2 2 0 0 0 2 11.78v.44a2 2 0 0 0 1.5 1.94l1.07.27c.17.63.42 1.22.74 1.79l-.58.96a2 2 0 0 0 .25 2.45l.31.31a2 2 0 0 0 2.45.25l.96-.58c.57.32 1.16.57 1.79.74l.27 1.07a2 2 0 0 0 1.94 1.5h.44a2 2 0 0 0 1.94-1.5l.27-1.07a8 8 0 0 0 1.79-.74l.96.58a2 2 0 0 0 2.45-.25l.31-.31a2 2 0 0 0 .25-2.45l-.58-.96c.32-.57.57-1.16.74-1.79l1.07-.27A2 2 0 0 0 22 12.22v-.44a2 2 0 0 0-1.5-1.94l-1.07-.27a8 8 0 0 0-.74-1.79l.58-.96a2 2 0 0 0-.25-2.45l-.31-.31a2 2 0 0 0-2.45-.25l-.96.58a8 8 0 0 0-1.79-.74l-.27-1.07A2 2 0 0 0 12.22 2z" />
    <circle cx="12" cy="12" r="3" />
  `);

export const shieldCheckIcon = (): string =>
  svg(`
    <path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6l8-4 8 4z" />
    <path d="m9 12 2 2 4-4" />
  `);

export const refreshCwIcon = (): string =>
  svg(`
    <path d="M21 2v6h-6" />
    <path d="M3 12a9 9 0 0 1 15.55-6L21 8" />
    <path d="M3 22v-6h6" />
    <path d="M21 12a9 9 0 0 1-15.55 6L3 16" />
  `);

export const arrowLeftIcon = (): string =>
  svg(`
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  `);

export const copyIcon = (): string =>
  svg(`
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  `);

export const rotateCcwIcon = (): string =>
  svg(`
    <path d="M3 2v6h6" />
    <path d="M3 8a9 9 0 1 0 2.6-5.6L3 4" />
  `);
