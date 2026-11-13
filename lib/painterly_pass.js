export function createPainterlyPass(renderer) {
  const target = new THREE.WebGLRenderTarget(1, 1, {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat});
  target.texture.encoding = THREE.sRGBEncoding;
  const material = new THREE.ShaderMaterial({
    uniforms: {image: {value: target.texture}, texel: {value: new THREE.Vector2(1, 1)}, strength: {value: 0.25}},
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      uniform sampler2D image;
      uniform vec2 texel;
      uniform float strength;
      varying vec2 vUv;
      void main() {
        vec4 center = texture2D(image, vUv);
        vec3 glow = vec3(0.0);
        for (int x = -1; x <= 1; x++) {
          for (int y = -1; y <= 1; y++) {
            vec4 sampleColor = texture2D(image, vUv + vec2(float(x), float(y)) * texel * 3.0);
            float luma = dot(sampleColor.rgb, vec3(0.2126, 0.7152, 0.0722));
            glow += sampleColor.rgb * smoothstep(0.64, 1.0, luma) * sampleColor.a / 9.0;
          }
        }
        vec3 color = center.rgb + glow * vec3(1.0, 0.85, 0.61) * strength * center.a;
        float vignette = 1.0 - 0.12 * dot(vUv - 0.5, vUv - 0.5);
        color *= vignette;
        gl_FragColor = vec4(color, center.a);
      }`,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.NoBlending
  });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  scene.add(quad);
  const size = new THREE.Vector2();
  renderer.info.autoReset = false;
  return {
    enabled: true,
    render(world, worldCamera) {
      renderer.info.reset();
      if (!this.enabled) {
        renderer.setRenderTarget(null);
        renderer.render(world, worldCamera);
        return;
      }
      renderer.getDrawingBufferSize(size);
      if (target.width !== size.x || target.height !== size.y) {
        target.setSize(size.x, size.y);
        material.uniforms.texel.value.set(1 / size.x, 1 / size.y);
      }
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(world, worldCamera);
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    }
  };
}
