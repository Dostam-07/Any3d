import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

/**
 * Converts an Any3d SVG Figure scene graph (Object3D / Group / Mesh tree)
 * into a standard Three.js Object3D tree with standard PBR materials.
 */
export function convertAny3dToThree(any3dGroup: any): THREE.Group {
  const root = new THREE.Group();
  root.name = 'Any3dScene';

  function walk(node: any, parentThree: THREE.Object3D) {
    if (!node) return;

    if (node.isMesh && node.geometry) {
      let geo: THREE.BufferGeometry | null = null;
      const g = node.geometry;

      if (g.type === 'box') {
        geo = new THREE.BoxGeometry(g.w || 1, g.h || 1, g.d || 1);
      } else if (g.type === 'cyl') {
        const rt = g.rt ?? 0.5;
        const rb = g.rb ?? 0.5;
        const h = g.h ?? 1;
        const n = g.n || 16;
        geo = new THREE.CylinderGeometry(rt, rb, h, n);
      } else if (g.type === 'ball') {
        geo = new THREE.SphereGeometry(g.r || 0.5, 20, 16);
      } else if (g.type === 'slab') {
        const w2 = (g.w || 4) / 2;
        const d2 = (g.d || 4) / 2;
        const h = g.h || 0.6;
        const r = Math.min(g.r || 0.5, Math.min(w2, d2) * 0.8);

        const shape = new THREE.Shape();
        shape.moveTo(-w2 + r, -d2);
        shape.lineTo(w2 - r, -d2);
        shape.quadraticCurveTo(w2, -d2, w2, -d2 + r);
        shape.lineTo(w2, d2 - r);
        shape.quadraticCurveTo(w2, d2, w2 - r, d2);
        shape.lineTo(-w2 + r, d2);
        shape.quadraticCurveTo(-w2, d2, -w2, d2 - r);
        shape.lineTo(-w2, -d2 + r);
        shape.quadraticCurveTo(-w2, -d2, -w2 + r, -d2);

        geo = new THREE.ExtrudeGeometry(shape, {
          depth: h,
          bevelEnabled: false,
        });
        geo.rotateX(Math.PI / 2);
        geo.translate(0, h / 2, 0);
      } else if (g.type === 'wedge') {
        const w = g.w || 1;
        const h = g.h || 1;
        const d = g.d || 1;
        const w2 = w / 2;
        const d2 = d / 2;

        const shape = new THREE.Shape();
        shape.moveTo(-w2, -d2);
        shape.lineTo(w2, -d2);
        shape.lineTo(0, d2);
        shape.closePath();

        geo = new THREE.ExtrudeGeometry(shape, {
          depth: h,
          bevelEnabled: false,
        });
      } else {
        geo = new THREE.BoxGeometry(g.w || 1, g.h || 1, g.d || 1);
      }

      // Material conversion
      let colorHex = 0xd5d9e0;
      if (node.material && node.material.color) {
        if (typeof node.material.color.getHex === 'function') {
          colorHex = node.material.color.getHex();
        } else if (typeof node.material.color === 'string') {
          colorHex = new THREE.Color(node.material.color).getHex();
        }
      }

      let emissiveHex = 0x000000;
      if (node.material && node.material.emissive) {
        if (typeof node.material.emissive.getHex === 'function') {
          emissiveHex = node.material.emissive.getHex();
        } else if (typeof node.material.emissive === 'string') {
          emissiveHex = new THREE.Color(node.material.emissive).getHex();
        }
      }

      const mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.65,
        metalness: 0.1,
        emissive: emissiveHex,
        emissiveIntensity: node.material?.emissiveIntensity || 1,
        transparent: Boolean(node.material?.transparent),
        opacity: node.material?.opacity ?? 1,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = node.name || '';
      if (node.position) {
        mesh.position.set(node.position.x || 0, node.position.y || 0, node.position.z || 0);
      }
      if (node.rotation) {
        mesh.rotation.set(node.rotation.x || 0, node.rotation.y || 0, node.rotation.z || 0);
      }
      if (node.scale) {
        mesh.scale.set(node.scale.x || 1, node.scale.y || 1, node.scale.z || 1);
      }

      parentThree.add(mesh);
      return;
    }

    if (node.isGroup || (node.children && node.children.length > 0)) {
      const subGroup = new THREE.Group();
      subGroup.name = node.name || '';
      if (node.position) {
        subGroup.position.set(node.position.x || 0, node.position.y || 0, node.position.z || 0);
      }
      if (node.rotation) {
        subGroup.rotation.set(node.rotation.x || 0, node.rotation.y || 0, node.rotation.z || 0);
      }
      if (node.scale) {
        subGroup.scale.set(node.scale.x || 1, node.scale.y || 1, node.scale.z || 1);
      }

      if (node.children) {
        for (const child of node.children) {
          walk(child, subGroup);
        }
      }
      parentThree.add(subGroup);
    }
  }

  walk(any3dGroup, root);
  return root;
}

/**
 * Exports a Three.js Object3D / Group to a binary GLB ArrayBuffer.
 */
export async function exportThreeToGlb(object3D: THREE.Object3D): Promise<ArrayBuffer> {
  const exporter = new GLTFExporter();
  return new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(
      object3D,
      (gltf) => {
        if (gltf instanceof ArrayBuffer) {
          resolve(gltf);
        } else {
          // If JSON returned, stringify and encode
          const str = JSON.stringify(gltf);
          const buf = new TextEncoder().encode(str).buffer;
          resolve(buf);
        }
      },
      (error) => {
        reject(error);
      },
      {
        binary: true,
        embedImages: true,
      }
    );
  });
}

/**
 * Triggers a browser file download of a binary GLB buffer.
 */
export function downloadGlbFile(buffer: ArrayBuffer, filename: string = 'scene.glb') {
  const cleanName = filename.endsWith('.glb') ? filename : `${filename}.glb`;
  const blob = new Blob([buffer], { type: 'model/gltf-binary' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = cleanName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

