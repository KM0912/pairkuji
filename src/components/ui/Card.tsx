import { type HTMLAttributes } from 'react';

type CardRadius = 'none' | 'sm' | 'md' | 'lg';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardShadow = 'none' | 'sm' | 'md' | 'lg';
type CardElement = 'div' | 'section' | 'article' | 'aside';

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: CardElement;
  radius?: CardRadius;
  padding?: CardPadding;
  shadow?: CardShadow;
}

const radiusClass: Record<CardRadius, string> = {
  none: 'rounded-none',
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
};

const paddingClass: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const shadowClass: Record<CardShadow, string> = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
};

const mergeClassNames = (...classes: Array<string | undefined>): string =>
  classes.filter(Boolean).join(' ');

export function Card({
  as = 'div',
  radius = 'md',
  padding = 'md',
  shadow = 'none',
  className,
  ...props
}: CardProps) {
  const Component = as;

  return (
    <Component
      className={mergeClassNames(
        'border border-slate-200 bg-white',
        radiusClass[radius],
        paddingClass[padding],
        shadowClass[shadow],
        className
      )}
      {...props}
    />
  );
}
