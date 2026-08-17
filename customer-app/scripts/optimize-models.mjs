#!/usr/bin/env node
/**
 * Model pipeline for the scrollytelling scene.
 *
 * Sketchfab exports ship at archive quality: uncompressed PNG normal maps and
 * float32 morph targets. Shipped as-is they add tens of megabytes to the app
 * binary and to first-frame GPU upload, which is the wrong trade for a hero
 * background that never fills more than a third of the screen.
 *
 * Source models live in assets/models/source/ and are never bundled — only the
 * optimised results in assets/models/ are require()d by the app.
 *
 * The chosen operations are deliberately limited to what three.js can decode on
 * device with no extra runtime: KHR_mesh_quantization is parsed by GLTFLoader
 * natively, whereas Draco, Meshopt and KTX2/Basis all need a wasm transcoder
 * that is awkward to ship through Metro and expo-gl.
 *
 *   npm run models:optimize
 */
import { readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import {
  dedup,
  flatten,
  join as joinMeshes,
  prune,
  resample,
  sparse,
  weld,
} from '@gltf-transform/functions';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = resolve(HERE, '../assets/models/source');
const OUTPUT_DIR = resolve(HERE, '../assets/models');

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Strips morph targets and the animations that drive them.
 *
 * The dress source carries 35 morph targets for a walk cycle — 8.4 MB of
 * float deltas plus the matching VRAM, for motion the scene never plays: the
 * garments only orbit. Removing them is the single largest win in the pipeline.
 */
function dropMorphTargets() {
  return (document) => {
    for (const mesh of document.getRoot().listMeshes()) {
      for (const primitive of mesh.listPrimitives()) {
        for (const target of primitive.listTargets()) {
          primitive.removeTarget(target);
        }
      }
      mesh.setWeights([]);
    }

    for (const animation of document.getRoot().listAnimations()) {
      animation.dispose();
    }
  };
}

/**
 * Removes every texture and the UVs that fed them.
 *
 * The scene shades each garment with a hand-written ShaderMaterial that samples
 * no maps at all — texture sampling does not render through expo-gl on this
 * stack (see ScrollytellingScene's `shadeGarment`). The Sketchfab normal and
 * base-colour maps are therefore pure dead weight: they are the bulk of these
 * files and of first-frame upload, for detail that is never drawn. Stripping
 * them, and letting `prune` drop the now-unused TEXCOORD attributes, is the
 * single largest size win after the morph targets.
 */
function stripTextures() {
  return (document) => {
    for (const material of document.getRoot().listMaterials()) {
      material.setBaseColorTexture(null);
      material.setNormalTexture(null);
      material.setMetallicRoughnessTexture(null);
      material.setEmissiveTexture(null);
      material.setOcclusionTexture(null);
    }
    for (const texture of document.getRoot().listTextures()) {
      texture.dispose();
    }
  };
}

async function optimize(io, name) {
  const inputPath = join(SOURCE_DIR, name);
  const outputPath = join(OUTPUT_DIR, name);

  const document = await io.read(inputPath);

  await document.transform(
    dropMorphTargets(),

    // Structural cleanup first, so later passes operate on less data.
    dedup(),
    flatten(),
    joinMeshes(),
    weld(),

    // Drop keyframes that are redundant under the sampler's interpolation.
    // A no-op once morph animation is gone, but keeps the pipeline correct if a
    // future model ships transform tracks worth keeping.
    resample(),

    // Drop all maps: the on-device shader samples none of them.
    stripTextures(),

    // NB: KHR_mesh_quantization is deliberately NOT applied. Quantized vertex
    // attributes (normalised-integer POSITION/NORMAL) do not render through
    // three on expo-gl's WebGL2 polyfill on this stack — the mesh loads and
    // parses but never draws a fragment, which was the original "3D scene is
    // just black" bug. Float attributes render correctly, and with textures and
    // morph targets already gone the files are small enough that the size these
    // would have saved is not worth shipping geometry the device cannot draw.

    // Store any mostly-zero accessor sparsely.
    sparse(),

    // Remove anything the passes above orphaned.
    prune({ keepAttributes: false, keepLeaves: false }),
  );

  await io.write(outputPath, document);

  const [before, after] = await Promise.all([stat(inputPath), stat(outputPath)]);
  return { name, before: before.size, after: after.size };
}

async function main() {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

  const models = (await readdir(SOURCE_DIR)).filter((f) => f.endsWith('.glb'));
  if (models.length === 0) {
    throw new Error(`No .glb files found in ${SOURCE_DIR}`);
  }

  for (const name of models) {
    const { before, after } = await optimize(io, name);
    const saved = ((1 - after / before) * 100).toFixed(1);
    console.log(`${name}: ${formatBytes(before)} -> ${formatBytes(after)} (-${saved}%)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
