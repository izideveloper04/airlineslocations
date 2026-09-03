// Blocked from indexing by default — flip STAGING=false (in the Node.js App
// environment-variables panel, no rebuild needed) once the site is ready to
// go live. Defaults to staging/blocked so this can never accidentally ship
// open by omission.
export const isStaging = (process.env.STAGING ?? "true").toLowerCase() !== "false";

// Shown on the "Call Now" card on every airline child page (see
// ChildPageLayout.astro). No real support line has been confirmed yet -
// swap in the real number and a matching tel: link here once one exists.
export const supportPhone = {
  display: "+1-855-845-4172",
  href: "tel:+1-855-845-4172",
};
