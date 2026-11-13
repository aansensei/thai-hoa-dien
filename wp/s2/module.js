// Mo-dun S2: Anh sang chieu sang kien truc Dien Thai Hoa va bong do mem
// Phuc vu canvas trong suot ket hop SVG Thi Sai

export function register(ctx) {
  const scene = ctx.scene;
  const group = new THREE.Group();
  group.name = "wp_s2_anh_sang_hau_ky";

  // Khong dung suong mu dac de nhin ro cac lop SVG hau canh
  scene.fog = null;

  // Anh sang moi truong (Ambient light) am ap, ro tung thớ go va da
  const ambLight = new THREE.AmbientLight(0xfff5eb, 0.42);
  group.add(ambLight);

  // Hemisphere light mo phong anh sang bau troi va phan xa mat dat
  const hemiLight = new THREE.HemisphereLight(0xe8f4f8, 0xd5dbdb, 0.45);
  group.add(hemiLight);

  // Anh sang mat troi chieu xiên tu huong Tay Nam (Directional Light)
  const sunLight = new THREE.DirectionalLight(0xfff3e0, 1.65);
  sunLight.position.set(28, 25, 38);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 120;
  sunLight.shadow.camera.left = -35;
  sunLight.shadow.camera.right = 35;
  sunLight.shadow.camera.top = 25;
  sunLight.shadow.camera.bottom = -15;
  sunLight.shadow.bias = -0.0003;
  group.add(sunLight);

  scene.add(group);
  return group;
}

export function unregister(ctx) {
  const obj = ctx.scene.getObjectByName("wp_s2_anh_sang_hau_ky");
  if (obj) ctx.scene.remove(obj);
}
