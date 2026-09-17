/**
 * Fila de gravações pendentes. Quando falta internet, a alteração fica guardada no navegador
 * (por conta) e é reenviada na mesma ordem quando a conexão volta.
 * Erros que não são de rede (ex.: regra do banco) não voltam para a fila: são avisados ao usuário.
 */
import { repo } from './repository';

export type RepoMethod = keyof typeof repo;

export interface QueuedOp {
  id: string;
  method: RepoMethod;
  args: unknown[];
  queuedAt: string;
}

const storageKey = (userId: string) => `sync_queue:${userId}`;

export function readQueue(userId: string): QueuedOp[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeQueue(userId: string, ops: QueuedOp[]) {
  try {
    if (ops.length === 0) localStorage.removeItem(storageKey(userId));
    else localStorage.setItem(storageKey(userId), JSON.stringify(ops));
  } catch {
    // storage indisponível: a fila vive só na memória desta aba
  }
}

export function enqueue(userId: string, method: RepoMethod, args: unknown[]): number {
  const ops = readQueue(userId);
  ops.push({ id: `${Date.now()}-${ops.length}`, method, args, queuedAt: new Date().toISOString() });
  writeQueue(userId, ops);
  return ops.length;
}

export function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const message = String((error as Error)?.message ?? error).toLowerCase();
  return (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network request failed') ||
    message.includes('load failed') ||
    message.includes('fetch failed')
  );
}

let flushing: Promise<number> | null = null;

/**
 * Reenvia a fila em ordem. Para no primeiro erro de rede (tenta de novo depois).
 * Retorna quantas operações continuam pendentes.
 */
export function flushQueue(userId: string, onError: (message: string) => void): Promise<number> {
  if (flushing) return flushing;
  flushing = (async () => {
    let ops = readQueue(userId);
    while (ops.length > 0) {
      const [op, ...rest] = ops;
      const fn = repo[op.method] as (...args: unknown[]) => Promise<unknown>;
      try {
        if (typeof fn !== 'function') throw new Error(`Operação desconhecida: ${op.method}`);
        await fn(...op.args);
      } catch (err) {
        if (isNetworkError(err)) break;
        onError((err as Error).message);
      }
      ops = rest;
      writeQueue(userId, ops);
    }
    return ops.length;
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}
