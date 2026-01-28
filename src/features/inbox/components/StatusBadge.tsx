import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const [prevStatus, setPrevStatus] = useState(status);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (status !== prevStatus) {
      setChanged(true);
      const timer = setTimeout(() => {
        setChanged(false);
        setPrevStatus(status);
      }, 1000); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [status, prevStatus]);

  return (
    <div className='relative inline-flex'>
      <AnimatePresence>
        {changed && (
          <motion.span
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn('absolute inset-0 rounded-full bg-current opacity-20', className)}
            style={{ color: 'inherit' }}
          />
        )}
      </AnimatePresence>
      <motion.div animate={changed ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.3 }}>
        <Badge variant='outline' className={cn('relative z-10', className)}>
          {status}
        </Badge>
      </motion.div>
    </div>
  );
};

export default StatusBadge;
