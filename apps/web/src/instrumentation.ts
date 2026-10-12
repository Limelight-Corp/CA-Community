/**
 * Runs once when the web server starts. The Node-only work (reminder and backup timers) lives in
 * instrumentation-node.ts, imported only for the Node.js runtime so the edge build never sees it.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerNode } = await import('./instrumentation-node');
    await registerNode();
  }
}
