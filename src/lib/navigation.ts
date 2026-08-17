// The one place to edit the navbar (src/components/Header.astro just
// renders this list — no logic lives there). Deliberately NOT generated
// from WordPress page titles: a WP page can have a long title while the
// navbar shows something short, and a slug here doesn't have to match a
// WP page at all (e.g. a future hand-built route).
//
// To add a menu item: add an entry to navItems below.
// To add a submenu item: add an entry to that item's `submenu` array.
// `href` is a site-relative path (leading slash) — set it to `null` for a
// placeholder item with no destination yet (renders as inert text, not a
// dead link). `chevron: true` shows the dropdown arrow even if `submenu`
// is still empty, matching the design reference; the dropdown itself only
// appears once `submenu` actually has entries.

export interface NavSubmenuItem {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href: string | null;
  chevron?: boolean;
  submenu?: NavSubmenuItem[];
}

export const navItems: NavItem[] = [
  {
    label: "Airlines",
    href: "/airlines",
    chevron: true,
    submenu: [
      { label: "Airlines Child Page", href: "/airlines-child-page" },
      { label: "Airlines Child Page 2", href: "/airlines-child-page-2" },
      { label: "Airlines Child Page 2 (2)", href: "/airlines-child-page-2-2" },
      { label: "Airlines Child Page 3", href: "/airlines-child-page-3" },
      { label: "Airlines Child Page zZz", href: "/airlines-child-page-zzz" },
    ],
  },
  {
    label: "Terminals",
    href: "javascript:void(0)",
    chevron: true,
    submenu: [
      { label: "Terminal 1", href: "/terminal-1" },
      { label: "Terminal 2", href: "/terminal-2" },
    ],
  },
  { label: "Map", href: "/airport-map", chevron: false },
  { label: "Flights", href: null, chevron: true },
  { label: "Passenger Info", href: null, chevron: true },
  { label: "Car Rental", href: null, chevron: true },
  { label: "Lounges", href: null, chevron: true },
  { label: "Blog", href: "/blog", chevron: false },
];
