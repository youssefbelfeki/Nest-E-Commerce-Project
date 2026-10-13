'use client';

import { useI18n } from '@/context/I18nContext';

interface FieldErrorProps {
  /** i18n key stored in the field-errors record (e.g. `validation.required`). */
  message?: string | null;
  /** DOM id for aria-describedby wiring on the input. */
  id?: string;
}

/**
 * Inline per-field validation message. Renders nothing when `message` is
 * empty so callers can clear errors by resetting the record entry to ''.
 */
export function FieldError({ message, id }: FieldErrorProps) {
  const { t } = useI18n();
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-red-400">
      {t(message)}
    </p>
  );
}
