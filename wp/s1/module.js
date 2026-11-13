// Mo-dun S1: Nhuong cho he thong Hau Canh SVG 2D Thi Sai (Version 21)
// WebGL canvas trong suot (alpha: true) de lo cac lop SVG phia sau

export function register(ctx) {
  const scene = ctx.scene;
  const group = new THREE.Group();
  group.name = "wp_s1_bau_troi";
  scene.add(group);
  return group;
}

export function unregister(ctx) {
  const obj = ctx.scene.getObjectByName("wp_s1_bau_troi");
  if (obj) ctx.scene.remove(obj);
}
