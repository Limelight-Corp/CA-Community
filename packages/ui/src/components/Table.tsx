import React from 'react';
import { cn } from '../utils';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className="w-full overflow-x-auto">
    <table className={cn('w-full border-collapse text-[14px]', className)} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  children,
  ...props
}) => (
  <thead className={cn('border-b border-[var(--line)]', className)} {...props}>
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  children,
  ...props
}) => <tbody className={cn(className)} {...props}>{children}</tbody>;

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className,
  children,
  ...props
}) => (
  <tr
    className={cn(
      'border-b border-[var(--line)] transition-colors hover:bg-[rgba(219,231,240,0.02)]',
      className
    )}
    {...props}
  >
    {children}
  </tr>
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  children,
  align = 'left',
  ...props
}) => (
  <th
    className={cn(
      'font-mono text-[11.5px] font-normal tracking-[0.06em] uppercase text-[var(--muted)] py-3 pr-4 whitespace-nowrap',
      align === 'right' ? 'text-right' : 'text-left',
      className
    )}
    {...props}
  >
    {children}
  </th>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  children,
  align = 'left',
  ...props
}) => (
  <td
    className={cn(
      'py-4 pr-4 whitespace-nowrap text-[14px] text-[var(--fg)]',
      align === 'right' ? 'text-right' : 'text-left',
      className
    )}
    {...props}
  >
    {children}
  </td>
);
