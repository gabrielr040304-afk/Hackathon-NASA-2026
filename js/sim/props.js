import * as THREE from 'three';
import { SIM_DETAIL } from '../config.js';
import { renderedHeight } from './model.js';
import { scienceFor } from '../science.js';

// Deterministic illustrative objects [H], not photogrammetry or mapped abundance.
export function addFieldObjects(scene, terrain, baseHeight, targets, base, prep) {
  const geometry = new THREE.IcosahedronGeometry(1, 0);
  const material = new THREE.MeshStandardMaterial({ color: '#92745e', roughness: 1, flatShading: true });
  const rocks = new THREE.InstancedMesh(geometry, material, targets.length * SIM_DETAIL.rocksPerTarget);
  const transform = new THREE.Object3D();
  let index = 0;
  for (const [t, target] of targets.entries()) {
    const kind = scienceFor(target.target)?.kind;
    for (let i = 0; i < SIM_DETAIL.rocksPerTarget; i++) {
      const seed = (i * 137.508 + t * 31) * Math.PI / 180;
      const radius = Math.sqrt((i + 1) / SIM_DETAIL.rocksPerTarget) * SIM_DETAIL.rockFieldRadiusM;
      const x = target.x + Math.cos(seed) * radius, z = target.z + Math.sin(seed) * radius;
      const size = SIM_DETAIL.rockMinM + ((i * 17 % 23) / 23) * (SIM_DETAIL.rockMaxM - SIM_DETAIL.rockMinM);
      transform.position.set(x, renderedHeight(terrain, x, z) - baseHeight + size * .25, z);
      transform.rotation.set(i * .31, seed, i * .13);
      transform.scale.set(size * 1.6, size * (kind === 'sediment' ? .35 : .65), size);
      transform.updateMatrix(); rocks.setMatrixAt(index++, transform.matrix);
    }
  }
  rocks.instanceMatrix.needsUpdate = true; rocks.computeBoundingSphere(); scene.add(rocks);

  const add = (shape, color, x, z, lift, rx = 0) => {
    const mesh = new THREE.Mesh(shape, new THREE.MeshStandardMaterial({ color, roughness: .8 }));
    mesh.position.set(x, renderedHeight(terrain, x, z) - baseHeight + lift, z); mesh.rotation.x = rx; scene.add(mesh); return mesh;
  };
  const bx = base.x + SIM_DETAIL.baseOffsetM, bz = base.z;
  add(new THREE.CylinderGeometry(2.6, 2.6, 7, 16), prep.shelter === 'regolith' ? '#95816c' : '#d3d9d6', bx, bz, 2.7, Math.PI / 2);
  if (prep.shelter === 'polymer') add(new THREE.BoxGeometry(5.7, 1, 7.4), '#8ba6ac', bx, bz, 5.2);
  if (prep.shelter === 'regolith') add(new THREE.SphereGeometry(5, 16, 8), '#957a61', bx, bz, 0).scale.set(1.1, .85, 1.3);
  add(new THREE.BoxGeometry(1.5, 2.2, .2), '#233c48', bx, bz + 3.6, 1.4);
  if (prep.rover) {
    const rx = bx + 9;
    add(new THREE.BoxGeometry(2.6, 1, 4), '#d5d5c5', rx, bz, 1.5);
    for (const dx of [-1.5, 1.5]) for (const dz of [-1.4, 1.4]) {
      const wheel = add(new THREE.CylinderGeometry(.7, .7, .45, 12), '#36393b', rx + dx, bz + dz, .7);
      wheel.rotation.z = Math.PI / 2;
    }
  }
}
