'use client';

import React, { useRef } from 'react';
import { Pagination, usePagination } from '@ascend/ui';

/**
 * Pages a list of already rendered rows (server-rendered children work too). Renders the list
 * element with `className` and the pager underneath.
 */
export function PagedList({
  children,
  pageSize,
  noun,
  as: Tag = 'ul',
  className,
}: {
  children: React.ReactNode;
  pageSize: number;
  noun: string;
  as?: 'ul' | 'ol' | 'div';
  className?: string;
}) {
  const rows = React.Children.toArray(children);
  const pager = usePagination(rows, pageSize);
  const top = useRef<HTMLDivElement>(null);
  return (
    <div ref={top}>
      <Tag className={className}>{pager.pageItems}</Tag>
      <Pagination page={pager.page} pages={pager.pages} total={pager.total} pageSize={pager.pageSize} onChange={pager.setPage} noun={noun} scrollTo={top} />
    </div>
  );
}
