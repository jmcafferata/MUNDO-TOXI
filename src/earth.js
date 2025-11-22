import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Black background
//scene.fog = new THREE.Fog(0x000000, 20, 100); // Black fog

// Camera setup
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(60, 0, 0);

// VR Dolly
const dolly = new THREE.Group();
scene.add(dolly);
dolly.add(camera);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

// VR Controllers
const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);

// Store input sources to access gamepads
const controllerInputSources = { left: null, right: null };

function onControllerConnected(event) {
    const handedness = event.data.handedness;
    if (handedness) {
        controllerInputSources[handedness] = event.data;
    }
}

function onControllerDisconnected(event) {
    const handedness = event.data.handedness;
    if (handedness) {
        controllerInputSources[handedness] = null;
    }
}

controller1.addEventListener('connected', onControllerConnected);
controller1.addEventListener('disconnected', onControllerDisconnected);
controller2.addEventListener('connected', onControllerConnected);
controller2.addEventListener('disconnected', onControllerDisconnected);

// Post-processing (Bloom)
const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.12; // Lower threshold to make sure points glow
bloomPass.strength = 0.35;
bloomPass.radius = 0.6;

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

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.minDistance = 30;
controls.maxDistance = 100;

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 20, 50);
scene.add(directionalLight);

// Static Light for Logo
const logoLight = new THREE.DirectionalLight(0xffffff, 3);
logoLight.position.set(50, 0, 0);
scene.add(logoLight);

// Stars
const starsGeometry = new THREE.BufferGeometry();
const starsCount = 2000;
const starsPositions = new Float32Array(starsCount * 3);
const starsColors = new Float32Array(starsCount * 3);
const starsBlinkOffsets = new Float32Array(starsCount);

for (let i = 0; i < starsCount; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
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
const starsMaterial = new THREE.PointsMaterial({ size: 0.7, sizeAttenuation: true, vertexColors: true });
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// Earth Points
const radius = 24;
const segments = 124; // High density for "dots" look
const geometry = new THREE.SphereGeometry(radius, segments, segments);

// We need to access positions to update colors
const count = geometry.attributes.position.count;
const colors = new Float32Array(count * 3);

// Initialize colors to black
const blinkOffsets = new Float32Array(count);
for (let i = 0; i < count; i++) {
    colors[i * 3] = 0;
    colors[i * 3 + 1] = 0;
    colors[i * 3 + 2] = 0;
    blinkOffsets[i] = Math.random() * Math.PI * 2;
}

geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9
});

const earthPoints = new THREE.Points(geometry, material);
scene.add(earthPoints);

// Black Planet (Occluder)
const blackPlanetGeometry = new THREE.SphereGeometry(radius - 0.1, 64, 64);
const blackPlanetMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x000000, 
    transparent: true, 
    opacity: 0
});
const blackPlanet = new THREE.Mesh(blackPlanetGeometry, blackPlanetMaterial);
blackPlanet.renderOrder = -1; // Render before points
earthPoints.add(blackPlanet);

// --- City Markers ---
function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));

    return new THREE.Vector3(x, y, z);
}

const countries = [
    { name: 'Argentina', lat: -38.4161, lon: -63.6167 },
    { name: 'Brazil', lat: -14.2350, lon: -51.9253 },
    { name: 'USA', lat: 37.0902, lon: -95.7129 },
    { name: 'UK', lat: 55.3781, lon: -3.4360 },
    { name: 'Tanzania', lat: -6.3690, lon: 34.8888 },
    { name: 'South Africa', lat: -30.5595, lon: 22.9375 },
    { name: 'Chile', lat: -35.6751, lon: -71.5430 },
    { name: 'Uruguay', lat: -32.5228, lon: -55.7658 }
];

const markerGeometry = new THREE.SphereGeometry(0.2, 8, 8);
const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }); // White markers
const countryLabels = [];

