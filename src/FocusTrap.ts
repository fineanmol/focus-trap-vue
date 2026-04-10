import {
  defineComponent,
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  cloneVNode,
  Comment,
  h,
  type PropType,
  type ComponentPublicInstance,
} from "vue"
import { getTabbable, getFirstTabbable } from "./tabbable"

export type InitialFocusTarget =
  | string
  | HTMLElement
  | (() => HTMLElement | null)
  | false

export interface FocusTrapOptions {
  /** Whether the trap is active. Supports v-model:active. Default: true */
  active?: boolean
  /** Deactivate when Escape is pressed. Default: true */
  escapeDeactivates?: boolean
  /** Return focus to the previously focused element when deactivating. Default: true */
  returnFocusOnDeactivate?: boolean
  /** Allow clicks outside the trap without deactivating. Default: true */
  allowOutsideClick?: boolean | ((e: MouseEvent | TouchEvent) => boolean)
  /** Deactivate when clicking outside. Default: false */
  clickOutsideDeactivates?: boolean | ((e: MouseEvent | TouchEvent) => boolean)
  /** Element, selector, function, or false for the initial focus target */
  initialFocus?: InitialFocusTarget
  /** Delay setting initial focus by one tick. Default: true */
  delayInitialFocus?: boolean
  /** Prevent scroll when setting focus. Default: false */
  preventScroll?: boolean
}

function resolveInitialFocus(
  container: HTMLElement,
  target: InitialFocusTarget | undefined
): HTMLElement | null {
  if (target === false) return null
  if (!target) return getFirstTabbable(container)
  if (typeof target === "string") {
    return (container.querySelector<HTMLElement>(target) ??
      document.querySelector<HTMLElement>(target) ??
      null)
  }
  if (typeof target === "function") return target()
  return target
}

/** Public methods exposed via template ref — e.g. `const trap = ref<FocusTrapExposed>()` */
export interface FocusTrapExposed {
  /** Programmatically activate the focus trap. */
  activate(): void
  /** Programmatically deactivate the focus trap and restore focus. */
  deactivate(): void
}

