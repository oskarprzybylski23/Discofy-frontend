import React from 'react';
import classNames from 'classnames';

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  className?: string;
};

const baseClasses =
  'text-[14px] border-none rounded-full py-1 px-3 cursor-pointer transition-all duration-70 min-h-[32px] select-none';

const variantClasses = {
  primary: 'bg-white-background text-font-dark hover:brightness-85',
  secondary: 'bg-background-translucent text-font-bright hover:brightness-135',
  danger: 'bg-failed text-font-bright hover:brightness-120',
};

const disabledClasses = 'opacity-50 cursor-not-allowed pointer-events-none';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        baseClasses,
        variantClasses[variant],
        disabled && disabledClasses,
        className
      )}
    >
      {children}
    </button>
  );
}