countries.forEach(country => {
    const pos = latLonToVector3(country.lat, country.lon, radius);
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.copy(pos);
    marker.userData = { name: country.name };
    
    // Create Label
    const div = document.createElement('div');
    div.textContent = country.name;
    div.style.marginTop = '-1em';
    div.style.color = 'white';
    div.style.fontSize = '12px';
    div.style.fontWeight = '300';
    div.style.fontFamily = '"Helvetica Now", sans-serif';
    div.style.pointerEvents = 'none'; // Let clicks pass through
    countryLabels.push(div);
    
    const label = new CSS2DObject(div);
    label.position.set(0, 0.5, 0); // Offset label slightly above marker
    marker.add(label);

    earthPoints.add(marker); // Add to earthPoints so they rotate with it
});

// --- Connections ---
const connections = [
    ['Argentina', 'Chile'],
    ['Argentina', 'Uruguay'],
    ['Argentina', 'USA'],
    ['Argentina', 'UK'],
    ['Argentina', 'Tanzania'],
    ['Argentina', 'South Africa'],
    ['USA', 'Tanzania'],
    ['Argentina', 'Brazil']
];

const countryMap = {};
countries.forEach(c => {
    countryMap[c.name] = latLonToVector3(c.lat, c.lon, radius);
});

const connectionMaterial = new THREE.LineBasicMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.4 
});

const animatedDots = [];
const dotGeometry = new THREE.SphereGeometry(0.08, 8, 8);
const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });

connections.forEach(pair => {
    const p1 = countryMap[pair[0]];
    const p2 = countryMap[pair[1]];

    if (p1 && p2) {
        const v1 = new THREE.Vector3(p1.x, p1.y, p1.z);
        const v2 = new THREE.Vector3(p2.x, p2.y, p2.z);
        
        const distance = v1.distanceTo(v2);
        
        // Control point for the curve (midpoint projected outwards)
        // The height of the arc depends on the distance between points
        const control = v1.clone().add(v2).multiplyScalar(0.5).normalize().multiplyScalar(radius + distance * 0.5);
        
        const curve = new THREE.QuadraticBezierCurve3(v1, control, v2);
        const points = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        const line = new THREE.Line(geometry, connectionMaterial);
        earthPoints.add(line);

        // Create traveling dot
        const dot = new THREE.Mesh(dotGeometry, dotMaterial);
        earthPoints.add(dot);
        
        const curveLength = curve.getLength();
        const speed = 0.03; // Constant speed in world units per frame

        animatedDots.push({
            curve: curve,
            mesh: dot,
            t: Math.random(), // Start at random position
            direction: 1,
            speed: speed / curveLength // Adjust t-increment based on length
        });
    }
});

// Load World SVG for Outlines
const svgLoader = new SVGLoader();
svgLoader.load('./world.svg', function (data) {
    const paths = data.paths;
    const group = new THREE.Group();
    
    // Get SVG dimensions from viewBox
    const xml = data.xml;
    let width = 1000; // Default fallback
    let height = 500;
    
    if (xml.viewBox && xml.viewBox.baseVal) {
        width = xml.viewBox.baseVal.width;
        height = xml.viewBox.baseVal.height;
    } else {
        // Try getting width/height attributes
        const w = xml.getAttribute('width');
        const h = xml.getAttribute('height');
        if (w && h) {
            width = parseFloat(w);
            height = parseFloat(h);
        }
    }

    const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3
    });

    for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        
        const shapes = path.toShapes(true);
        
        // Iterate over subPaths to get points
        path.subPaths.forEach((subPath) => {
            const points = subPath.getPoints();
            const vertices = [];

            for (let j = 0; j < points.length; j++) {
                const point = points[j];
                
                // Map SVG (x, y) to (lon, lat)
                // Assuming equirectangular projection
                // x: 0..width -> -180..180
                // y: 0..height -> 90..-90
                
                const lon = (point.x / width) * 360 - 180;
                const lat = 90 - (point.y / height) * 180;
                
                // Convert to 3D position
                // Use slightly larger radius to float above points
                const vec = latLonToVector3(lat, lon, radius + 0.1); 
                vertices.push(vec.x, vec.y, vec.z);
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            
            const line = new THREE.Line(geometry, material);
            group.add(line);
        });
    }
    
    // Add group to earthPoints so it rotates with the earth
    earthPoints.add(group);
});

