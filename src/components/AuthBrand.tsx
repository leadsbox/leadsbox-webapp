import { cn } from '@/lib/utils';

type AuthBrandProps = {
  className?: string;
  logoClassName?: string;
};

export const AuthBrand = ({ className, logoClassName }: AuthBrandProps) => {
  return (
    <div className={cn('flex justify-center', className)}>
      <img
        src='/leadsboxlogo.svg'
        alt='LeadsBox'
        width={40}
        height={40}
        className={cn('h-10 w-auto rounded-sm', logoClassName)}
        decoding='async'
        loading='lazy'
      />
    </div>
  );
};

export default AuthBrand;
