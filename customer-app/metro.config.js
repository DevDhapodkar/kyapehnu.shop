// Learn more https://docs.expo.dev/guides/customizing-metro
const path = require('node:path');

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Metro's default assetExts has no 3D model formats, so GLB/GLTF files would be
// treated as source and fail to bundle. The scrollytelling scene loads its
// garment models from assets/models.
config.resolver.assetExts.push('glb', 'gltf', 'bin', 'hdr');

// three ships separate entry points for `import` (build/three.module.js) and
// `require` (build/three.cjs). @react-three/fiber resolves the ESM build while
// @react-three/drei's native bundle is CommonJS and resolves the CJS one, so a
// default resolve puts *two* full copies of three in the bundle — the source of
// "THREE.WARNING: Multiple instances of Three.js being imported". Two copies
// mean two sets of classes, so `instanceof` checks across the fiber/drei
// boundary silently fail. Pin every importer to the single ESM build.
// `three`'s "exports" map publishes only "." (plus addons/src/webgpu/tsl), so
// `require.resolve('three/build/three.module.js')` throws ERR_PACKAGE_PATH_NOT_EXPORTED
// and takes the whole Metro config down with it. Resolve the package's own
// CommonJS entry — which is allowed — and step sideways to its ESM sibling.
const THREE_ENTRY = path.join(path.dirname(require.resolve('three')), 'three.module.js');
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') {
    return { type: 'sourceFile', filePath: THREE_ENTRY };
  }

  const resolve = defaultResolveRequest ?? context.resolveRequest;
  return resolve(context, moduleName, platform);
};

module.exports = config;