const _FocusTrap = defineComponent({
  name: "FocusTrap",

  props: {
    active: { type: Boolean, default: true },
    escapeDeactivates: { type: Boolean, default: true },
    returnFocusOnDeactivate: { type: Boolean, default: true },
    allowOutsideClick: {
      type: [Boolean, Function] as PropType<FocusTrapOptions["allowOutsideClick"]>,
      default: true,
    },
    clickOutsideDeactivates: {
      type: [Boolean, Function] as PropType<FocusTrapOptions["clickOutsideDeactivates"]>,
      default: false,
    },
    initialFocus: {
      type: [String, Object, Function, Boolean] as PropType<InitialFocusTarget>,
      default: undefined,
    },
    delayInitialFocus: { type: Boolean, default: true },
    preventScroll: { type: Boolean, default: false },
  },

  emits: ["update:active", "activate", "postActivate", "deactivate", "postDeactivate"],

  setup(props, { slots, emit, expose }) {
    const containerRef = ref<HTMLElement | ComponentPublicInstance | null>(null)
    let previouslyFocused: HTMLElement | null = null
    let isTrapping = false

    const containerEl = computed<HTMLElement | null>(() => {
      const v = containerRef.value
      if (!v) return null
      return v instanceof HTMLElement
        ? v
        : ((v as ComponentPublicInstance).$el as HTMLElement)
    })

    // ── Tab key handler ─────────────────────────────────────────────────────
    function handleKeydown(e: KeyboardEvent) {
      if (!isTrapping || !containerEl.value) return

      if (e.key === "Escape" && props.escapeDeactivates) {
        e.preventDefault()
        deactivate()
        return
      }

      if (e.key !== "Tab") return

      const tabbable = getTabbable(containerEl.value)
      if (!tabbable.length) { e.preventDefault(); return }

      const first = tabbable[0]
      const last = tabbable[tabbable.length - 1]
      const active = document.activeElement as HTMLElement

      if (e.shiftKey) {
        if (active === first || !containerEl.value.contains(active)) {
          e.preventDefault()
          last.focus({ preventScroll: props.preventScroll })
        }
      } else {
        if (active === last || !containerEl.value.contains(active)) {
          e.preventDefault()
          first.focus({ preventScroll: props.preventScroll })
        }
      }
    }

    // ── Click-outside handler ────────────────────────────────────────────────
    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (!isTrapping || !containerEl.value) return

      const target = (e.target ?? e.composedPath?.()?.[0]) as Node
      if (containerEl.value.contains(target)) return

      const { allowOutsideClick, clickOutsideDeactivates } = props

      const shouldDeactivate =
        typeof clickOutsideDeactivates === "function"
          ? clickOutsideDeactivates(e)
          : clickOutsideDeactivates

      if (shouldDeactivate) { deactivate(); return }

      const shouldAllow =
        typeof allowOutsideClick === "function"
          ? allowOutsideClick(e)
          : allowOutsideClick

      if (!shouldAllow) e.preventDefault()
    }

    // ── Focus-escape guard ───────────────────────────────────────────────────
    function handleFocusIn(e: FocusEvent) {
      if (!isTrapping || !containerEl.value) return
      const target = e.target as HTMLElement
      if (!containerEl.value.contains(target)) {
        // Focus escaped — pull it back
        const tabbable = getTabbable(containerEl.value)
        const first = tabbable[0]
        if (first) first.focus({ preventScroll: props.preventScroll })
      }
    }

    // ── Activate / Deactivate ────────────────────────────────────────────────
    function activate() {
      if (isTrapping || !containerEl.value) return
      isTrapping = true
      previouslyFocused = document.activeElement as HTMLElement

      document.addEventListener("keydown", handleKeydown, true)
      document.addEventListener("mousedown", handlePointerDown, true)
      document.addEventListener("touchstart", handlePointerDown, true)
      document.addEventListener("focusin", handleFocusIn, true)

      emit("activate")
      emit("update:active", true)

      const doFocus = () => {
        if (!containerEl.value) return
        const target = resolveInitialFocus(containerEl.value, props.initialFocus as InitialFocusTarget)
        target?.focus({ preventScroll: props.preventScroll })
        emit("postActivate")
      }

      if (props.delayInitialFocus) {
        // nextTick equivalent without Vue import overhead
        Promise.resolve().then(doFocus)
      } else {
        doFocus()
      }
    }

    function deactivate() {
      if (!isTrapping) return
      isTrapping = false

      document.removeEventListener("keydown", handleKeydown, true)
      document.removeEventListener("mousedown", handlePointerDown, true)
      document.removeEventListener("touchstart", handlePointerDown, true)
      document.removeEventListener("focusin", handleFocusIn, true)

      emit("deactivate")
      emit("update:active", false)

      if (props.returnFocusOnDeactivate && previouslyFocused) {
        previouslyFocused.focus({ preventScroll: props.preventScroll })
      }

      emit("postDeactivate")
      previouslyFocused = null
    }

    // ── Lifecycle ────────────────────────────────────────────────────────────
    onMounted(() => {
      watch(
        () => props.active,
        active => {
          if (active && containerEl.value) activate()
          else if (!active) deactivate()
        },
        { immediate: true, flush: "post" }
      )
    })

    onBeforeUnmount(() => {
      deactivate()
    })

    expose({ activate, deactivate } satisfies FocusTrapExposed)

    // ── Render ───────────────────────────────────────────────────────────────
    return () => {
      if (!slots.default) return null
      const vnodes = slots.default().filter(vn => vn.type !== Comment)
      if (vnodes.length !== 1) {
        if (__DEV__) {
          console.warn("[focus-trap-vue] FocusTrap requires exactly one child element.")
        }
        return vnodes
      }
      return cloneVNode(vnodes[0], { ref: containerRef })
    }
  },
})

/**
 * FocusTrap component. Traps keyboard focus within its single child element.
 *
 * @example
 * ```vue
 * <FocusTrap v-model:active="isOpen">
 *   <dialog>…</dialog>
 * </FocusTrap>
 * ```
 *
 * Access imperative API via template ref:
 * ```typescript
 * const trap = ref<FocusTrapExposed>()
 * trap.value?.activate()
 * trap.value?.deactivate()
 * ```
 */
export const FocusTrap: typeof _FocusTrap & { new (): FocusTrapExposed } =
  _FocusTrap as unknown as typeof _FocusTrap & { new (): FocusTrapExposed }
