import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export function Input({ label, hint, id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="field" htmlFor={inputId}>
      {label ? <span className="field__label">{label}</span> : null}
      <input className="input" id={inputId} {...props} />
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}
