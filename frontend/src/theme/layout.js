/**
 * Space kept clear at the bottom of the screen below the `md` breakpoint, so floating
 * overlays added by the host (e.g. Netlify's "Powered by Netlify" badge in the bottom-right
 * corner) and the iOS home indicator never cover buttons, pagination or the comment box.
 */
export const MOBILE_BOTTOM_INSET = 'calc(72px + env(safe-area-inset-bottom, 0px))';
