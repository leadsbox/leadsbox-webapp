import { cn } from '@/lib/utils';

type AuthBrandProps = {
  className?: string;
  logoClassName?: string;
};

export const AuthBrand = ({ className, logoClassName }: AuthBrandProps) => {
  return (
    <div className={cn('flex justify-center', className)}>
      <img src='/leadboxlogo.webp' alt='LeadsBox' className={cn('h-10 w-auto rounded-sm', logoClassName)} loading='lazy' />
    </div>
  );
};

export default AuthBrand;
