# @fineanmol/focus-trap-vue

[![npm](https://img.shields.io/npm/v/@fineanmol/focus-trap-vue)](https://www.npmjs.com/package/@fineanmol/focus-trap-vue)

A Vue 3 component that keeps keyboard focus inside a container. No third-party focus-trap library needed — written from scratch.

Useful for modals, dialogs, drawers, anything where you need Tab to stay within a region.

## Install

```bash
npm install @fineanmol/focus-trap-vue
```

## Usage

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
      <p>Tab won't leave this dialog while it's open.</p>
      <button @click="open = false">Close</button>
    </dialog>
  </FocusTrap>
</template>
```

FocusTrap wraps a **single child element** and attaches listeners to it when active. When you close the dialog, focus goes back to wherever it was before.

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `active` | `boolean` | `true` | Whether the trap is on. Use `v-model:active` to toggle. |
| `escapeDeactivates` | `boolean` | `true` | Press Escape to close. |
| `returnFocusOnDeactivate` | `boolean` | `true` | Restore focus to the previously focused element when done. |
| `allowOutsideClick` | `boolean \| (e) => boolean` | `true` | Whether clicks outside the trap are allowed through. |
| `clickOutsideDeactivates` | `boolean \| (e) => boolean` | `false` | Close the trap when clicking outside. |
| `initialFocus` | `string \| HTMLElement \| () => HTMLElement \| false` | first tabbable | What to focus on open. Pass `false` to skip. |
| `delayInitialFocus` | `boolean` | `true` | Wait one microtask before focusing — helps with enter animations. |
| `preventScroll` | `boolean` | `false` | Passed straight to `.focus({ preventScroll })`. |

## Events

| Event | When |
|-------|------|
| `activate` | Right when the trap turns on |
| `postActivate` | After the initial element is focused |
| `deactivate` | Right when the trap turns off |
| `postDeactivate` | After focus is restored to the previous element |
| `update:active` | For `v-model:active` |

## Controlling it via ref

If you need to activate or deactivate programmatically rather than via `v-model`:

```vue
<script setup>
import { ref } from 'vue'
import { FocusTrap } from '@fineanmol/focus-trap-vue'
import type { FocusTrapExposed } from '@fineanmol/focus-trap-vue'

const trap = ref<FocusTrapExposed>()
</script>

<template>
  <FocusTrap ref="trap" :active="false">
    <div role="dialog">...</div>
  </FocusTrap>

  <button @click="trap?.activate()">Open</button>
  <button @click="trap?.deactivate()">Close</button>
</template>
```

## More examples

### Focus a specific element first

```vue
<FocusTrap v-model:active="open" :initial-focus="() => $refs.input">
  <dialog open>
    <input ref="input" placeholder="I get focused first" />
    <button>Submit</button>
  </dialog>
</FocusTrap>
```

### Don't auto-focus anything

```vue
<FocusTrap :initial-focus="false" v-model:active="open">
  <div role="dialog">...</div>
</FocusTrap>
```

### Close on outside click

```vue
<FocusTrap v-model:active="open" :click-outside-deactivates="true">
  <div role="dialog">...</div>
</FocusTrap>
```

## Tabbable helpers

The internal element-scanning utilities are exported if you need them elsewhere:

```js
import { getTabbable, getFirstTabbable, getLastTabbable } from '@fineanmol/focus-trap-vue'

const focusable = getTabbable(document.getElementById('my-dialog'))
```

## How it works

Tab and Shift+Tab key events are intercepted in the capture phase. When focus would leave the container, it wraps around to the other end instead. If focus escapes by some other means (e.g. a script calling `.focus()` on something outside), a `focusin` listener catches it and pulls it back. Click-outside handling runs on `mousedown`/`touchstart`, also captured, so it fires before the click goes through.

All listeners are removed when the trap deactivates or the component unmounts.

## License

MIT © [Anmol Agarwal](https://github.com/fineanmol)
