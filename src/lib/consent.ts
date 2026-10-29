/**
 * Shared consent-mode helpers.
 *
 * The key is read by the Partytown worker (which proxies `window.localStorage`
 * back to the main thread) so the stored decision is applied before the first
 * GA4 hit, and by the main-thread consent banner.
 */
export const CONSENT_STORAGE_KEY = 'jampuk-docs-consent';

/** Event the footer "Cookie settings" control dispatches to re-open the banner. */
export const CONSENT_EVENT = 'jampuk:consent-request';
