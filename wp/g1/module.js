// Mo-dun G1 San Dai Trieu Nghi va Canh Quan San Chau Cung Dinh
// Xuat register(ctx) va unregister(ctx) theo module_api.md

export function register(ctx) {
  const scene = ctx.scene;
  const group = new THREE.Group();
  group.name = "wp_g1_san_dai_trieu";

  const loader = new THREE.TextureLoader();
  const stoneDiff = loader.load('textures_stylized/stone_thanh_slate_diff.png');
  const stoneNor = loader.load('textures_stylized/stone_thanh_slate_nor.png');
  const stoneRough = loader.load('textures_stylized/stone_thanh_slate_rough.png');
  const brickDiff = loader.load('textures_stylized/brick_bat_trang_diff.png');
  const brickNor = loader.load('textures_stylized/brick_bat_trang_nor.png');

  stoneDiff.encoding = brickDiff.encoding = THREE.sRGBEncoding;
  for (const texture of [stoneDiff, stoneNor, stoneRough, brickDiff, brickNor]) {
    texture.anisotropy = 8;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
  }

  stoneDiff.wrapS = stoneDiff.wrapT = THREE.RepeatWrapping;
  stoneNor.wrapS = stoneNor.wrapT = THREE.RepeatWrapping;
  stoneRough.wrapS = stoneRough.wrapT = THREE.RepeatWrapping;
  stoneDiff.repeat.set(9, 18);
  stoneNor.repeat.set(9, 18);
  stoneRough.repeat.set(9, 18);

  // 1. MAT SAN DAI TRIEU NGHI LAT DA THANH CO MACH VOI (Z = 15.0m den 75.0m, rong 62.0m)
  const courtGeom = new THREE.BoxGeometry(62.0, 0.4, 60.0);
  const courtMat = new THREE.MeshStandardMaterial({
    map: stoneDiff,
    normalMap: stoneNor,
    roughnessMap: stoneRough,
    color: 0x95a5a6,
    roughness: 0.72,
    metalness: 0.05
  });
  const courtMesh = new THREE.Mesh(courtGeom, courtMat);
  courtMat.map = null;
  courtMat.normalMap = null;
  courtMat.roughnessMap = null;
  courtMat.color.setHex(0x8b968f);
  courtMat.roughness = 0.94;
  courtMat.extensions = {derivatives: true};
  courtMat.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec3 courtWorld;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\ncourtWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = 'varying vec3 courtWorld;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      vec2 tilePoint = courtWorld.xz / vec2(1.25, 1.8);
      tilePoint.x += mod(floor(tilePoint.y), 2.0) * 0.5;
      vec2 tileId = floor(tilePoint);
      vec2 edge = min(fract(tilePoint), 1.0 - fract(tilePoint));
      vec2 antialias = fwidth(tilePoint);
      vec2 seam = smoothstep(vec2(0.009), vec2(0.009) + antialias, edge);
      float tileNoise = fract(sin(dot(tileId, vec2(12.9898, 78.233))) * 43758.5453);
      diffuseColor.rgb *= mix(0.74, 0.95 + tileNoise * 0.12, seam.x * seam.y);
    `);
  };
  courtMesh.position.set(0, -0.2, 45.0);
  courtMesh.receiveShadow = true;
  group.add(courtMesh);

  // 2. TRUC NGU DAO BANG DA THANH PHANG MIN O CHINH GIUA (RONG 3.8m)
  const nguDaoDiff = loader.load('textures_stylized/stone_thanh_slate_diff.png');
  nguDaoDiff.wrapS = nguDaoDiff.wrapT = THREE.RepeatWrapping;
  nguDaoDiff.repeat.set(2, 24);
  const nguDaoMat = new THREE.MeshStandardMaterial({
    map: nguDaoDiff,
    color: 0xb0bec5,
    roughness: 0.55
  });
  const nguDaoGeom = new THREE.BoxGeometry(3.8, 0.44, 60.0);
  const nguDao = new THREE.Mesh(nguDaoGeom, nguDaoMat);
  nguDao.position.set(0, -0.16, 45.0);
  nguDao.receiveShadow = true;
  group.add(nguDao);

  // Bo via da phan cach Ngu Dao va san chieu hai ben
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x546e7a, roughness: 0.6 });
  for (let side of [-2.0, 2.0]) {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.48, 60.0), curbMat);
    curb.position.set(side, -0.14, 45.0);
    curb.receiveShadow = true;
    group.add(curb);
  }

  // 3. HAI HANG BIA PHAM SON (BIA PHAM CAP QUAN VAN BEN TA, QUAN VO BEN HUU)
  const steleMat = new THREE.MeshStandardMaterial({
    color: 0xcfd8dc,
    roughness: 0.5
  });
  const steleBaseMat = new THREE.MeshStandardMaterial({ color: 0x78909c, roughness: 0.7 });

  const steleGeom = new THREE.BoxGeometry(0.32, 0.95, 0.18);
  const baseGeom = new THREE.BoxGeometry(0.55, 0.22, 0.42);

  // 9 cap bia tu Nhat Pham den Cuu Pham (Z = 22m den 58m, cach nhau 4.5m)
  for (let rank = 1; rank <= 9; rank++) {
    const zPos = 21.0 + (rank - 1) * 4.5;

    // Hang Ta (Quan Van, ben trai truc dũng đạo, x = -5.5m)
    const baseTa = new THREE.Mesh(baseGeom, steleBaseMat);
    baseTa.position.set(-5.5, 0.11, zPos);
    baseTa.castShadow = true;
    baseTa.receiveShadow = true;
    group.add(baseTa);

    const steleTa = new THREE.Mesh(steleGeom, steleMat);
    steleTa.position.set(-5.5, 0.65, zPos);
    steleTa.castShadow = true;
    group.add(steleTa);

    // Hang Huu (Quan Vo, ben phai truc dũng đạo, x = +5.5m)
    const baseHuu = new THREE.Mesh(baseGeom, steleBaseMat);
    baseHuu.position.set(5.5, 0.11, zPos);
    baseHuu.castShadow = true;
    baseHuu.receiveShadow = true;
    group.add(baseHuu);

    const steleHuu = new THREE.Mesh(steleGeom, steleMat);
    steleHuu.position.set(5.5, 0.65, zPos);
    steleHuu.castShadow = true;
    group.add(steleHuu);
  }

  // 4. CHAU KIENG BONSAI CUNG DINH & CAY SU DAI CO THU
  const potMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.35, metalness: 0.2 });
  const potRimMat = new THREE.MeshStandardMaterial({ color: 0xd4ac0d, roughness: 0.3, metalness: 0.4 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4e3629, roughness: 0.85 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.6 });
  const flowerMat = new THREE.MeshStandardMaterial({ color: 0xfff9c4, roughness: 0.4 });

  // 8 chau kieng doc hai mep san chieu
  const potPositions = [
    [-14.0, 20.0], [14.0, 20.0],
    [-18.0, 32.0], [18.0, 32.0],
    [-18.0, 46.0], [18.0, 46.0],
    [-22.0, 60.0], [22.0, 60.0]
  ];

  potPositions.forEach(([px, pz]) => {
    const potGroup = new THREE.Group();
    potGroup.position.set(px, 0, pz);

    // Than chau su
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.65, 0.7, 16), potMat);
    pot.position.y = 0.35;
    pot.castShadow = true;
    potGroup.add(pot);

    // Vien vang men lam
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.85, 0.08, 16), potRimMat);
    rim.position.y = 0.7;
    potGroup.add(rim);

    // Than cay su co
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.7, 0),
      new THREE.Vector3(0.15, 1.3, 0.1),
      new THREE.Vector3(-0.2, 1.9, -0.1),
      new THREE.Vector3(0.1, 2.5, 0)
    ]);
    const trunk = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 12, 0.12, 8, false), trunkMat);
    trunk.castShadow = true;
    potGroup.add(trunk);

    // Cum tan la
    for (let l of [[0, 2.5, 0], [0.35, 2.3, 0.2], [-0.3, 2.2, -0.2]]) {
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), leafMat);
      foliage.position.set(l[0], l[1], l[2]);
      foliage.scale.set(1.2, 0.65, 1.2);
      foliage.castShadow = true;
      potGroup.add(foliage);

      // Diem hoa su trang vang
      const flower = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), flowerMat);
      flower.position.set(l[0] + 0.2, l[1] + 0.2, l[2] + 0.1);
      potGroup.add(flower);
    }

    group.add(potGroup);
  });

  // 5. NGUOI NHO LAM THUOC DO TY LE KIEN TRUC (SCALE FIGURES)
  // Hai thi ve dung ben hai mep them Ngu Dao, cao 1.65m dung ty le nguoi that
  const robeMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 }); // Ao quan mau do
  const headMat = new THREE.MeshStandardMaterial({ color: 0xd7a17c, roughness: 0.5 });
  const hatMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });

  for (let figX of [-2.8, 2.8]) {
    const figGroup = new THREE.Group();
    figGroup.position.set(figX, 0, 18.0);

    // Than nguoi mac ao ngu than
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.2, 12), robeMat);
    body.position.y = 0.8;
    body.castShadow = true;
    figGroup.add(body);

    // Dau
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), headMat);
    head.position.y = 1.5;
    figGroup.add(head);

    // Non phan / mu canh chuon
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.22, 0.12, 12), hatMat);
    hat.position.y = 1.62;
    figGroup.add(hat);

    group.add(figGroup);
  }

  scene.add(group);
  return group;
}

export function unregister(ctx) {
  const obj = ctx.scene.getObjectByName("wp_g1_san_dai_trieu");
  if (obj) ctx.scene.remove(obj);
}
