// Blocked from indexing by default — flip STAGING=false (in the Node.js App
// environment-variables panel, no rebuild needed) once the site is ready to
// go live. Defaults to staging/blocked so this can never accidentally ship
// open by omission.
export const isStaging = (process.env.STAGING ?? "true").toLowerCase() !== "false";
