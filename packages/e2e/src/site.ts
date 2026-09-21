/**
 * The site name as it appears in page titles. Duplicated here on purpose: the
 * harness never imports application code, so a change to the app's title format
 * is caught by the specs rather than silently followed.
 */
export const SITE_NAME = "Power Platform Universe";

export const titleFor = (pageName: string): string => `${pageName} | ${SITE_NAME}`;
