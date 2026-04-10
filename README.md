# @fineanmol/focus-trap-vue

[![npm](https://img.shields.io/npm/v/@fineanmol/focus-trap-vue)](https://www.npmjs.com/package/@fineanmol/focus-trap-vue)

**Zero-dependency** Vue 3 component that traps keyboard focus within a DOM element. Written from scratch — no `focus-trap` peer dependency required.

Great for modals, dialogs, drawers, and any UI that must be keyboard-accessible.

## Install

```bash
npm install @fineanmol/focus-trap-vue
```

## Quick start

```vue
<script setup>
import { ref } from 'vue'
import { FocusTrap } from '@fineanmol/focus-trap-vue'

const open = ref(false)
</script>

<template>
  <button @click="open = true">Open dialog</button>

  <FocusTrap v-model:active="open">
    <dialog open>
      <p>Focus is now trapped here.</p>
      <button @click="open = false">Close</button>
    </dialog>
  </FocusTrap>
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `active` | `boolean` | `true` | Activate/deactivate the trap. Use `v-model:active`. |
| `escapeDeactivates` | `boolean` | `true` | Deactivate on Escape key |
| `returnFocusOnDeactivate` | `boolean` | `true` | Return focus to the previously focused element |
| `allowOutsideClick` | `boolean \| (e) => boolean` | `true` | Allow clicks outside the trap |
| `clickOutsideDeactivates` | `boolean \| (e) => boolean` | `false` | Deactivate when clicking outside |
| `initialFocus` | `string \| HTMLElement \| () => HTMLElement \| false` | first tabbable | Initial focus target |
| `delayInitialFocus` | `boolean` | `true` | Set initial focus after a microtask tick |
| `preventScroll` | `boolean` | `false` | Pass `preventScroll` to `.focus()` calls |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:active` | `boolean` | For `v-model:active` |
| `activate` | — | Trap just activated |
| `postActivate` | — | After initial focus is set |
| `deactivate` | — | Trap just deactivated |
| `postDeactivate` | — | After focus is returned |

## Methods (via template ref)

```vue
<FocusTrap ref="trap" :active="false">
  <div>...</div>
</FocusTrap>

<button @click="trap.activate()">Open</button>
<button @click="trap.deactivate()">Close</button>
```

## Advanced examples

### Custom initial focus

```vue
<FocusTrap v-model:active="open" :initial-focus="() => $refs.input">
  <dialog open>
    <input ref="input" placeholder="focused first" />
    <button>Submit</button>
  </dialog>
</FocusTrap>
```

### No initial focus (just trap Tab)

```vue
<FocusTrap :initial-focus="false" v-model:active="open">
  <div role="dialog">...</div>
</FocusTrap>
```

### Deactivate on outside click

```vue
<FocusTrap v-model:active="open" :click-outside-deactivates="true">
  <div role="dialog">...</div>
</FocusTrap>
```

## Utilities

The package also exports its tabbable-element helpers so you can use them directly:

```js
import { getTabbable, getFirstTabbable, getLastTabbable } from '@fineanmol/focus-trap-vue'

const focusable = getTabbable(document.getElementById('my-dialog'))
```

## How it works

- **Tabbable detection** — our own selector-based scan covering `<a>`, `<button>`, `<input>`, `<select>`, `<textarea>`, `[contenteditable]`, `[tabindex]`, `<details summary>`, `<audio controls>`, `<video controls>`. Filters out `display:none`, `visibility:hidden`, `hidden`, and `[inert]` ancestors.
- **Tab cycling** — `keydown` listener (capture phase) redirects Tab/Shift+Tab at the boundary.
- **Focus escape guard** — `focusin` listener (capture phase) pulls focus back if it escapes the container.
- **Click outside** — configurable via `allowOutsideClick` / `clickOutsideDeactivates`.
- **Cleanup** — all listeners removed on deactivate and on component unmount.

## License

MIT © [Anmol Agarwal](https://github.com/fineanmol)
