import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
// --- 3D TOXI Logo ---
let logoModel;

// Simple page loader overlay (black background with white progress bar)
function createPageLoader() {
    document.body.classList.add('body-loading');
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';

    const bar = document.createElement('div');
    bar.className = 'loading-bar';
    const fill = document.createElement('div');
    fill.className = 'loading-bar__fill';
    bar.appendChild(fill);
    overlay.appendChild(bar);
    document.body.appendChild(overlay);

    let current = 0;
    const setProgress = (value) => {
        current = Math.max(0, Math.min(100, value));
        fill.style.width = `${current}%`;
    };

    const finish = () => {
        setProgress(100);
        overlay.classList.add('loading-overlay--done');
        setTimeout(() => {
            if (overlay.parentElement) overlay.remove();
            document.body.classList.remove('body-loading');
        }, 550);
    };

    return { setProgress, finish };
}

const pageLoader = createPageLoader();
let loaderDone = false;
let loaderFakeProgress = 0;
const loaderInterval = setInterval(() => {
    loaderFakeProgress = Math.min(90, loaderFakeProgress + 8);
    pageLoader.setProgress(loaderFakeProgress);
    if (loaderFakeProgress >= 90) {
        clearInterval(loaderInterval);
    }
}, 140);

function finishLoader() {
    if (loaderDone) return;
    loaderDone = true;
    clearInterval(loaderInterval);
    pageLoader.finish();
}
window.addEventListener('load', finishLoader);

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.Fog(0x000000, 10, 60);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 20);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Post-processing (Bloom) with multisampled render target for antialiasing
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.7;
bloomPass.strength = 1.0;
bloomPass.radius = 0.2;

const renderTarget = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    {
        type: THREE.HalfFloatType,
        format: THREE.RGBAFormat,
        samples: 8
    }
);

const composer = new EffectComposer(renderer, renderTarget);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
composer.addPass(renderScene);
composer.addPass(bloomPass);

// Label Renderer
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

// OrbitControls
const controls = new OrbitControls(camera, labelRenderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = true;
controls.enableZoom = true;
controls.enableRotate = true;

// --- Particle swarm (white dots that can be sucked into the logo) ---
const particleCount = 800;
const particleGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
const particleVelocities = new Float32Array(particleCount * 3);
const emitRangeX = 50; // Arbitrary range since we don't have the line anymore
for (let i = 0; i < particleCount; i++) {
    // spawn around the center with some spread
    const x = (Math.random() - 0.5) * emitRangeX * 2;
    const y = (Math.random() - 0.5) * 1.5;
    const z = (Math.random() - 0.5) * 2.0;
    particlePositions[i * 3] = x;
    particlePositions[i * 3 + 1] = y;
    particlePositions[i * 3 + 2] = z;
    particleVelocities[i * 3] = 0;
    particleVelocities[i * 3 + 1] = 0;
    particleVelocities[i * 3 + 2] = 0;
}
particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
const particleMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, sizeAttenuation: true, transparent: true, opacity: 0.95 });
const particlePoints = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particlePoints);

// Timing for physics
let lastTime = performance.now() / 1000;

// --- Lighting (match earth.js) ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(-20, 40, -12);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
scene.add(directionalLight);

const logoLight = new THREE.DirectionalLight(0xffffff, 3);
// Position the logo light above and point it downwards onto the logo
logoLight.position.set(0, 20, 10);
logoLight.target.position.set(0, 0, 0);
scene.add(logoLight);
scene.add(logoLight.target);

