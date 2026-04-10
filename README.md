# vue-focus-trap

[![npm](https://img.shields.io/npm/v/vue-focus-trap)](https://www.npmjs.com/package/vue-focus-trap)
[![Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://fineanmol-focus-trap-vue.netlify.app)

> Vue 3 component to trap keyboard focus within a DOM element.

Written from scratch — no `focus-trap` peer dependency. Useful for modals, dialogs, drawers, and anything that needs to be keyboard-accessible.

**[→ Live demo](https://fineanmol-focus-trap-vue.netlify.app)**

## Installation

```sh
npm install vue-focus-trap
```

## Usage

`FocusTrap` can be controlled in three ways:

- using the `active` prop directly
- using `v-model:active` (recommended)
- calling `activate()` / `deactivate()` on a template ref

### v-model:active

```vue
<script setup>
import { ref } from 'vue'
import { FocusTrap } from 'vue-focus-trap'

const isOpen = ref(false)
</script>

<template>
  <button @click="isOpen = true">Open dialog</button>

  <FocusTrap v-model:active="isOpen">
    <dialog :open="isOpen">
      <h2>Trapped!</h2>
      <p>Tab stays inside while this is open.</p>
      <button @click="isOpen = false">Close</button>
    </dialog>
  </FocusTrap>
</template>
```

When `isOpen` becomes `true`, the trap activates and focus moves to the first tabbable element inside the dialog. Pressing Escape (or clicking "Close") sets `isOpen` back to `false`.

### Imperative via template ref

```vue
<script setup>
import { ref } from 'vue'
import { FocusTrap } from 'vue-focus-trap'
import type { FocusTrapExposed } from 'vue-focus-trap'

const trap = ref<FocusTrapExposed>()
</script>

<template>
  <FocusTrap ref="trap" :active="false">
    <div role="dialog">
      <button @click="trap?.deactivate()">Close</button>
    </div>
  </FocusTrap>

  <button @click="trap?.activate()">Open</button>
</template>
```

### Global registration

```js
import { createApp } from 'vue'
import { FocusTrap } from 'vue-focus-trap'
import App from './App.vue'

createApp(App)
  .component('FocusTrap', FocusTrap)
  .mount('#app')
```

## Props

`FocusTrap` requires exactly one child element (or component). It clones the child and attaches listeners to it.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `active` | `boolean` | `true` | Whether the trap is on. Use `v-model:active` to sync with parent state. |
| `escapeDeactivates` | `boolean` | `true` | Press Escape to close and restore focus. |
| `returnFocusOnDeactivate` | `boolean` | `true` | When deactivating, return focus to the element that had it before activation. |
| `allowOutsideClick` | `boolean \| (e: MouseEvent\|TouchEvent) => boolean` | `true` | Whether clicks outside the trap are allowed. Pass a function for per-click control. |
| `clickOutsideDeactivates` | `boolean \| (e: MouseEvent\|TouchEvent) => boolean` | `false` | Close the trap when clicking outside. |
| `initialFocus` | `string \| HTMLElement \| () => HTMLElement \| false` | first tabbable | What gets focused on activation. A CSS selector, an element, a function that returns one, or `false` to skip auto-focus. |
| `fallbackFocus` | `string \| HTMLElement \| () => HTMLElement` | container | What to focus when no tabbable elements are found. Falls back to focusing the container itself if not set. |
| `delayInitialFocus` | `boolean` | `true` | Wait a microtask before setting initial focus. Helpful when the child element has an enter animation. |
| `preventScroll` | `boolean` | `false` | Passed to `.focus({ preventScroll })` — stops the page from jumping when focusing an off-screen element. |

## Events

| Event | Payload | When it fires |
|-------|---------|---------------|
| `activate` | — | The moment the trap turns on |
| `postActivate` | — | After the initial element has been focused |
| `deactivate` | — | The moment the trap turns off |
| `postDeactivate` | — | After focus has been returned to the previous element |
| `update:active` | `boolean` | For `v-model:active` two-way binding |

## Methods (via template ref)

Use `ref` typed as `FocusTrapExposed` to get access to the imperative API:

```typescript
import type { FocusTrapExposed } from 'vue-focus-trap'

const trap = ref<FocusTrapExposed>()

trap.value?.activate()    // turn the trap on
trap.value?.deactivate()  // turn it off and restore focus
trap.value?.pause()       // suspend trapping without deactivating
trap.value?.unpause()     // resume after a pause
```

## Examples

### Custom initial focus

```vue
<FocusTrap v-model:active="open" :initial-focus="() => nameInput">
  <dialog :open="open">
    <label>
      Name
      <input ref="nameInput" type="text" />
    </label>
    <button @click="open = false">Submit</button>
  </dialog>
</FocusTrap>
```

### Skip auto-focus (just trap Tab)

```vue
<FocusTrap v-model:active="open" :initial-focus="false">
  <div role="dialog">...</div>
</FocusTrap>
```

### Click outside closes the trap

```vue
<FocusTrap v-model:active="open" :click-outside-deactivates="true">
  <div class="dropdown">...</div>
</FocusTrap>
```

### Selectively block outside clicks

```vue
<FocusTrap
  v-model:active="open"
  :allow-outside-click="(e) => e.target.closest('.toolbar') !== null"
>
  <div role="dialog">...</div>
</FocusTrap>
```

### No Escape key

```vue
<FocusTrap v-model:active="open" :escape-deactivates="false">
  <div role="dialog">
    <button @click="open = false">Only way out</button>
  </div>
</FocusTrap>
```

### Pause and unpause (nested traps)

If a second modal or tooltip opens on top of an existing trap, pause the outer one while the inner is active:

```vue
<script setup>
const outer = ref<FocusTrapExposed>()
const innerOpen = ref(false)

function openInner() {
  outer.value?.pause()
  innerOpen.value = true
}

function closeInner() {
  innerOpen.value = false
  outer.value?.unpause()
}
</script>

<template>
  <FocusTrap ref="outer" v-model:active="outerOpen">
    <div role="dialog">
      <button @click="openInner">Open inner</button>
    </div>
  </FocusTrap>

  <FocusTrap v-model:active="innerOpen" @deactivate="closeInner">
    <div role="dialog">...</div>
  </FocusTrap>
</template>
```

### Fallback focus (no tabbable children)

```vue
<FocusTrap v-model:active="open" fallback-focus="#my-dialog">
  <div id="my-dialog" role="dialog">
    <!-- no interactive elements here, but focus will land on the div -->
    <p>Read-only content</p>
  </div>
</FocusTrap>
```

## Utilities

The package exports its tabbable-element helpers if you need them directly:

```js
import { getTabbable, getFirstTabbable, getLastTabbable } from 'vue-focus-trap'

const all     = getTabbable(containerEl)     // all focusable elements in order
const first   = getFirstTabbable(containerEl)
const last    = getLastTabbable(containerEl)
```

Elements are included only if they pass a visibility check (not `display:none`, `visibility:hidden`, `hidden`, or `[inert]`).

## How it works

- **Tabbable detection** — own selector-based scan covering `<a>`, `<button>`, `<input>`, `<select>`, `<textarea>`, `[contenteditable]`, `[tabindex]`, `<details summary>`, `<audio controls>`, `<video controls>`. Filtered for visibility and `[inert]` ancestors.
- **Tab cycling** — `keydown` listener attached in capture phase redirects Tab/Shift+Tab at the boundary, wrapping around.
- **Focus escape guard** — `focusin` listener in capture phase catches focus landing outside the container and pulls it back.
- **Click outside** — `mousedown`/`touchstart` captured before the click, checked against the container. Runs `allowOutsideClick` or `clickOutsideDeactivates` logic before deciding what to do.
- **Pause** — sets an `isPaused` flag; all handlers skip processing while paused. The listeners stay attached so unpause is instant.
- **Cleanup** — all listeners removed on `deactivate()` and also on `onBeforeUnmount`.

## Dist formats

| File | Format | Use case |
|------|--------|---------|
| `dist/focus-trap-vue.esm.js` | ESM | Bundlers (Vite, webpack) |
| `dist/focus-trap-vue.cjs.js` | CJS | Node / `require()` |
| `dist/focus-trap-vue.cjs.prod.js` | CJS minified | Production Node |
| `dist/focus-trap-vue.global.js` | IIFE | `<script>` tag / CDN |

## License

MIT © [Anmol Agarwal](https://github.com/fineanmol)

