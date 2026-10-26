import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'default' | 'small' | 'icon';
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className = '', variant = 'primary', size = 'default', type = 'button', ...props }, ref,
) {
  return <button ref={ref} type={type} className={`button button-${variant} button-${size} ${className}`} {...props} />;
});