// Load 3D TOXI Logo
const loader = new GLTFLoader();
loader.load('./logo.glb', (gltf) => {
    logoModel = gltf.scene;
    logoModel.position.set(0, 0, 0);
    // Make the logo smaller and rotate it to face upwards
    logoModel.scale.set(1.5, 1.5, 1.5);
    logoModel.rotation.y = 0;
    // Material: emissive for bloom, similar to earth.js
    logoModel.traverse((child) => {
        if (child.isMesh) {
            const oldMat = child.material;
            const newMat = new THREE.MeshPhysicalMaterial({
                color: oldMat.color,
                map: oldMat.map,
                metalness: 0,
                roughness: 0.5,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1,
                emissive: oldMat.color,
                emissiveIntensity: 0.2
            });
            child.material = newMat;
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    scene.add(logoModel);
    // Ensure the logo light targets the logo and casts shadows onto it
    try {
        logoLight.target = logoModel;
        logoLight.castShadow = true;
        logoLight.shadow.mapSize.width = 1024;
        logoLight.shadow.mapSize.height = 1024;
        logoLight.shadow.camera.near = 0.1;
        logoLight.shadow.camera.far = 200;
        // Add the target to the scene if not already
        if (!logoModel.parent) scene.add(logoModel);
    } catch (e) {
        // safe fallback if logoLight or logoModel aren't available yet
        console.warn('Could not set logoLight target:', e);
    }
});

// --- Starfield ---
const starsGeometry = new THREE.BufferGeometry();
const starsCount = 1200;
const starsPositions = new Float32Array(starsCount * 3);
const starsColors = new Float32Array(starsCount * 3);
const starsBlinkOffsets = new Float32Array(starsCount);

for (let i = 0; i < starsCount; i++) {
    const x = (Math.random() - 0.5) * 200;
    const y = (Math.random() - 0.5) * 200;
    const z = (Math.random() - 0.5) * 200;
    starsPositions[i * 3] = x;
    starsPositions[i * 3 + 1] = y;
    starsPositions[i * 3 + 2] = z;

    starsColors[i * 3] = 1;
    starsColors[i * 3 + 1] = 1;
    starsColors[i * 3 + 2] = 1;

    starsBlinkOffsets[i] = Math.random() * 100;
}

starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
starsGeometry.setAttribute('color', new THREE.BufferAttribute(starsColors, 3));
const starsMaterial = new THREE.PointsMaterial({ size: 0.15, sizeAttenuation: true, vertexColors: true }); // smaller stars
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// Animate
function animate() {
    requestAnimationFrame(animate);
    finishLoader();
    const timeMs = performance.now();
    const time = timeMs / 1000; // seconds

    // Animate stars blinking
    const starColors = starsGeometry.attributes.color.array;
    for (let i = 0; i < starsCount; i++) {
        const brightness = 0.7 + 0.3 * Math.sin(time * 3 + starsBlinkOffsets[i]);
        starColors[i * 3] = brightness;
        starColors[i * 3 + 1] = brightness;
        starColors[i * 3 + 2] = brightness;
    }
    starsGeometry.attributes.color.needsUpdate = true;

    // Animate directional light
    directionalLight.position.x = Math.sin(time * 0.5) * 40;

    // Animate logo float/rotation
    if (logoModel) {
        logoModel.position.y = 1 + Math.sin(time * 0.5) * 0.5;
        logoModel.rotation.y = Math.sin(time * 0.5) * (2 * Math.PI / 180);
    }

    // --- Particle physics ---
    const now = performance.now() / 1000;
    let dt = now - lastTime;
    dt = Math.min(dt, 0.05);
    lastTime = now;

    const target = new THREE.Vector3(0, 0, 0);
    if (logoModel) {
        logoModel.getWorldPosition(target);
    }

    const positionsArr = particleGeometry.attributes.position.array;
    const vels = particleVelocities;
    const attractRadius = 6.0;
    const captureRadius = 0.6;
    const attractStrength = 30.0;
    
    for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const px = positionsArr[idx];
        const py = positionsArr[idx + 1];
        const pz = positionsArr[idx + 2];

        const dx = target.x - px;
        const dy = target.y - py;
        const dz = target.z - pz;
        const distSq = dx * dx + dy * dy + dz * dz;
        const dist = Math.sqrt(distSq) + 1e-6;

        if (dist < captureRadius) {
            positionsArr[idx] = (Math.random() - 0.5) * emitRangeX * 2;
            positionsArr[idx + 1] = (Math.random() - 0.5) * 1.0;
            positionsArr[idx + 2] = (Math.random() - 0.5) * 2.0;
            vels[idx] = 0; vels[idx + 1] = 0; vels[idx + 2] = 0;
            continue;
        }

        let ax = 0, ay = 0, az = 0;
        if (dist < attractRadius) {
            const inv = 1.0 / (distSq + 0.01);
            const factor = attractStrength * inv;
            ax = dx * factor;
            ay = dy * factor;
            az = dz * factor;
        } else {
            ax = -px * 0.02;
            ay = -py * 0.02;
            az = -pz * 0.02;
        }

        vels[idx] += ax * dt;
        vels[idx + 1] += ay * dt;
        vels[idx + 2] += az * dt;

        vels[idx] *= 0.98;
        vels[idx + 1] *= 0.98;
        vels[idx + 2] *= 0.98;

        positionsArr[idx] += vels[idx] * dt;
        positionsArr[idx + 1] += vels[idx + 1] * dt;
        positionsArr[idx + 2] += vels[idx + 2] * dt;
    }
    particleGeometry.attributes.position.needsUpdate = true;
    
    labelRenderer.render(scene, camera);
    composer.render();
}

animate();