// Load 3D Logo
let logoModel;
const loader = new GLTFLoader();
loader.load('./logo.glb', (gltf) => {
    logoModel = gltf.scene;
    
    // Center and scale
    logoModel.position.set(0, 0, 0); 
    logoModel.scale.set(4, 4, 4);
    logoModel.rotation.y = -Math.PI / 2; // Upright

    // Material
    logoModel.traverse((child) => {
        if (child.isMesh) {
            const oldMat = child.material;
            child.material = new THREE.MeshStandardMaterial({
                color: oldMat.color,
                map: oldMat.map,
                metalness: 0.5,
                roughness: 0.2,
                emissive: 0xffffff,
                emissiveMap: oldMat.map,
                emissiveIntensity: 0
            });
        }
    });

    scene.add(logoModel);
});

// Animation Loop
const clock = new THREE.Clock();
const startCameraPos = new THREE.Vector3(60, 0, 0);
let earthRotationY = 0;
let currentRotationSpeed = 0.05;

function animate() {
    // requestAnimationFrame(animate); // Removed for VR compatibility
    
    controls.update();

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    // Check camera position
    const dist = camera.position.distanceTo(startCameraPos);
    const isMoved = dist > 1.0;

    // Interpolate Opacity
    const targetOpacity = isMoved ? 1 : 0;
    blackPlanet.material.opacity = THREE.MathUtils.lerp(blackPlanet.material.opacity, targetOpacity, delta * 2);
    
    // Toggle visibility/depth write to avoid invisible occlusion
    if (blackPlanet.material.opacity > 0.01) {
        blackPlanet.visible = true;
    } else {
        blackPlanet.visible = false;
    }

    // Interpolate Rotation Speed
    const targetSpeed = isMoved ? 0 : 0.05;
    currentRotationSpeed = THREE.MathUtils.lerp(currentRotationSpeed, targetSpeed, delta * 2);
    
    earthRotationY += currentRotationSpeed * delta;

    // Rotate Earth
    earthPoints.rotation.y = earthRotationY;

    // Fade out countries and connections based on distance
    const distToCenter = camera.position.length();
    // Fade out between 55 and 45 (starts fading at 55, gone at 45)
    let elementsOpacity = THREE.MathUtils.clamp((distToCenter - 45) / 10, 0, 1);
    
    markerMaterial.opacity = elementsOpacity;
    dotMaterial.opacity = elementsOpacity;
    connectionMaterial.opacity = elementsOpacity * 0.4;
    material.opacity = elementsOpacity * 0.9;
    
    countryLabels.forEach(div => {
        div.style.opacity = elementsOpacity;
    });

    // Rotate Logo
    if (logoModel) {
        logoModel.rotation.y = time * 0.2; // Rotate faster than earth
    }

    // Update Stars
    const starColors = stars.geometry.attributes.color.array;
    for(let i = 0; i < starsCount; i++) {
        // More subtle flicker: base brightness 0.7, variation +/- 0.3
        const brightness = 0.7 + 0.3 * Math.sin(time * 3 + starsBlinkOffsets[i]);
        starColors[i * 3] = brightness;
        starColors[i * 3 + 1] = brightness;
        starColors[i * 3 + 2] = brightness;
    }
    stars.geometry.attributes.color.needsUpdate = true;

    // Animate Dots
    animatedDots.forEach(obj => {
        obj.t += obj.speed * obj.direction;
        
        if (obj.t >= 1) {
            obj.t = 1;
            obj.direction = -1;
        } else if (obj.t <= 0) {
            obj.t = 0;
            obj.direction = 1;
        }
        
        const point = obj.curve.getPoint(obj.t);
        obj.mesh.position.copy(point);
    });

    // Move Light
    // directionalLight.position.x = Math.sin(time * 0.5) * 40;
    // directionalLight.position.z = Math.cos(time * 0.5) * 40;
    
    const lx = directionalLight.position.x;
    const ly = directionalLight.position.y;
    const lz = directionalLight.position.z;

    // Update colors based on light position
    // We need to transform vertex positions to world space to compare with light, 
    // or transform light to local space. Transforming light to local space is cheaper.
    
    // Since the earth rotates, the local positions are constant, but the world positions change.
    // Let's calculate distance in world space.
    
    const positions = earthPoints.geometry.attributes.position.array;
    const colors = earthPoints.geometry.attributes.color.array;
    const worldPosition = new THREE.Vector3();

    // Optimization: Don't update every frame if too heavy, but for points it should be fine.
    // To optimize, we can do the calculation in a shader, but JS is requested.
    
    // Let's use the logic from main.js: distance to light determines brightness.
    // But here we have a sphere.
    
    // We can iterate through all points.
    for (let i = 0; i < count; i++) {
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];

        worldPosition.set(x, y, z);
        worldPosition.applyMatrix4(earthPoints.matrixWorld);

        const dx = worldPosition.x - lx;
        const dy = worldPosition.y - ly;
        const dz = worldPosition.z - lz;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

        // Light attenuation
        // Closest point is approx 25 units away (40 orbit - 15 radius).
        // We adjust the formula to ensure the closest side is bright (near 1.0)
        let lightIntensity = Math.max(0, (70 - dist) / 40); 
        lightIntensity = Math.pow(lightIntensity, 2); 

        // Add base ambient
        const ambient = 0.05;

        // Blink effect
        const blink = Math.sin(time * 3 + blinkOffsets[i]);
        const blinkFactor = (blink + 1) / 2; // 0..1

        const finalColor = Math.min(1, (lightIntensity + ambient) * blinkFactor);

        colors[i * 3] = finalColor;
        colors[i * 3 + 1] = finalColor;
        colors[i * 3 + 2] = finalColor;
    }

    earthPoints.geometry.attributes.color.needsUpdate = true;

    // VR Controller Movement
    if (renderer.xr.isPresenting) {
        const moveSpeed = 10 * delta; // Units per second
        const rotSpeed = 1.5 * delta; // Radians per second

        // Left Controller: Strafe (X) and Forward/Back (Z)
        if (controllerInputSources.left && controllerInputSources.left.gamepad) {
            const gp = controllerInputSources.left.gamepad;
            // Standard mapping: axes[2] = thumbstick X, axes[3] = thumbstick Y
            // Fallback to [0], [1] if not standard
            const x = gp.axes[2] !== undefined ? gp.axes[2] : (gp.axes[0] || 0);
            const z = gp.axes[3] !== undefined ? gp.axes[3] : (gp.axes[1] || 0);

            // Deadzone
            if (Math.abs(x) > 0.1) dolly.translateX(x * moveSpeed);
            if (Math.abs(z) > 0.1) dolly.translateZ(z * moveSpeed);
        }

        // Right Controller: Rotate (X) and Lift/Descend (Y)
        if (controllerInputSources.right && controllerInputSources.right.gamepad) {
            const gp = controllerInputSources.right.gamepad;
            const x = gp.axes[2] !== undefined ? gp.axes[2] : (gp.axes[0] || 0);
            const y = gp.axes[3] !== undefined ? gp.axes[3] : (gp.axes[1] || 0);

            // Deadzone
            if (Math.abs(x) > 0.1) dolly.rotateY(-x * rotSpeed);
            if (Math.abs(y) > 0.1) dolly.translateY(-y * moveSpeed);
        }
        
        renderer.render(scene, camera);
    } else {
        composer.render();
        labelRenderer.render(scene, camera);
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

// VR Session Handling
renderer.xr.addEventListener('sessionstart', () => {
    // Move dolly to current camera position so VR user starts there
    const pos = camera.position.clone();
    dolly.position.copy(pos);
    dolly.lookAt(0, 0, 0);
    
    // Reset camera local position (WebXR will override, but good to be clean)
    camera.position.set(0, 0, 0);
    
    controls.enabled = false;
});

renderer.xr.addEventListener('sessionend', () => {
    dolly.position.set(0, 0, 0);
    dolly.rotation.set(0, 0, 0);
    camera.position.set(60, 0, 0); // Reset to default
    camera.lookAt(0, 0, 0);
    controls.enabled = true;
    controls.reset();
});

renderer.setAnimationLoop(animate);
