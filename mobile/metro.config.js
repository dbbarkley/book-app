const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '..')
const mobileModules = path.resolve(projectRoot, 'node_modules')

const config = getDefaultConfig(projectRoot)

// 1. Watch the whole monorepo so Metro sees changes in /shared
config.watchFolders = [monorepoRoot]

// 2. Tell Metro where to look for node_modules (mobile first, then root)
config.resolver.nodeModulesPaths = [
  mobileModules,
  path.resolve(monorepoRoot, 'node_modules'),
]

// 3. Map @book-app/shared directly to the source folder
config.resolver.extraNodeModules = {
  '@book-app/shared': path.resolve(monorepoRoot, 'shared'),
}

// 4. Force singleton packages to ALWAYS resolve from mobile/node_modules,
//    regardless of where the import originates.
//
//    Why: shared/node_modules has its own copy of react (and zustand, etc.).
//    Metro's hierarchical lookup finds that copy when bundling shared/ code,
//    giving us two Reacts in memory — which breaks hooks.
//
//    The trick: override originModulePath to __filename (this file lives in
//    mobile/) so Metro's normal lookup finds mobile/node_modules first.
const SINGLETONS = [
  'react',
  'react-native',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-native-reanimated',
  'react-native-gesture-handler',
  'react-native-safe-area-context',
  'react-native-screens',
  'zustand',
  'axios',
]

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isSingleton = SINGLETONS.some(
    (s) => moduleName === s || moduleName.startsWith(s + '/')
  )
  if (isSingleton) {
    // Re-run resolution but pretend the import originates from this config
    // file (which lives in mobile/), so node_modules lookup starts here.
    return context.resolveRequest(
      { ...context, originModulePath: __filename },
      moduleName,
      platform
    )
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
