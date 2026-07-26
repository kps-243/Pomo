export {}

declare global {
  interface Window {
    umami?: {
      track: (
        payload?:
          | string
          | Record<string, unknown>
          | ((props: Record<string, unknown>) => Record<string, unknown>)
      ) => void
      identify?: (data: Record<string, unknown>) => void
    }
  }
}
