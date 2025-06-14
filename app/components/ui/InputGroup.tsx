'use client';

import { cn } from '@/app/lib/utils/cn';
import { HTMLAttributes, Children, cloneElement, isValidElement, ReactElement } from 'react';

interface InputGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function InputGroup({ children, className, ...props }: InputGroupProps) {
  const childrenArray = Children.toArray(children);

  return (
    <div className={cn('flex', className)} {...props}>
      {childrenArray.map((child, index) => {
        if (!isValidElement(child)) return child;

        const isFirst = index === 0;
        const isLast = index === childrenArray.length - 1;

        // Clone the child and modify its className
        const element = child as ReactElement<{ className?: string }>;
        return cloneElement(element, {
          className: cn(
            element.props.className,
            // Remove default rounded corners
            '[&]:rounded-none',
            // Add specific rounded corners
            isFirst && '[&]:rounded-l-md',
            isLast && '[&]:rounded-r-md',
            // Ensure no right border on non-last elements to avoid double borders
            !isLast && '[&]:border-r-0'
          ),
        });
      })}
    </div>
  );
}
