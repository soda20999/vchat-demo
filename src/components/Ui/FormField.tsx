'use client';

import { cloneElement, useId, type ReactElement, type ReactNode } from 'react';

type FormFieldProps = {
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactElement<{
    id?: string;
    'aria-label'?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
  }>;
  className?: string;
  labelClassName?: string;
};

export function FormField({
  label,
  hint,
  error,
  children,
  className = '',
  labelClassName = 'sr-only',
}: FormFieldProps) {
  const generatedId = useId();
  const inputId = children.props.id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [children.props['aria-describedby'], hintId, errorId]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={`block ${className}`} htmlFor={inputId}>
      <span className={labelClassName}>{label}</span>
      {cloneElement(children, {
        id: inputId,
        'aria-label': children.props['aria-label'] ?? label,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': Boolean(error) || undefined,
      })}
      {hint ? (
        <p id={hintId} className="mt-2 text-xs text-[#8d94a1]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-2 text-xs text-[#ff9e9e]">
          {error}
        </p>
      ) : null}
    </label>
  );
}
