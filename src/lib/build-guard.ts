// Build-Time Guard Utility
// This prevents any telephony initialization during build

export const isBuildTime = (): boolean => {
  return typeof window === 'undefined' && (
    process.env.NODE_ENV === 'production' ||
    process.env.CI === 'true' ||
    typeof process.env.VERCEL_ENV !== 'undefined'
  )
}

export const safeRequire = <T = any>(moduleName: string): T | null => {
  if (isBuildTime()) {
    return null
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    // @ts-ignore
    return require(moduleName) as T
  } catch (error) {
    // Non-fatal: module may be missing or fail to load in some envs
    // Keep silent to avoid build noise
    return null
  }
}
