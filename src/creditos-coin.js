import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const container = document.getElementById('coin-canvas');

if (container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  // Environment map drives the mirror-like reflections on the roughness-0 gold material
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

  const keyLight = new THREE.DirectionalLight(0xfff2d6, 3.2);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0x25d366, 2.5, 20);
  rimLight.position.set(-4, -2, 3);
  scene.add(rimLight);

  let coin = null;

  new GLTFLoader().load('/toxicoin.glb', (gltf) => {
    coin = gltf.scene;

    coin.traverse((node) => {
      if (node.isMesh && node.material && node.material.name === 'gold') {
        node.material.metalness = 1;
        node.material.roughness = 0;
        node.material.envMapIntensity = 1.5;
        node.material.needsUpdate = true;
      }
    });

    const box = new THREE.Box3().setFromObject(coin);
    const size = box.getSize(new THREE.Vector3());
    const scale = 2.6 / Math.max(size.x, size.y, size.z);
    coin.scale.setScalar(scale);
    coin.position.sub(box.getCenter(new THREE.Vector3()).multiplyScalar(scale));

    scene.add(coin);
  });

  function resize() {
    const size = container.clientWidth;
    renderer.setSize(size, size);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  const ROTATION_SPEED = 0.35; // rad/sec, slow spin

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (coin) {
      coin.rotation.y += delta * ROTATION_SPEED;
    }
    renderer.render(scene, camera);
  }
  animate();
}
