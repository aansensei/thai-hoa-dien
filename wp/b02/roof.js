import { thaiHoaPlan as plan } from './plan_spec.js';
import { planToScene } from './coordinates.js';

const thickness = 0.24;
const tilePeriod = 1.44;

function vector(point) {
  const p = planToScene(point);
  return new THREE.Vector3(p.x, p.y, p.z);
}

function createPanel(corners, heights, material, wood, face, level, hall) {
  const nu = 32;
  const nv = 16;
  const positions = [];
  const uvs = [];
  const indices = [];
  const topCount = (nu + 1) * (nv + 1);
  for (const underside of [false, true]) {
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const u = i / nu;
      const v = j / nv;
      const outer = corners[0].clone().lerp(corners[1], u);
      const inner = corners[3].clone().lerp(corners[2], u);
      const p = outer.lerp(inner, v);
      const sag = v + 0.32 * (v * v - v);
      const cornerLift = heights.lift * Math.pow(Math.abs(u - 0.5) * 2, 8) * Math.pow(1 - v, 3);
      p.y = heights.eave + (heights.inner - heights.eave) * sag + cornerLift - (underside ? thickness : 0);
      positions.push(p.x, p.y, p.z);
      if (face === 'east' || face === 'west') uvs.push(p.z / tilePeriod, p.x / tilePeriod);
      else uvs.push(p.x / tilePeriod, p.z / tilePeriod);
    }
  }
  const at = index => new THREE.Vector3().fromArray(positions, index * 3);
  function triangle(a, b, c, up) {
    const normal = at(b).sub(at(a)).cross(at(c).sub(at(a)));
    if (normal.lengthSq() < 1e-18) return;
    if ((normal.y > 0) !== up) indices.push(a, c, b);
    else indices.push(a, b, c);
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i;
    const b = a + 1, c = a + nu + 1, d = c + 1;
    triangle(a, b, c, true);
    triangle(b, d, c, true);
  }
  const topIndices = indices.length;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = topCount + j * (nu + 1) + i;
    const b = a + 1, c = a + nu + 1, d = c + 1;
    triangle(a, b, c, false);
    triangle(b, d, c, false);
  }
  const center = corners.reduce((p, c) => p.add(c), new THREE.Vector3()).multiplyScalar(0.25);
  function wall(a, b) {
    const lowerA = a + topCount, lowerB = b + topCount;
    const pa = at(a), pb = at(b);
    if (pa.distanceToSquared(pb) < 1e-18) return;
    const normal = pb.clone().sub(pa).cross(at(lowerA).sub(pa));
    const outward = pa.clone().add(pb).multiplyScalar(0.5).sub(center);
    outward.y = 0;
    if (normal.dot(outward) >= 0) indices.push(a, b, lowerA, b, lowerB, lowerA);
    else indices.push(a, lowerA, b, b, lowerA, lowerB);
  }
  for (let i = 0; i < nu; i++) {
    wall(i, i + 1);
    wall(nv * (nu + 1) + i, nv * (nu + 1) + i + 1);
  }
  for (let j = 0; j < nv; j++) {
    wall(j * (nu + 1), (j + 1) * (nu + 1));
    wall(j * (nu + 1) + nu, (j + 1) * (nu + 1) + nu);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.addGroup(0, topIndices, 0);
  geometry.addGroup(topIndices, indices.length - topIndices, 1);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, [material, wood]);
  mesh.name = 'b02_' + hall + '_' + level + '_' + face;
  mesh.userData.roofPatch = { face, level };
  mesh.userData.verification = '[CẦN XÁC MINH] biên dạng mái suy dựng từ plan và lưới cột';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addTier(group, outer, inner, heights, materials, level, hall) {
  const [w, d, z] = outer;
  const [iw, id] = inner;
  const p = (x, dz) => vector({ x, y: 0, z: z + dz });
  const sw = p(-w / 2, -d / 2), se = p(w / 2, -d / 2);
  const nw = p(-w / 2, d / 2), ne = p(w / 2, d / 2);
  const isw = p(-iw / 2, -id / 2), ise = p(iw / 2, -id / 2);
  const inw = p(-iw / 2, id / 2), ine = p(iw / 2, id / 2);
  const faces = [
    ['front', [sw, se, ise, isw]], ['back', [ne, nw, inw, ine]],
    ['west', [nw, sw, isw, inw]], ['east', [se, ne, ine, ise]]
  ];
  for (const [face, corners] of faces) group.add(createPanel(corners, heights, materials.tile, materials.wood, face, level, hall));
}

