import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function PrimaryButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return <button {...props}>{children}</button>;
}
