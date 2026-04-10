/**
 * Our own tabbable element discovery — zero runtime deps.
 * Covers all interactive elements that receive keyboard focus in modern browsers.
 */

const TABBABLE_SELECTORS = [
  "a[href]:not([tabindex='-1'])",
  "area[href]:not([tabindex='-1'])",
  "input:not([disabled]):not([type='hidden']):not([tabindex='-1'])",
  "select:not([disabled]):not([tabindex='-1'])",
  "textarea:not([disabled]):not([tabindex='-1'])",
  "button:not([disabled]):not([tabindex='-1'])",
  "iframe:not([tabindex='-1'])",
  "audio[controls]:not([tabindex='-1'])",
  "video[controls]:not([tabindex='-1'])",
  "[contenteditable]:not([tabindex='-1'])",
  "details > summary:first-of-type:not([tabindex='-1'])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ")

function isVisible(el: HTMLElement): boolean {
  if (el.hidden) return false
  const style = getComputedStyle(el)
  if (style.display === "none" || style.visibility === "hidden") return false
  return true
}

function isInert(el: Element): boolean {
  let node: Element | null = el
  while (node) {
    if ((node as HTMLElement).inert) return true
    node = node.parentElement
  }
  return false
}

export function getTabbable(container: HTMLElement): HTMLElement[] {
  const candidates = Array.from(
    container.querySelectorAll<HTMLElement>(TABBABLE_SELECTORS)
  )
  return candidates.filter(el => isVisible(el) && !isInert(el))
}

export function getFirstTabbable(container: HTMLElement): HTMLElement | null {
  return getTabbable(container)[0] ?? null
}

export function getLastTabbable(container: HTMLElement): HTMLElement | null {
  const all = getTabbable(container)
  return all[all.length - 1] ?? null
}