function addRidge(group, length, centerZ, surfaceY, crestY, material, hall) {
  const h = crestY - surfaceY;
  const section = new THREE.Shape();
  const points = [[-0.32, 0], [0.32, 0], [0.32, h * 0.34], [0.23, h * 0.34],
    [0.23, h * 0.72], [0.14, h], [-0.14, h], [-0.23, h * 0.72], [-0.23, h * 0.34], [-0.32, h * 0.34]];
  section.moveTo(...points[0]);
  points.slice(1).forEach(p => section.lineTo(...p));
  section.closePath();
  const geometry = new THREE.ExtrudeGeometry(section, { depth: length, bevelEnabled: false });
  geometry.rotateY(Math.PI / 2);
  geometry.translate(-length / 2, surfaceY, planToScene({ x: 0, y: 0, z: centerZ }).z);
  const ridge = new THREE.Mesh(geometry, material);
  ridge.name = 'b02_' + hall + '_ridge_profile';
  ridge.userData.verification = '[CẦN XÁC MINH] mặt cắt kỹ thuật, chưa phải hình kìm hoặc hoa văn lịch sử';
  ridge.castShadow = true;
  group.add(ridge);
}

export function createThaiHoaRoofs(building, materials) {
  const roofMeshes = [];
  for (const hall of ['tien_dien', 'chinh_dien']) {
    const spec = plan.he_mai[hall + '_mai'];
    const columns = plan.he_cot.danh_sach_cot.filter(c => c.toa_nha === hall);
    const zs = columns.map(c => c.z_m);
    const centerZ = (Math.min(...zs) + Math.max(...zs)) / 2;
    const tallest = Math.max(...columns.map(c => c.chieu_cao_m));
    const core = columns.filter(c => c.chieu_cao_m >= tallest - 0.21);
    const upperWidth = 2 * Math.max(...core.map(c => Math.abs(c.x_m) + c.duong_kinh_m * 0.52 + 0.3));
    const upperDepth = 2 * Math.max(...core.map(c => Math.abs(c.z_m - centerZ) + c.duong_kinh_m * 0.52 + 0.3));
    const innerWidth = upperWidth - 0.6;
    const innerDepth = upperDepth - 0.6;
    const upperEave = planToScene({ x: 0, y: tallest + thickness + 0.3, z: 0 }).y;
    const lowerInner = upperEave - 0.36;
    const ridgeCrest = planToScene({ x: 0, y: spec.chieu_cao_bo_noc_m, z: 0 }).y;
    const ridgeSurface = ridgeCrest - 0.35;
    const ridgeLength = upperWidth - upperDepth * 0.6;
    const group = new THREE.Group();
    group.name = 'b02_' + hall + '_roof';
    group.userData.verification = '[CẦN XÁC MINH] cao độ mép mái và vị trí nóc suy dựng để giữ lưới cột plan';
    const lift = Math.tan(spec.goc_dao_do * Math.PI / 180) * 1.2;
    const eave = planToScene({ x: 0, y: columns.find(c => c.chieu_cao_m === Math.min(...columns.map(c => c.chieu_cao_m))).chieu_cao_m + thickness + 0.3, z: 0 }).y;
    addTier(group, [spec.chieu_rong_mai_m, spec.chieu_sau_mai_m, centerZ], [innerWidth, innerDepth],
      { eave, inner: lowerInner, lift }, materials, 'lower', hall);
    const band = new THREE.Mesh(new THREE.BoxGeometry(innerWidth, upperEave - lowerInner, innerDepth), materials.wood);
    band.position.set(0, (upperEave + lowerInner) / 2, planToScene({ x: 0, y: 0, z: centerZ }).z);
    band.name = 'b02_' + hall + '_clerestory';
    group.add(band);
    addTier(group, [upperWidth, upperDepth, centerZ], [ridgeLength, 0],
      { eave: upperEave, inner: ridgeSurface, lift: lift * 0.45 }, materials, 'upper', hall);
    addRidge(group, ridgeLength, centerZ, ridgeSurface, ridgeCrest, materials.ridge, hall);
    building.add(group);
    group.traverse(m => { if (m.isMesh && m.userData.roofPatch) roofMeshes.push(m); });
  }
  building.updateMatrixWorld(true);
  addTimberSupports(building, roofMeshes, materials.wood);
}

