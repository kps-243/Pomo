import { useDark, useToggle } from '@vueuse/core'

export const useTheme = () => {
  const isDark = useDark()

  return {
    isDark,
    toggleTheme: useToggle(isDark),
  }
}
