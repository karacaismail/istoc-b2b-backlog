import { ref, watch, type Ref } from 'vue'

/** A tall sidebar scrolls with the page, then sticks when its bottom is visible. */
export function useSidebarLayout(sidebar: Ref<HTMLElement | null>, header: Ref<HTMLElement | null>) {
  const headerHeight = ref(64)
  const stickyTop = ref(76)

  watch([sidebar, header], (elements, _previous, onCleanup) => {
    function measure() {
      headerHeight.value = header.value?.getBoundingClientRect().height || 64
      const height = sidebar.value?.getBoundingClientRect().height
      if (height) stickyTop.value = Math.min(headerHeight.value + 12, window.innerHeight - height - 12)
    }

    const observer = new ResizeObserver(measure)
    elements.forEach(element => { if (element) observer.observe(element) })
    window.addEventListener('resize', measure)
    measure()
    onCleanup(() => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    })
  }, { flush: 'post' })

  return { headerHeight, stickyTop }
}
