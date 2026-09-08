import { bodies } from './bodies';
import type { Body } from './types';

export { bodies } from './bodies';
export type { BodyId } from './bodies';
export type { Body, BodyKind, Companion, Orbit, Quantity, Source } from './types';

export function findBody(id: string): Body | undefined {
	return bodies.find((b) => b.id === id);
}

export function bodyById(id: string): Body {
	const body = bodies.find((b) => b.id === id);
	if (!body) throw new Error(`Unknown body: ${id}`);
	return body;
}
