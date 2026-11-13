function mergeParts(parts) {
  const attributes = {};
  for (const name of ['position', 'normal', 'uv']) {
    const size = name === 'uv' ? 2 : 3;
    const length = parts.reduce((sum, geometry) => sum + geometry.attributes.position.count * size, 0);
    const values = new Float32Array(length);
    let offset = 0;
    for (const geometry of parts) {
      const attribute = geometry.attributes[name];
      if (attribute) values.set(attribute.array, offset);
      offset += geometry.attributes.position.count * size;
    }
    attributes[name] = new THREE.BufferAttribute(values, size);
  }
  const geometry = new THREE.BufferGeometry();
  for (const [name, attribute] of Object.entries(attributes)) geometry.setAttribute(name, attribute);
  geometry.computeBoundingSphere();
  return geometry;
}

function sculptCurve(points, radii, segments = 32, sides = 8) {
  const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  const positions = [];
  const indices = [];
  const up = new THREE.Vector3(1, 0, 0);
  for (let ring = 0; ring <= segments; ring++) {
    const t = ring / segments;
    const center = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    const index = t * (radii.length - 1);
    const lower = Math.min(Math.floor(index), radii.length - 2);
    const radius = THREE.MathUtils.lerp(radii[lower], radii[lower + 1], index - lower);
    for (let side = 0; side <= sides; side++) {
      const angle = side * Math.PI * 2 / sides;
      const point = center.clone().addScaledVector(normal, Math.cos(angle) * radius).addScaledVector(binormal, Math.sin(angle) * radius);
      positions.push(point.x, point.y, point.z);
      if (ring < segments && side < sides) {
        const a = ring * (sides + 1) + side;
        const b = a + sides + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createFantasyDetails(building) {
  const group = new THREE.Group();
  group.name = 'b02_fantasy_details';
  group.userData.interpretation = 'chi tiết trang trí sáng tạo theo yêu cầu AanSensei, không xác nhận nguyên trạng lịch sử';
  const materials = {
    wood: new THREE.MeshStandardMaterial({color: 0x632426, roughness: 0.65}),
    recess: new THREE.MeshStandardMaterial({color: 0x301d21, roughness: 0.86}),
    gold: new THREE.MeshStandardMaterial({color: 0xc9a858, roughness: 0.42, metalness: 0.64}),
    jade: new THREE.MeshStandardMaterial({color: 0x366a64, roughness: 0.56, metalness: 0.12}),
    stone: new THREE.MeshStandardMaterial({color: 0x89958c, roughness: 0.94}),
    eye: new THREE.MeshStandardMaterial({color: 0x38494b, roughness: 0.3, metalness: 0.35}),
    glass: new THREE.MeshStandardMaterial({color: 0x476668, transparent: true, opacity: 0.3, roughness: 0.22, metalness: 0.18, depthWrite: false, side: THREE.DoubleSide})
  };
  const buckets = new Map(Object.keys(materials).map(key => [key, []]));
  const columns = building.getObjectByName('b02_columns_group');
  for (const [prefix, geometry, radius] of [
    ['column_', new THREE.CylinderGeometry(0.48, 0.52, 1, 20), 0.48],
    ['plinth_', new THREE.CylinderGeometry(0.72, 0.82, 0.24, 16), 0.72]
  ]) {
    const sources = columns.children.filter(mesh => mesh.name.startsWith(prefix));
    const instances = new THREE.InstancedMesh(geometry, sources[0].material, sources.length);
    instances.name = 'fantasy_instances_' + prefix;
    const matrix = new THREE.Matrix4();
    for (let index = 0; index < sources.length; index++) {
      const source = sources[index];
      const diameter = source.geometry.parameters.radiusTop / radius;
      const height = prefix === 'column_' ? source.geometry.parameters.height : 1;
      matrix.compose(source.position, source.quaternion, new THREE.Vector3(diameter, height, diameter));
      instances.setMatrixAt(index, matrix);
      source.visible = false;
    }
    instances.castShadow = instances.receiveShadow = true;
    instances.instanceMatrix.needsUpdate = true;
    group.add(instances);
  }
  function add(geometry, material, parent, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0]) {
    const mesh = new THREE.Mesh(geometry);
    mesh.position.fromArray(position);
    mesh.scale.fromArray(scale);
    mesh.rotation.set(...rotation);
    parent.add(mesh);
    mesh.updateWorldMatrix(true, false);
    let copy = geometry.clone().applyMatrix4(mesh.matrixWorld);
    if (copy.index) {
      const expanded = copy.toNonIndexed();
      copy.dispose();
      copy = expanded;
    }
    buckets.get(material).push(copy);
    parent.remove(mesh);
    geometry.dispose();
  }
  const unit = () => new THREE.BoxGeometry(1, 1, 1);
  function box(parent, material, position, scale, rotation) { add(unit(), material, parent, position, scale, rotation); }

  const walls = building.getObjectByName('b02_walls_group');
  for (const child of walls.children) {
    if (Math.abs(child.position.z - 13.5) < 0.01) child.visible = false;
  }
  const bays = [-16, -11.7, -7.3, -2.7, 2.7, 7.3, 11.7, 16];
  let doorLeaves = 0;
  for (let bay = 0; bay < bays.length - 1; bay++) {
    const left = bays[bay] + 0.24;
    const right = bays[bay + 1] - 0.24;
    const width = right - left;
    const middle = (left + right) / 2;
    box(group, 'wood', [middle, 5.05, 13.5], [width + 0.24, 0.24, 0.38]);
    box(group, 'gold', [middle, 5.19, 13.7], [width + 0.28, 0.035, 0.06]);
    box(group, 'jade', [middle, 5.44, 13.49], [width, 0.36, 0.16]);
    for (const edge of [left, right]) box(group, 'wood', [edge, 3.04, 13.5], [0.15, 4.12, 0.32]);
    for (let panel = 0; panel < 5; panel++) {
      const x = left + (panel + 0.5) * width / 5;
      box(group, 'gold', [x, 5.44, 13.61], [0.19, 0.19, 0.035], [0, 0, Math.PI / 4]);
    }
    const leafWidth = width / 4;
    for (let leafIndex = 0; leafIndex < 4; leafIndex++) {
      const leaf = new THREE.Group();
      group.add(leaf);
      const opening = bay === 3;
      const hinge = leafIndex < 2 ? left + leafIndex * 0.1 : right - (3 - leafIndex) * 0.1;
      leaf.position.set(opening ? hinge : left + leafIndex * leafWidth, 1.05, 13.52);
      if (opening) leaf.rotation.y = leafIndex < 2 ? -Math.PI * 0.43 : Math.PI * 0.43;
      const direction = opening && leafIndex >= 2 ? -1 : 1;
      const center = direction * leafWidth / 2;
      box(leaf, 'wood', [center, 0.93, 0], [leafWidth - 0.05, 1.86, 0.15]);
      for (const cy of [0.5, 1.33]) {
        box(leaf, 'recess', [center, cy, 0.083], [leafWidth - 0.19, 0.64, 0.03]);
        box(leaf, 'wood', [center, cy, 0.105], [leafWidth - 0.26, 0.53, 0.03]);
        for (const dx of [-1, 1]) box(leaf, 'gold', [center + dx * (leafWidth / 2 - 0.13), cy, 0.13], [0.016, 0.58, 0.018]);
      }
      box(leaf, 'glass', [center, 2.78, -0.01], [leafWidth - 0.11, 1.69, 0.025]);
      for (const dx of [-1, 1]) box(leaf, 'wood', [center + dx * (leafWidth / 2 - 0.045), 2.8, 0], [0.065, 1.82, 0.15]);
      for (const cy of [1.91, 2.44, 3.05, 3.66]) box(leaf, 'wood', [center, cy, 0.055], [leafWidth - 0.05, 0.045, 0.13]);
      for (const fraction of [0.25, 0.5, 0.75]) box(leaf, 'wood', [direction * leafWidth * fraction, 2.79, 0.04], [0.032, 1.68, 0.11]);
      add(new THREE.TorusGeometry(0.06, 0.013, 5, 12), 'gold', leaf, [center + direction * leafWidth * 0.28, 1.55, 0.17]);
      doorLeaves++;
    }
  }

  // rồng thành bậc là điêu khắc fantasy, không phải bằng chứng di tích
  for (const x of [-10.85, -8.15, -2.08, 2.08, 8.15, 10.85]) {
    const dragon = new THREE.Group();
    dragon.position.set(x, 0, 0);
    group.add(dragon);
    const body = [[0, 1.25, 15.3], [0, 1.32, 15.7], [0, 1.03, 16.18], [0, 0.74, 16.65], [0, 0.66, 17.14], [0, 0.92, 17.48]];
    add(sculptCurve(body, [0.035, 0.13, 0.18, 0.21, 0.19, 0.17]), 'stone', dragon);
    add(new THREE.SphereGeometry(1, 12, 8), 'stone', dragon, [0, 0.91, 17.48], [0.24, 0.25, 0.28]);
    add(new THREE.SphereGeometry(1, 12, 8), 'stone', dragon, [0, 0.83, 17.73], [0.22, 0.12, 0.3]);
    box(dragon, 'recess', [0, 0.735, 17.75], [0.32, 0.026, 0.34]);
    add(new THREE.SphereGeometry(1, 10, 6), 'stone', dragon, [0, 0.7, 17.76], [0.18, 0.06, 0.24]);
    for (const side of [-1, 1]) {
      add(new THREE.SphereGeometry(1, 10, 6), 'stone', dragon, [side * 0.2, 1.02, 17.6], [0.11, 0.1, 0.17]);
      add(new THREE.SphereGeometry(0.035, 8, 6), 'eye', dragon, [side * 0.26, 1.01, 17.65]);
      add(sculptCurve([[side * 0.13, 1.07, 17.42], [side * 0.22, 1.34, 17.25], [side * 0.3, 1.5, 17.31]], [0.075, 0.05, 0.006], 12, 6), 'gold', dragon);
      add(sculptCurve([[side * 0.22, 1.32, 17.26], [side * 0.37, 1.36, 17.19], [side * 0.41, 1.48, 17.15]], [0.04, 0.025, 0.003], 10, 5), 'gold', dragon);
      add(sculptCurve([[side * 0.13, 0.84, 17.83], [side * 0.37, 0.9, 17.9], [side * 0.43, 1.1, 17.71]], [0.022, 0.018, 0.003], 16, 5), 'stone', dragon);
      add(sculptCurve([[side * 0.12, 0.85, 16.68], [side * 0.32, 0.59, 16.83], [side * 0.35, 0.39, 17.04]], [0.08, 0.07, 0.04], 10, 6), 'stone', dragon);
      for (let claw = 0; claw < 3; claw++) add(new THREE.ConeGeometry(0.025, 0.13, 5), 'gold', dragon, [side * (0.29 + claw * 0.045), 0.39, 17.1], [1, 1, 1], [Math.PI / 2, 0, 0]);
    }
    const spine = new THREE.CatmullRomCurve3(body.map(point => new THREE.Vector3(...point)));
    for (let index = 1; index < 15; index++) {
      const point = spine.getPoint(index / 16);
      add(new THREE.ConeGeometry(0.065, 0.16, 5), 'gold', dragon, [point.x, point.y + 0.18, point.z], [1, 1, 1], [-0.2, 0, 0]);
    }
  }

  for (const [key, parts] of buckets) {
    if (!parts.length) continue;
    const mesh = new THREE.Mesh(mergeParts(parts), materials[key]);
    mesh.name = 'fantasy_' + key;
    mesh.castShadow = key !== 'glass';
    mesh.receiveShadow = true;
    group.add(mesh);
    for (const geometry of parts) geometry.dispose();
  }
  group.userData.doorLeaves = doorLeaves;
  group.userData.dragonCount = 6;
  building.add(group);
  return group;
}