function addTimberSupports(building, roofs, material) {
  const beamMatrices = [], postMatrices = [], braceMatrices = [];
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  function segment(a, b, width) {
    const direction = b.clone().sub(a);
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
    return matrix.compose(a.clone().add(b).multiplyScalar(0.5), quaternion,
      new THREE.Vector3(width, direction.length(), width)).clone();
  }
  const columnRows = new Map();
  building.traverse(m => {
    if (!m.userData.columnId) return;
    const row = m.userData.row;
    if (!columnRows.has(row)) columnRows.set(row, []);
    columnRows.get(row).push(m);
  });
  for (const columns of columnRows.values()) {
    const boxes = columns.map(c => new THREE.Box3().setFromObject(c));
    const xMin = Math.min(...boxes.map(b => b.min.x)), xMax = Math.max(...boxes.map(b => b.max.x));
    const top = boxes[0].max.y;
    const z = boxes[0].getCenter(new THREE.Vector3()).z;
    const width = Math.max(...columns.map(c => c.userData.diameter)) * 1.3;
    beamMatrices.push(matrix.compose(new THREE.Vector3((xMin + xMax) / 2, top + 0.11, z), new THREE.Quaternion(),
      new THREE.Vector3(xMax - xMin + 0.12, 0.22, width)).clone());
    for (let i = 0; i < columns.length; i++) {
      const c = boxes[i].getCenter(new THREE.Vector3());
      const a = new THREE.Vector3(c.x, top + 0.22, c.z);
      const ray = new THREE.Raycaster(a, new THREE.Vector3(0, 1, 0));
      const hits = ray.intersectObjects(roofs, false);
      if (!hits.length || hits[0].point.y <= a.y + 0.02) continue;
      const b = hits[0].point.clone();
      postMatrices.push(segment(a, b, columns[i].userData.diameter * 0.38));
      const bx = c.x + (c.x > 0 ? -0.55 : 0.55);
      const diagonal = new THREE.Raycaster(new THREE.Vector3(bx, a.y, c.z), new THREE.Vector3(0, 1, 0)).intersectObjects(roofs, false);
      if (diagonal.length && diagonal[0].point.y > a.y + 0.02) braceMatrices.push(segment(a, diagonal[0].point, 0.12));
    }
  }
  const group = new THREE.Group();
  group.name = 'b02_timber_supports';
  group.userData.verification = '[CẦN XÁC MINH] khung đỡ kỹ thuật theo đầu cột và mặt dưới mái, chưa xác nhận kiểu vì kèo';
  for (const [name, matrices] of [['beams', beamMatrices], ['posts', postMatrices], ['braces', braceMatrices]]) {
    const instances = new THREE.InstancedMesh(unit, material, matrices.length);
    instances.name = 'b02_support_' + name;
    instances.userData.structuralSupport = true;
    matrices.forEach((m, i) => instances.setMatrixAt(i, m));
    instances.instanceMatrix.needsUpdate = true;
    instances.castShadow = true;
    instances.receiveShadow = true;
    instances.frustumCulled = false;
    group.add(instances);
  }
  building.add(group);
}
