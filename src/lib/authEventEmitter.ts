import { EventEmitter } from 'eventemitter3';

/**
 * Lightweight event bus for auth lifecycle events.
 * The API client emits 'LOGOUT' when a token refresh fails,
 * and the auth store subscribes to force a logout.
 */
export const authEventEmitter = new EventEmitter();
