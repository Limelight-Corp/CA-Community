'use client';

/**
 * Client-boundary re-exports of interactive @ascend/ui components.
 *
 * @ascend/ui is consumed as compiled CommonJS, where Next.js cannot detect the package's
 * 'use client' directive. Server components must import these from here instead.
 */
export { Reveal, Marquee, Countdown, CountUp } from '@ascend/ui';
