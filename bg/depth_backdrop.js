import { backdropLayout } from './building_layout.js';

export function projectBackdropPolygon(points, camera, width, height) {
  const vertices = points.map(point => new THREE.Vector3(...point).applyMatrix4(camera.matrixWorldInverse));
  const clipped = [];
  const near = -camera.near;
  for (let index = 0; index < vertices.length; index++) {
    const a = vertices[index];
    const b = vertices[(index + 1) % vertices.length];
    const insideA = a.z <= near;
    const insideB = b.z <= near;
    if (insideA) clipped.push(a);
    if (insideA !== insideB) clipped.push(a.clone().lerp(b, (near - a.z) / (b.z - a.z)));
  }
  if (clipped.length < 3) return null;
  return clipped.map(point => {
    point.applyMatrix4(camera.projectionMatrix);
    return [(point.x + 1) * width / 2, (1 - point.y) * height / 2];
  });
}

export function createDepthBackdrop(container) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.id = 'depth-backdrop';
  svg.setAttribute('aria-hidden', 'true');
  container.classList.add('has-depth-backdrop');
  container.appendChild(svg);
  const faces = [];
  function face(points, color, depth = true) {
    const element = document.createElementNS(ns, 'polygon');
    const center = points.reduce((sum, point) => sum.add(new THREE.Vector3(...point)), new THREE.Vector3()).divideScalar(points.length);
    const distance = Math.hypot(center.x, center.z);
    const ink = depth ? 100 * Math.exp(-distance / 620) : 100;
    element.style.fill = `color-mix(in srgb, ${color} ${ink}%, var(--sky-horizon))`;
    element.setAttribute('stroke', 'none');
    svg.appendChild(element);
    faces.push({points, center, element});
  }

  face([[-3000, -0.08, -3000], [3000, -0.08, -3000], [3000, -0.08, 3000], [-3000, -0.08, 3000]], 'var(--garden-color)', false);
  face([[-31, -0.03, -85], [31, -0.03, -85], [31, -0.03, 75], [-31, -0.03, 75]], 'var(--court-color)', false);

  const buildings = backdropLayout.items.filter(item => item.scene_position.z < -70);
  for (const building of buildings) {
    const {x, y, z} = building.scene_position;
    const w = building.width / 2;
    const d = building.depth / 2;
    const h = building.height;
    const eave = y + h * 0.68;
    const ridge = y + h;
    const p = (a, b, c) => [x + a, b, z + c];
    face([p(-w, y, d), p(w, y, d), p(w, eave, d), p(-w, eave, d)], 'var(--back-wall-color)');
    face([p(w, y, -d), p(-w, y, -d), p(-w, eave, -d), p(w, eave, -d)], 'var(--back-wall-color)');
    face([p(-w, y, -d), p(-w, y, d), p(-w, eave, d), p(-w, eave, -d)], 'var(--back-wall-shade)');
    face([p(w, y, d), p(w, y, -d), p(w, eave, -d), p(w, eave, d)], 'var(--back-wall-shade)');
    if (building.roof_kind === 'block') {
      face([p(-w, eave, -d), p(w, eave, -d), p(w, eave, d), p(-w, eave, d)], 'var(--back-roof-color)');
      continue;
    }
    const r = w * 0.72;
    const ex = w + 0.75;
    const ez = d + 0.75;
    face([p(-ex, eave + 0.22, ez), p(-w * 0.8, eave, ez), p(w * 0.8, eave, ez), p(ex, eave + 0.22, ez), p(r, ridge, 0), p(-r, ridge, 0)], 'var(--back-roof-color)');
    face([p(ex, eave + 0.22, -ez), p(w * 0.8, eave, -ez), p(-w * 0.8, eave, -ez), p(-ex, eave + 0.22, -ez), p(-r, ridge, 0), p(r, ridge, 0)], 'var(--back-roof-shade)');
    face([p(-ex, eave + 0.22, -ez), p(-ex, eave + 0.22, ez), p(-r, ridge, 0)], 'var(--back-roof-shade)');
    face([p(ex, eave + 0.22, ez), p(ex, eave + 0.22, -ez), p(r, ridge, 0)], 'var(--back-roof-shade)');
  }

  // cây là lớp cảnh quan minh họa, không xác nhận vị trí thực địa
  for (let index = 0; index < 68; index++) {
    const side = index % 2 ? 1 : -1;
    const row = Math.floor(index / 2);
    const z = -38 - row * 10;
    const x = side * (55 + 11 * Math.sin(row * 1.7) + (row % 3) * 14);
    const h = 6 + 2.6 * (1 + Math.sin(index * 2.3));
    const radius = h * 0.44;
    face([[x - 0.25, 0, z], [x + 0.25, 0, z], [x + 0.15, h * 0.72, z], [x - 0.15, h * 0.72, z]], 'var(--back-trunk-color)');
    const crown = [];
    for (let point = 0; point < 30; point++) {
      const angle = point * Math.PI * 2 / 30;
      const lobes = 1 + 0.12 * Math.sin(angle * 7 + index) + 0.07 * Math.sin(angle * 11);
      crown.push([x + Math.cos(angle) * radius * lobes, h * 0.69 + Math.sin(angle) * h * 0.35 * lobes, z]);
    }
    face(crown, index % 3 ? 'var(--back-leaf-color)' : 'var(--back-leaf-shade)');
  }

  let previous = '';
  const cameraPoint = new THREE.Vector3();
  return {
    svg,
    buildingIds: buildings.map(item => item.id),
    faceCount: faces.length,
    update(camera, width, height) {
      camera.updateMatrixWorld(true);
      const signature = camera.matrixWorld.elements.join(',') + ':' + camera.projectionMatrix.elements.join(',') + ':' + width + ':' + height;
      if (signature === previous) return;
      previous = signature;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      for (const item of faces) item.depth = cameraPoint.copy(item.center).applyMatrix4(camera.matrixWorldInverse).z;
      const sorted = faces.slice(2).sort((a, b) => a.depth - b.depth);
      for (const item of [...faces.slice(0, 2), ...sorted]) {
        const polygon = projectBackdropPolygon(item.points, camera, width, height);
        item.element.style.display = polygon ? '' : 'none';
        if (polygon) item.element.setAttribute('points', polygon.map(point => point.map(value => value.toFixed(2)).join(',')).join(' '));
        svg.appendChild(item.element);
      }
    }
  };
}
