export type PasswordStrength = 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very strong';

export interface PasswordStrengthResult {
  label: PasswordStrength;
  percentage: number;
}

export function passwordStrength(entropyBits: number): PasswordStrengthResult {
  if (entropyBits < 40) return { label: 'Weak', percentage: 20 };
  if (entropyBits < 60) return { label: 'Fair', percentage: 40 };
  if (entropyBits < 80) return { label: 'Good', percentage: 60 };
  if (entropyBits < 110) return { label: 'Strong', percentage: 80 };
  return { label: 'Very strong', percentage: 100 };
}
