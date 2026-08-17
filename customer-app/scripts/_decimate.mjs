import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { simplify, weld } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
await MeshoptSimplifier.ready;
for (const n of ['shirt.glb','dress.glb']) {
  const d = await io.read('assets/models/'+n);
  await d.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: 0.15, error: 0.02 }));
  await io.write('assets/models/'+n, d);
  let v=0; for(const m of d.getRoot().listMeshes())for(const p of m.listPrimitives())v+=p.getAttribute('POSITION').getCount();
  console.log(n, 'verts now', v);
}
