import { getConfig } from '../config/environments';

type BrandLogoProps = {
  variant?: 'full' | 'icon';
  className?: string;
};

export function BrandLogo({ variant = 'full', className = '' }: BrandLogoProps) {
  const { appName } = getConfig();
  const src = variant === 'full' ? '/logo-full.png' : '/logo-icon.png';

  return (
    <img
      src={src}
      alt={appName}
      className={`object-contain ${className}`}
      draggable={false}
    />
  );
}
