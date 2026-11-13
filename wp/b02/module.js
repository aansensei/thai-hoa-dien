import { thaiHoaPlan as plan } from './plan_spec.js';
import { planToScene } from './coordinates.js';
import { createThaiHoaRoofs } from './roof.js';

export function register(ctx) {
  const scene = ctx.scene;
  const group = new THREE.Group();
  group.name = "wp_b02_dien_thai_hoa";

  const loader = new THREE.TextureLoader();
  const textures = {
    tileYellowDiff: loader.load('textures_stylized/tile_hoang_luu_ly_diff.png'),
    tileYellowNor: loader.load('textures_stylized/tile_hoang_luu_ly_nor.png'),
    tileYellowRough: loader.load('textures_stylized/tile_hoang_luu_ly_rough.png'),
    colDragonDiff: loader.load('textures_stylized/column_son_son_dragon_diff.png'),
    colDragonNor: loader.load('textures_stylized/column_son_son_dragon_nor.png'),
    colDragonRough: loader.load('textures_stylized/column_son_son_dragon_rough.png'),
    mosaicDiff: loader.load('textures_stylized/mosaic_kham_sanh_su_diff.png'),
    mosaicNor: loader.load('textures_stylized/mosaic_kham_sanh_su_nor.png'),
    stoneDiff: loader.load('textures_stylized/stone_thanh_slate_diff.png'),
    stoneNor: loader.load('textures_stylized/stone_thanh_slate_nor.png'),
    stoneRough: loader.load('textures_stylized/stone_thanh_slate_rough.png'),
  };

  for (const texture of [textures.tileYellowDiff, textures.tileYellowNor, textures.tileYellowRough]) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 16;
  }
  textures.mosaicDiff.wrapS = THREE.RepeatWrapping;
  textures.mosaicDiff.repeat.set(8, 1);
  textures.stoneDiff.wrapS = textures.stoneDiff.wrapT = THREE.RepeatWrapping;

  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.stoneDiff,
    normalMap: textures.stoneNor,
    roughnessMap: textures.stoneRough,
    color: 0x90a4ae,
    roughness: 0.65
  });

  const woodLimMat = new THREE.MeshStandardMaterial({
    color: 0x361613,
    roughness: 0.5,
    metalness: 0.05
  });

  // Mau son son then tram am co truyen (khong cam choi)
  const sonThenMat = new THREE.MeshStandardMaterial({
    color: 0x5c1412,
    roughness: 0.42,
    metalness: 0.08
  });

  const sonThenDarkMat = new THREE.MeshStandardMaterial({
    color: 0x3a0c0a,
    roughness: 0.5
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf1c40f,
    roughness: 0.28,
    metalness: 0.45
  });

  const copperMat = new THREE.MeshStandardMaterial({
    color: 0x6e3d1b,
    roughness: 0.35,
    metalness: 0.7
  });

  const tileMat = new THREE.MeshStandardMaterial({
    map: textures.tileYellowDiff,
    normalMap: textures.tileYellowNor,
    normalScale: new THREE.Vector2(0.25, 0.25),
    roughnessMap: textures.tileYellowRough,
    roughness: 0.26,
    metalness: 0.15
  });

  const ridgeCeramicMat = new THREE.MeshStandardMaterial({
    map: textures.mosaicDiff,
    normalMap: textures.mosaicNor,
    roughness: 0.32,
    metalness: 0.2
  });

  // 1. NEN BE DA THANH (+1.0m)
  const platformGroup = new THREE.Group();
  platformGroup.name = "b02_platform_group";

  // Be duoi (45.5m x 32.0m, cao 0.5m)
  const baseLowerGeom = new THREE.BoxGeometry(45.5, 0.5, 32.0);
  const baseLower = new THREE.Mesh(baseLowerGeom, stoneMat);
  baseLower.position.set(0, 0.25, 0);
  baseLower.receiveShadow = true;
  baseLower.castShadow = true;
  platformGroup.add(baseLower);

  // Be tren mat san dien (44.0m x 30.5m, cao 0.5m tu 0.5m den 1.0m)
  const baseUpperGeom = new THREE.BoxGeometry(44.0, 0.5, 30.5);
  const baseUpper = new THREE.Mesh(baseUpperGeom, stoneMat);
  baseUpper.position.set(0, 0.75, 0);
  baseUpper.receiveShadow = true;
  baseUpper.castShadow = true;
  platformGroup.add(baseUpper);

  // Lan can da Thanh hai ben hoi Dong Tay
  for (let side of [-21.8, 21.8]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.75, 30.1), stoneMat);
    rail.position.set(side, 1.375, 0);
    rail.castShadow = true;
    platformGroup.add(rail);
  }
  group.add(platformGroup);

  // 2. BAC THEM & THANH BAC DA THANH (KHONG CO RONG)
  const stairsGroup = new THREE.Group();
  stairsGroup.name = "b02_stairs_group";

  // Ngu Dao (giua, rong 3.8m, 5 bac da Thanh)
  for (let s = 0; s < 5; s++) {
    const stepGeom = new THREE.BoxGeometry(3.8, 0.2, 0.4);
    const step = new THREE.Mesh(stepGeom, stoneMat);
    step.position.set(0, s * 0.2 + 0.1, 15.25 + (4 - s) * 0.4 + 0.2);
    step.receiveShadow = true;
    step.castShadow = true;
    stairsGroup.add(step);
  }

  // Thanh bac da Thanh vat doc nghieng tron phang cho Ngu Dao (KHONG CO RONG!)
  for (let bx of [-2.05, 2.05]) {
    const balShape = new THREE.Shape();
    balShape.moveTo(0, 0);
    balShape.lineTo(0, 1.0);
    balShape.lineTo(2.0, 0);
    balShape.closePath();
    const balGeom = new THREE.ExtrudeGeometry(balShape, { depth: 0.3, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.02, bevelThickness: 0.02 });
    const balMesh = new THREE.Mesh(balGeom, stoneMat);
    balMesh.rotation.y = Math.PI / 2;
    balMesh.position.set(bx - 0.15, 0.0, 15.25);
    balMesh.castShadow = true;
    balMesh.receiveShadow = true;
    stairsGroup.add(balMesh);
  }

  // Loi Quan Ta (-9.5m) va Quan Huu (+9.5m), moi loi 2.4m, 5 bac
  for (let qx of [-9.5, 9.5]) {
    for (let s = 0; s < 5; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 0.4), stoneMat);
      step.position.set(qx, s * 0.2 + 0.1, 15.25 + (4 - s) * 0.4 + 0.2);
      step.receiveShadow = true;
      stairsGroup.add(step);
    }
    for (let bx of [qx - 1.35, qx + 1.35]) {
      const balShape = new THREE.Shape();
      balShape.moveTo(0, 0);
      balShape.lineTo(0, 1.0);
      balShape.lineTo(2.0, 0);
      balShape.closePath();
      const balGeom = new THREE.ExtrudeGeometry(balShape, { depth: 0.25, bevelEnabled: false });
      const balMesh = new THREE.Mesh(balGeom, stoneMat);
      balMesh.rotation.y = Math.PI / 2;
      balMesh.position.set(bx - 0.12, 0.0, 15.25);
      balMesh.castShadow = true;
      stairsGroup.add(balMesh);
    }
  }

  // 3 loi xuong phia sau (Bac, z = -15.25 den -17.0)
  for (let qx of [-9.5, 0, 9.5]) {
    const wStep = qx === 0 ? 3.8 : 2.4;
    for (let s = 0; s < 5; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(wStep, 0.2, 0.35), stoneMat);
      step.position.set(qx, s * 0.2 + 0.1, -15.25 - (4 - s) * 0.35 - 0.17);
      step.receiveShadow = true;
      stairsGroup.add(step);
    }
  }
  group.add(stairsGroup);

  // 3. HE THONG 80 COT GO LIM SON SON THEP VANG THEO PLAN.JSON
  const columnsData = plan.he_cot.danh_sach_cot.map(c => {
    const p = planToScene({ x: c.x_m, y: c.y_m, z: c.z_m });
    return { id: c.id, hall: c.toa_nha, row: c.hang_row, type: c.loai_cot,
      x: p.x, y: p.y, z: p.z, dia: c.duong_kinh_m, h: c.chieu_cao_m };
  });

  const colMat = new THREE.MeshStandardMaterial({
    map: textures.colDragonDiff,
    normalMap: textures.colDragonNor,
    roughnessMap: textures.colDragonRough,
    roughness: 0.32,
    metalness: 0.2
  });

  const colGroup = new THREE.Group();
  colGroup.name = "b02_columns_group";

  columnsData.forEach(c => {
    const colGeom = new THREE.CylinderGeometry(c.dia * 0.48, c.dia * 0.52, c.h, 20);
    const colMesh = new THREE.Mesh(colGeom, colMat);
    colMesh.name = `column_${c.id}`;
    colMesh.userData = {
      columnId: c.id,
      hall: c.hall,
      row: c.row,
      type: c.type,
      diameter: c.dia,
      height: c.h
    };
    colMesh.position.set(c.x, c.y + c.h * 0.5, c.z);
    colMesh.castShadow = true;
    colMesh.receiveShadow = true;

    // Da tang chan cot cham sen
    const plinthGeom = new THREE.CylinderGeometry(c.dia * 0.72, c.dia * 0.82, 0.24, 16);
    const plinthMesh = new THREE.Mesh(plinthGeom, stoneMat);
    plinthMesh.name = `plinth_${c.id}`;
    plinthMesh.position.set(c.x, c.y + 0.12, c.z);
    plinthMesh.receiveShadow = true;
    plinthMesh.castShadow = true;

    colGroup.add(plinthMesh);
    colGroup.add(colMesh);
  });
  group.add(colGroup);

  // 4. VACH NHA & HE CUA BANG KHOA THUONG SONG HA BAN (SON SON THEN TRAM AM)
  const wallGroup = new THREE.Group();
  wallGroup.name = "b02_walls_group";

  // 7 gian cua thuong song ha ban phia truoc (z = +13.5)
  const xFrontBays = [-16.0, -11.7, -7.3, -2.7, 2.7, 7.3, 11.7, 16.0];
  for (let i = 0; i < xFrontBays.length - 1; i++) {
    const xMid = (xFrontBays[i] + xFrontBays[i+1]) * 0.5;
    const bWidth = Math.abs(xFrontBays[i+1] - xFrontBays[i]) - 0.45;

    // Khung nẹp bao ngoài gỗ son thẫm
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(bWidth, 4.0, 0.18), sonThenDarkMat);
    doorFrame.position.set(xMid, 1.0 + 2.0, 13.5);
    doorFrame.castShadow = true;
    wallGroup.add(doorFrame);

    // Phần trên: Thượng song (chấn song tiện vuông thông thoáng)
    const transomGeom = new THREE.BoxGeometry(bWidth - 0.3, 1.7, 0.14);
    const transom = new THREE.Mesh(transomGeom, sonThenMat);
    transom.position.set(xMid, 1.0 + 2.95, 13.5);
    wallGroup.add(transom);

    // Phần dưới: Hạ bản (ván gỗ đặc chạm lộng hoa văn)
    const panelGeom = new THREE.BoxGeometry(bWidth - 0.3, 1.8, 0.14);
    const panel = new THREE.Mesh(panelGeom, sonThenMat);
    panel.position.set(xMid, 1.0 + 1.05, 13.5);
    wallGroup.add(panel);
  }

  // Vach hoi Dong Tay (x = -20.0 va x = +20.0)
  for (let wx of [-20.0, 20.0]) {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.5, 27.5), sonThenMat);
    sideWall.position.set(wx, 1.0 + 2.25, 0);
    sideWall.castShadow = true;
    wallGroup.add(sideWall);
  }

  // Vach lung phia Bac (z = -14.5)
  const rearWall = new THREE.Mesh(new THREE.BoxGeometry(32.0, 4.5, 0.24), sonThenMat);
  rearWall.position.set(0, 1.0 + 2.25, -14.5);
  rearWall.castShadow = true;
  wallGroup.add(rearWall);
  group.add(wallGroup);

  // 5. NGAI VANG & BUU TAN (GIAN CHINH TRUNG, X = 0, Z = -5.5)
  const throneGroup = new THREE.Group();
  throneGroup.name = "b02_throne_group";

  const dais1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.2, 2.8), goldMat);
  dais1.position.set(0, 1.0 + 0.1, -5.5);
  throneGroup.add(dais1);

  const dais2 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 2.2), goldMat);
  dais2.position.set(0, 1.0 + 0.3, -5.5);
  throneGroup.add(dais2);

  const dais3 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.2, 1.6), goldMat);
  dais3.position.set(0, 1.0 + 0.5, -5.5);
  throneGroup.add(dais3);

  const chair = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.1, 0.9), sonThenMat);
  chair.position.set(0, 1.0 + 0.6 + 0.55, -5.5);
  chair.castShadow = true;
  throneGroup.add(chair);

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.35, 3.2), goldMat);
  canopy.position.set(0, 6.8, -5.5);
  canopy.castShadow = true;
  throneGroup.add(canopy);

  const tasselMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.5 });
  const tassel = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.45, 3.3), tasselMat);
  tassel.position.set(0, 6.45, -5.5);
  throneGroup.add(tassel);
  group.add(throneGroup);

  // 6. MANG THUA LUU & TRAN VOM VO CUA (Z = 0)
  const gutterGroup = new THREE.Group();
  gutterGroup.name = "b02_gutter_group";

  const gutterGeom = new THREE.BoxGeometry(43.6, 0.3, 3.0);
  const gutterMesh = new THREE.Mesh(gutterGeom, copperMat);
  gutterMesh.position.set(0, 5.6, 0);
  gutterMesh.castShadow = true;
  gutterGroup.add(gutterMesh);

  const ceilGeom = new THREE.BoxGeometry(43.2, 0.15, 3.1);
  const ceilMesh = new THREE.Mesh(ceilGeom, woodLimMat);
  ceilMesh.position.set(0, 5.2, 0);
  gutterGroup.add(ceilMesh);
  group.add(gutterGroup);

  createThaiHoaRoofs(group, {
    tile: tileMat, wood: woodLimMat,
    ridge: new THREE.MeshStandardMaterial({ color: 0xE5A93B, roughness: 0.42 })
  });

  scene.add(group);

  if (ctx.publishFootprint) {
    ctx.publishFootprint('dien_thai_hoa', [
      [-22, -15.25], [22, -15.25], [22, 15.25], [-22, 15.25]
    ]);
  }
  if (ctx.addCredit) {
    ctx.addCredit('Điện Thái Hòa theo plan.json; biên dạng mái và hệ đỡ [CẦN XÁC MINH]; thành bậc không có rồng');
  }

  return group;
}

export function unregister(ctx) {
  const obj = ctx.scene.getObjectByName("wp_b02_dien_thai_hoa");
  if (obj) ctx.scene.remove(obj);
}
