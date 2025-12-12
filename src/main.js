import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import TWEEN from '@tweenjs/tween.js';

// Simple Noise implementation if package not available, or use a library.
// Since I cannot easily install new packages without user input, I will include a small noise utility here.

// --- Simplex Noise Utility (Minimal) ---
// Ported from standard implementations
class SimplexNoise {
    constructor() {
        this.grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
                      [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
                      [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
        this.p = [];
        for (let i=0; i<256; i++) {
            this.p[i] = Math.floor(Math.random()*256);
        }
        this.perm = [];
        for(let i=0; i<512; i++) {
            this.perm[i]=this.p[i & 255];
        }
    }
    dot(g, x, y) {
        return g[0]*x + g[1]*y;
    }
    noise(xin, yin) {
        let n0, n1, n2; // Noise contributions from the three corners
        // Skew the input space to determine which simplex cell we're in
        const F2 = 0.5*(Math.sqrt(3.0)-1.0);
        const s = (xin+yin)*F2; // Hairy factor for 2D
        const i = Math.floor(xin+s);
        const j = Math.floor(yin+s);
        const G2 = (3.0-Math.sqrt(3.0))/6.0;
        const t = (i+j)*G2;
        const X0 = i-t; // Unskew the cell origin back to (x,y) space
        const Y0 = j-t;
        const x0 = xin-X0; // The x,y distances from the cell origin
        const y0 = yin-Y0;
        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.
        let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
        if(x0>y0) {i1=1; j1=0;} // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        else {i1=0; j1=1;}      // upper triangle, YX order: (0,0)->(0,1)->(1,1)
        // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
        // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
        // c = (3-sqrt(3))/6
        const x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
        const y2 = y0 - 1.0 + 2.0 * G2;
        // Work out the hashed gradient indices of the three simplex corners
        const ii = i & 255;
        const jj = j & 255;
        const gi0 = this.perm[ii+this.perm[jj]] % 12;
        const gi1 = this.perm[ii+i1+this.perm[jj+j1]] % 12;
        const gi2 = this.perm[ii+1+this.perm[jj+1]] % 12;
        // Calculate the contribution from the three corners
        let t0 = 0.5 - x0*x0 - y0*y0;
        if(t0<0) n0 = 0.0;
        else {
            t0 *= t0;
            n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);
        }
        let t1 = 0.5 - x1*x1 - y1*y1;
        if(t1<0) n1 = 0.0;
        else {
            t1 *= t1;
            n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
        }
        let t2 = 0.5 - x2*x2 - y2*y2;
        if(t2<0) n2 = 0.0;
        else {
            t2 *= t2;
            n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 70.0 * (n0 + n1 + n2);
    }
}

const simplex = new SimplexNoise();

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Black background
scene.fog = new THREE.Fog(0x000000, 20, 60); // Black fog

// Camera setup for Perspective view
const isMobile = window.innerWidth < 768;
const startFov = isMobile ? 120 : 90;
const camera = new THREE.PerspectiveCamera(startFov, window.innerWidth / window.innerHeight, 1, 1000);
scene.add(camera); // Add camera to scene so children are rendered


// Initial position
camera.position.set(0, 30, 0); // High angle, looking down
camera.up.set(0, 1, 0); // Ensure up is Y
camera.lookAt(scene.position); // Look at center (0,0,0)

// Renderer setup
const MAX_CANVAS_WIDTH = 1920;
const MAX_CANVAS_HEIGHT = 1080;

function getClampedDimensions() {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    const aspect = w / h;
    
    let cw = w;
    let ch = h;
    
    // Clamp max resolution while maintaining aspect ratio
    if (cw > MAX_CANVAS_WIDTH) {
        cw = MAX_CANVAS_WIDTH;
        ch = cw / aspect;
    }
    if (ch > MAX_CANVAS_HEIGHT) {
        ch = MAX_CANVAS_HEIGHT;
        cw = ch * aspect;
    }
    
    return { cw: Math.floor(cw), ch: Math.floor(ch), finalPR: 1 };
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
const { cw: initialW, ch: initialH, finalPR: initialPR } = getClampedDimensions();
renderer.setPixelRatio(initialPR);
renderer.setSize(initialW, initialH, false); // drawing buffer size (CSS will remain full-screen)
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Fade overlay
const fadeDiv = document.createElement('div');
fadeDiv.style.position = 'fixed';
fadeDiv.style.top = '0';
fadeDiv.style.left = '0';
fadeDiv.style.width = '100%';
fadeDiv.style.height = '100%';
fadeDiv.style.backgroundColor = 'black';
fadeDiv.style.opacity = '0';
fadeDiv.style.pointerEvents = 'none';
fadeDiv.style.zIndex = '1000';
fadeDiv.style.transition = 'opacity 3s ease-out';
document.body.appendChild(fadeDiv);

// Helper to fade to black then navigate. Options: { force, duration }
function navigateWithFade(url, { force = false, duration = 3000 } = {}) {
    if (!url) return;
    if (window._navigating && !force) return;
    window._navigating = true;

    // ensure transition duration matches requested duration
    fadeDiv.style.transition = `opacity ${duration}ms ease-out`;
    // enable pointer events so user can't interact during fade
    fadeDiv.style.pointerEvents = 'auto';

    // trigger the fade (use rAF to ensure computed style before change)
    requestAnimationFrame(() => {
        fadeDiv.style.opacity = '1';
    });

    // Fade out music
    if (window.currentAudio) {
        const audio = window.currentAudio;
        const startVolume = audio.volume;
        const fadeStep = startVolume / (duration / 50); // 50ms steps
        
        const fadeInterval = setInterval(() => {
            if (audio.volume > fadeStep) {
                audio.volume -= fadeStep;
            } else {
                audio.volume = 0;
                clearInterval(fadeInterval);
            }
        }, 50);
    }

    setTimeout(() => {
        window.location.href = url;
    }, duration);
}

// Post-processing (Bloom)
const renderScene = new RenderPass(scene, camera);

const { cw: _bw, ch: _bh, finalPR: _bpr } = getClampedDimensions();
const bloomPass = new UnrealBloomPass(new THREE.Vector2(Math.floor(_bw * _bpr), Math.floor(_bh * _bpr)), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.7;
bloomPass.strength = 1.0;
bloomPass.radius = 0.2;

const renderTarget = new THREE.WebGLRenderTarget(
    Math.floor(_bw * _bpr),
    Math.floor(_bh * _bpr),
    {
        type: THREE.HalfFloatType,
        format: THREE.RGBAFormat,
        samples: 8
    }
);

const composer = new EffectComposer(renderer, renderTarget);
composer.setPixelRatio(_bpr);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// Label Renderer
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none'; // Allow clicks to pass through
labelRenderer.domElement.style.zIndex = '1'; // Ensure it's above WebGL but below UI
document.body.appendChild(labelRenderer.domElement);

// CSS3D Renderer
const css3dRenderer = new CSS3DRenderer();
css3dRenderer.setSize(window.innerWidth, window.innerHeight);
css3dRenderer.domElement.style.position = 'absolute';
css3dRenderer.domElement.style.top = '0px';
css3dRenderer.domElement.style.pointerEvents = 'none'; // Allow clicks to pass through to WebGL
css3dRenderer.domElement.style.zIndex = '1'; // Ensure it's above WebGL but below UI
document.body.appendChild(css3dRenderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableRotate = false; // Disable rotation
controls.enableZoom = false;   // Disable zoom (using custom FOV zoom)
controls.enablePan = true;     // Enable panning

// Remap controls for panning with left click and touch
controls.mouseButtons = {
    LEFT: THREE.MOUSE.PAN,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN
};

controls.touches = {
    ONE: THREE.TOUCH.PAN,
    TWO: THREE.TOUCH.DOLLY_PAN
};

// Function to show thumbnails on interaction
function showThumbnails() {
    console.log('showThumbnails triggered');
    if (thumbnailsVisible) return;
    thumbnailsVisible = true;
    
    // Show Thumbnails
    thumbnailDivs.forEach(div => {
        div.style.opacity = '1';
    });

    // Remove listeners as we only need to trigger this once
    controls.removeEventListener('change', showThumbnails);
    window.removeEventListener('touchstart', showThumbnails);
    window.removeEventListener('mousedown', showThumbnails);
    window.removeEventListener('wheel', showThumbnails);
    window.removeEventListener('pointerdown', showThumbnails);
    window.removeEventListener('mousemove', showThumbnails);
    window.removeEventListener('keydown', showThumbnails);
}

controls.addEventListener('change', showThumbnails);
window.addEventListener('touchstart', showThumbnails);
window.addEventListener('mousedown', showThumbnails);
window.addEventListener('wheel', showThumbnails);
window.addEventListener('pointerdown', showThumbnails);
window.addEventListener('mousemove', showThumbnails);
window.addEventListener('keydown', showThumbnails);

// Arrow key movement
let targetPosition = null;
let movementStartTime = null;
let currentSpeed = 0;
const maxSpeed = 2.5;
const acceleration = 0.1; // Higher acceleration

window.addEventListener('keydown', (event) => {
    // Immediate navigation on arrow keys: left/right/up/down
    // Left -> line.html
    // Right -> earth.html
    // Up -> plantform
    // Down -> instagram
    switch (event.key) {
        case 'ArrowLeft':
            event.preventDefault();
            navigateWithFade('line.html', { force: true, duration: 3000 });
            return;
        case 'ArrowRight':
            event.preventDefault();
            navigateWithFade('earth.html', { force: true, duration: 3000 });
            return;
        case 'ArrowUp':
            event.preventDefault();
            navigateWithFade('https://toxii.webflow.io/plantform', { force: true, duration: 3000 });
            return;
        case 'ArrowDown':
            event.preventDefault();
            navigateWithFade('https://www.instagram.com/toxi.media/', { force: true, duration: 3000 });
            return;
        default:
            return;
    }
});

// Custom FOV Zoom (Wheel & Pinch)
const minFov = 15;
const maxFov = isMobile ? 120 : 90;
let targetFov = camera.fov;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Plane y=0

// Track mouse position
renderer.domElement.addEventListener('mousemove', (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
});

renderer.domElement.addEventListener('wheel', (event) => {
    event.preventDefault();
    targetFov += event.deltaY * 0.05;
    targetFov = Math.max(minFov, Math.min(maxFov, targetFov));
}, { passive: false });

// Simple Touch Pinch handler
let initialPinchDist = 0;
let initialFov = 0;

renderer.domElement.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        const dx = e.touches[0].pageX - e.touches[1].pageX;
        const dy = e.touches[0].pageY - e.touches[1].pageY;
        initialPinchDist = Math.sqrt(dx * dx + dy * dy);
        initialFov = camera.fov;
    }
}, { passive: false });

renderer.domElement.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].pageX - e.touches[1].pageX;
        const dy = e.touches[0].pageY - e.touches[1].pageY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (initialPinchDist > 0) {
            const scale = initialPinchDist / dist;
            camera.fov = Math.max(minFov, Math.min(maxFov, initialFov * scale));
            targetFov = camera.fov; // Update targetFov to prevent snapback
            camera.updateProjectionMatrix();
        }
    }
}, { passive: false });

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
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

// Shadow Plane (invisible but receives shadows)
const planeGeometry = new THREE.PlaneGeometry(200, 200);
const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
const shadowPlane = new THREE.Mesh(planeGeometry, planeMaterial);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -2; // Slightly below the points
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

// Digital Ocean - Sea of Nodes
const gridSize = 100; // Increased grid size for points
const spacing = 1.0;
const particleCount = (gridSize * 2 + 1) ** 2;

const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);
const initialPositions = []; // To store x, z for noise

let idx = 0;
for (let x = -gridSize; x <= gridSize; x++) {
    for (let z = -gridSize; z <= gridSize; z++) {
        const px = x * spacing;
        const pz = z * spacing;
        
        positions[idx] = px;
        positions[idx + 1] = 0;
        positions[idx + 2] = pz;
        
        // Default color
        colors[idx] = 0;
        colors[idx + 1] = 0;
        colors[idx + 2] = 0;

        initialPositions.push({ x: px, z: pz });
        
        idx += 3;
    }
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({ 
    size: 0.1, 
    vertexColors: true,
    sizeAttenuation: true
});

const points = new THREE.Points(geometry, material);
scene.add(points);

// Load 3D Logo
let logoModel;
const loader = new GLTFLoader();
loader.load('./logo.glb', (gltf) => {
    logoModel = gltf.scene;
    
    // Center and scale
    logoModel.position.set(0, 0, 0); // Float above the waves
    logoModel.scale.set(5, 5, 5); // Make it big
    // rotate 270 degrees on X to stand upright
    logoModel.rotation.x = -Math.PI / 2; // Rotate -90 degrees

    // Make it shiny and cheto
    logoModel.traverse((child) => {
        if (child.isMesh) {
            // Create a shiny material preserving the original color map if it exists
            const oldMat = child.material;
            
            const newMat = new THREE.MeshPhysicalMaterial({
                color: oldMat.color,
                map: oldMat.map, // Keep texture if any
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
}, undefined, (error) => {
    console.error('An error occurred loading the logo:', error);
});

// Pillars with Labels
const clickableObjects = [];

function createPillar(name, x, z, color) {
    // Pillar Geometry - Flat Cylinder (Button)
    const geometry = new THREE.CylinderGeometry(3, 3, 0.5, 32);
    const material = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.2,
        metalness: 0.8
    });
    const pillar = new THREE.Mesh(geometry, material);
    pillar.position.set(x, 1, z); // Positioned slightly above to clear waves
    pillar.userData = { color: color }; // Store color for click interaction
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    scene.add(pillar);
    clickableObjects.push(pillar);

    // Label
    const div = document.createElement('div');
    div.className = 'label';
    div.textContent = name;
    div.style.marginTop = '-1em';
    const label = new CSS2DObject(div);
    label.position.set(0, 2, 0); // Above the pillar
    pillar.add(label);
    
    return pillar;
}

// Content Buttons (Initially hidden)
const contentButtons = [];
const hoverThumbnails = [];
const thumbnailDivs = [];
let thumbnailsVisible = false;

function createContentButton(name, x, z, color, onClick) {
    // Smaller button for content
    const geometry = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 32);
    const material = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.2,
        metalness: 0.8
    });
    const button = new THREE.Mesh(geometry, material);
    button.position.set(x, -5, z); // Start hidden below
    button.userData = { color: color, isContent: true, onClick: onClick };
    button.castShadow = true;
    button.receiveShadow = true;
    scene.add(button);
    clickableObjects.push(button);

    // Label
    const div = document.createElement('div');
    div.className = 'label';
    div.textContent = name;
    div.style.fontSize = '10px';
    div.style.marginTop = '-0.5em';
    const label = new CSS2DObject(div);
    label.position.set(0, 1.5, 0);
    button.add(label);
    
    contentButtons.push(button);
    return button;
}

function createVideoThumbnail(title, videoId, credits, thumbUrl, x, y, z) {
    const div = document.createElement('div');
    div.style.width = '1280px';
    div.style.height = '720px';
    div.style.backgroundColor = '#000';
    
    // Initial visibility state
    div.style.opacity = '0';
    // Force pointer-events: none with !important to ensure it passes through
    div.style.setProperty('pointer-events', 'none', 'important');
    div.style.setProperty('user-select', 'none', 'important');
    div.style.transition = 'opacity 1s ease-in-out';
    thumbnailDivs.push(div);

    const img = document.createElement('img');
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.src = thumbUrl;
    // Prevent native dragging of the image
    img.draggable = false;
    img.style.setProperty('user-select', 'none', 'important');
    img.style.setProperty('pointer-events', 'none', 'important');
    div.appendChild(img);

    const object = new CSS3DObject(div);
    object.position.set(x, y, z);
    const baseScale = 0.02;
    const hoverScale = baseScale * 1.08;
    object.scale.set(baseScale, baseScale, baseScale);
    
    object.rotation.y = Math.PI;
    object.rotation.x = Math.PI / 2;
    object.rotation.z = Math.PI;

    scene.add(object);

    // Create Hitbox for Raycasting
    const planeGeo = new THREE.PlaneGeometry(1280 * baseScale, 720 * baseScale);
    const planeMat = new THREE.MeshBasicMaterial({ 
        visible: false, 
        side: THREE.DoubleSide 
    });
    const hitbox = new THREE.Mesh(planeGeo, planeMat);
    hitbox.position.copy(object.position);
    hitbox.rotation.copy(object.rotation);
    scene.add(hitbox);
    
    // Add to clickableObjects
    hitbox.userData = { 
        isContent: true, 
        onClick: () => {
            console.log('Thumbnail clicked:', title);
            openModal(title, videoId, credits);
        }
    };
    clickableObjects.push(hitbox);

    // Hover Logic
    const hoverData = { object, baseScale, hoverScale, targetScale: baseScale, hitbox };
    hoverThumbnails.push(hoverData);

    return object;
}

// Create "GAME OF DRONES" button (Red category)
// createContentButton('GAME OF DRONES', -12, 18, 0xff0000, () => {
//     openModal(
//         'GAME OF DRONES',
//         'CkOrL-2W8bo',
//         '<strong>Desafío:</strong> El primero que gane el best se gana 5 USD.<br>Trailer del juego.'
//     );
// });

// Create "EL DETECTIVE NO-IR" 3D Thumbnail (Green category)
// createVideoThumbnail(
//     'EL DETECTIVE NO-IR',
//     '-XxviGKO-Kc',
//     '<strong>Créditos:</strong><br>Juan Manuel Cafferata (Cámara, Edición, Dirección)<br>Chavo Escrotito (Guion, Actuación, Dirección)',
//     './detective-thumb.jpg',
//     0, 5, 20
// );

// Create "FIESTA EN LA COCINA" button (Blue category)
// createContentButton('FIESTA EN LA COCINA', 12, 18, 0x0000ff, () => {
//     openModal(
//         'FIESTA EN LA COCINA',
//         'I4kiBizQsl4',
//         '<strong>Artista:</strong> KABRADEPATA'
//     );
// });

// Position pillars side by side
// createPillar('TOXI GAMING', -12, 12, 0xff0000); // Red
// createPillar('TOXI ACADEMY', 0, 12, 0x00ff00); // Green
// createPillar('TOXI KIDS', 12, 12, 0x0000ff); // Blue

// Modal Logic
const modal = document.getElementById('video-modal');
const closeButton = document.querySelector('.close-button');
const videoFrame = document.getElementById('video-frame');
const videoTitle = document.getElementById('video-title');
const videoCredits = document.getElementById('video-credits');
const releaseDate = document.getElementById('release-date');
const qrCode = document.getElementById('qr-code');

function openModal(title, videoId, creditsHtml) {
    console.log('Opening modal for:', title);
    if (videoTitle) videoTitle.textContent = title;
    if (videoFrame) videoFrame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    if (videoCredits) videoCredits.innerHTML = creditsHtml;
    
    // Set static release date
    if (releaseDate) releaseDate.textContent = 'Estreno: 20 Nov 2025';
    
    // Generate QR Code
    if (qrCode) {
        const shareUrl = `${window.location.origin}${window.location.pathname}?video=${videoId}`;
        qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`;
    }
    
    if (modal) modal.classList.remove('hidden');
    if (animationId) cancelAnimationFrame(animationId);
}

function closeModal() {
    modal.classList.add('hidden');
    videoFrame.src = ''; // Stop video
    animate();
}

closeButton.addEventListener('click', closeModal);
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        closeModal();
    }
});

// Track dragging state to distinguish click vs drag
let isDragging = false;
controls.addEventListener('change', () => {
    isDragging = true;
});
renderer.domElement.addEventListener('mousedown', () => {
    isDragging = false;
});
renderer.domElement.addEventListener('touchstart', () => {
    isDragging = false;
});

// Handle clicks on pillars
renderer.domElement.addEventListener('click', (event) => {
    if (isDragging) return;

    // Raycaster is already set up with mouse position from mousemove
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects);
    
    if (intersects.length > 0) {
        const object = intersects[0].object;
        
        if (object.userData.isContent) {
            // It's a content button, execute its action
            object.userData.onClick();
        } else {
            // It's a category pillar
            const color = object.userData.color;
            
            // Filter logic:
            // 1. Move non-matching pillars down, matching pillar stays up
            clickableObjects.forEach(obj => {
                if (!obj.userData.isContent) {
                    // It's a pillar
                    if (obj.userData.color !== color) {
                        // Animate down
                        new TWEEN.Tween(obj.position)
                            .to({ y: -5 }, 500)
                            .easing(TWEEN.Easing.Quadratic.Out)
                            .start();
                    } else {
                        // Ensure it's up
                        new TWEEN.Tween(obj.position)
                            .to({ y: 1 }, 500)
                            .easing(TWEEN.Easing.Quadratic.Out)
                            .start();
                    }
                } else {
                    // It's a content button
                    // Show if it matches the color, hide otherwise
                    if (obj.userData.color === color) {
                        new TWEEN.Tween(obj.position)
                            .to({ y: 1 }, 500)
                            .easing(TWEEN.Easing.Quadratic.Out)
                            .start();
                    } else {
                        new TWEEN.Tween(obj.position)
                            .to({ y: -5 }, 500)
                            .easing(TWEEN.Easing.Quadratic.Out)
                            .start();
                    }
                }
            });
        }
    }
});

// HUD Elements
const hudElements = [];

function createHUD() {
}

createHUD();

// Animation Loop
const clock = new THREE.Clock();
let animationId;
// Intro: camera comes from below -> up (will pass through the logo)
const introMainDuration = 10.0; // seconds
const cameraDefaultPos = camera.position.clone();
// Start below but slightly forward in Z so we don't cross navigation thresholds (z stays in safe range)
const cameraStartPos = cameraDefaultPos.clone().add(new THREE.Vector3(0, 0, 10)); // start far below and a bit toward +Z
camera.position.copy(cameraStartPos);
let introMainDone = false;
// Expose intro state to other modules so UI (labels) can wait until intro finishes
window._introMainDone = false;

window.resetCameraAnimation = function() {
    introMainDone = false;
    window._introMainDone = false;
    // Reset clock to restart the intro animation timer
    clock.start(); 
    // Reset camera to start position
    camera.position.copy(cameraStartPos);
    camera.lookAt(scene.position);
    controls.enabled = false;
};

function animate() {
    animationId = requestAnimationFrame(animate);
    TWEEN.update(); // Update tweens
    // Disable controls during the intro movement to avoid user interruption
    if (!introMainDone) controls.enabled = false;
    controls.update(); // Update controls for damping

    // Intro camera movement (front -> back)
    if (!introMainDone) {
        const tRaw = Math.min(clock.getElapsedTime() / introMainDuration, 1);
        const easedT = 1 - Math.pow(1 - tRaw, 2); // ease-out quad
        camera.position.lerpVectors(cameraStartPos, cameraDefaultPos, easedT);
        camera.lookAt(scene.position);
        if (tRaw >= 1) {
            introMainDone = true;
            window._introMainDone = true;
            controls.enabled = true; // re-enable controls after intro
        }
    }

    // Manual camera movement
    if (targetPosition) {
        const delta = clock.getDelta();
        currentSpeed = Math.min(maxSpeed, currentSpeed + acceleration * delta);
        const direction = targetPosition.clone().sub(camera.position).normalize();
        const distance = camera.position.distanceTo(targetPosition);
        const moveDistance = currentSpeed * delta;
        if (moveDistance >= distance) {
            camera.position.copy(targetPosition);
            camera.up.set(0, 1, 0);
            camera.lookAt(scene.position);
            targetPosition = null;
            movementStartTime = null;
            currentSpeed = 0;
            controls.enabled = true;
        } else {
            camera.position.add(direction.multiplyScalar(moveDistance));
            camera.up.set(0, 1, 0);
            camera.lookAt(scene.position);
        }

        // Check for fade after 10 seconds
        if (movementStartTime) {
            const elapsed = (performance.now() - movementStartTime) / 1000;
            if (elapsed >= 10) {
                    // Decide destination and navigate with fade
                    let url;
                    if (targetPosition && targetPosition.x === -50) {
                        url = 'line.html';
                    } else if (targetPosition && targetPosition.x === 50) {
                        url = 'earth.html';
                    } else if (targetPosition && targetPosition.z === -50) {
                        url = 'https://toxi.media/plantform';
                    } else if (targetPosition && targetPosition.z === 50) {
                        url = 'https://www.instagram.com/toxi.media/';
                    }
                    navigateWithFade(url);
                // Don't stop movement
            }
        }
    }

    // Smooth Zoom Logic
    const fovDiff = targetFov - camera.fov;
    if (Math.abs(fovDiff) > 0.01) {
        // 1. Find where mouse points currently
        raycaster.setFromCamera(mouse, camera);
        const target = new THREE.Vector3();
        const hit = raycaster.ray.intersectPlane(plane, target);

        // 2. Apply smooth zoom
        camera.fov += fovDiff * 0.1; // Smoothing factor
        camera.updateProjectionMatrix();

        // 3. Compensate position if we hit the plane
        if (hit) {
            raycaster.setFromCamera(mouse, camera);
            const newTarget = new THREE.Vector3();
            const newHit = raycaster.ray.intersectPlane(plane, newTarget);
            
            if (newHit) {
                const offset = new THREE.Vector3().subVectors(target, newTarget);
                camera.position.add(offset);
                controls.target.add(offset);
            }
        }
    }

    const time = clock.getElapsedTime();

    // Animate Light
    directionalLight.position.x = Math.sin(time * 0.5) * 40;
    
    const lx = directionalLight.position.x;
    const ly = directionalLight.position.y;
    const lz = directionalLight.position.z;

    // Animate Logo
    if (logoModel) {
        // logoModel.rotation.y = time * 0.3; // Rotate
        logoModel.position.y = 5 + Math.sin(time * 0.5) * 1; // Float up and down
        logoModel.rotation.y = Math.sin(time * 0.5) * (2 * Math.PI / 180); // Rotate Z 5 degrees back and forth
    }
    
    // Animate points
    const positions = points.geometry.attributes.position.array;
    const colors = points.geometry.attributes.color.array;
    
    let idx = 0;
    
    // Noise parameters
    const noiseScale = 0.03;
    const noiseSpeed = 0.05;
    const heightScale = 1.5;
    const pointColor = new THREE.Color('#000000');

    for (let j = 0; j < initialPositions.length; j++) {
        const { x: initialX, z: initialZ } = initialPositions[j];
        
        // Calculate noise value
        const noiseVal = simplex.noise(
            initialX * noiseScale + time * noiseSpeed, 
            initialZ * noiseScale + time * noiseSpeed
        );
        
        const y = noiseVal * heightScale;
                  
        // Update Y position
        positions[idx + 1] = y;
        
        // Color variation based on height and light influence
        // Calculate distance to light (ignoring Y for a "spotlight on ocean" effect)
        const dx = initialX - lx;
        const dz = initialZ - lz;
        const dist = Math.sqrt(dx*dx + dz*dz);
        
        // Light attenuation
        let lightIntensity = Math.max(0, 1 - dist / 50); // 50 is the light radius on the water
        lightIntensity = Math.pow(lightIntensity, 2); // Sharpen the falloff

        // Base color from debugParams
        const r = pointColor.r;
        const g = pointColor.g;
        const b = pointColor.b;

        // Mix base color with light intensity (making it brighter near light)
        // We can just multiply or add. Let's add to make it glow.
        colors[idx] = Math.min(1, r + lightIntensity);
        colors[idx + 1] = Math.min(1, g + lightIntensity);
        colors[idx + 2] = Math.min(1, b + lightIntensity);

        idx += 3;
    }

    points.geometry.attributes.position.needsUpdate = true;
    points.geometry.attributes.color.needsUpdate = true;

    // Hover Raycasting
    raycaster.setFromCamera(mouse, camera);
    const hitboxes = hoverThumbnails.map(h => h.hitbox);
    const intersects = raycaster.intersectObjects(hitboxes);

    hoverThumbnails.forEach(data => {
        // Removed hover scaling logic as requested
    });

    // Check if camera crosses the x=-5 plane (on z and y)

    // Navigation triggers — only enabled after intro finishes to avoid accidental redirects
    if (introMainDone) {
        // If camera.x < -50, open the line page
        if (!window._linePageOpened && camera.position.x < -50) {
            window._linePageOpened = true;
            navigateWithFade('line.html');
        }

        // If camera.x > 50, open the earth page
        if (!window._earthPageOpened && camera.position.x > 50) {
            window._earthPageOpened = true;
            navigateWithFade('earth.html');
        }

        // If camera.z < -50, open the plantform page
        if (!window._plantformPageOpened && camera.position.z < -50) {
            window._plantformPageOpened = true;
            navigateWithFade('https://toxi.media/plantform');
        }

        // If camera.z > 50, open the instagram page
        if (!window._instagramPageOpened && camera.position.z > 50) {
            window._instagramPageOpened = true;
            navigateWithFade('https://www.instagram.com/toxi.media/');
        }
    }

    composer.render();
    labelRenderer.render(scene, camera);
    css3dRenderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    const { cw, ch, finalPR } = getClampedDimensions();
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(finalPR);
    renderer.setSize(cw, ch, false); // keep DOM/CSS full-screen, only change drawing buffer
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    composer.setPixelRatio(finalPR);
    composer.setSize(cw, ch);

    // Update bloom pass resolution if supported
    if (bloomPass && typeof bloomPass.setSize === 'function') {
        bloomPass.setSize(Math.floor(cw * finalPR), Math.floor(ch * finalPR));
    } else if (bloomPass && bloomPass.resolution && typeof bloomPass.resolution.set === 'function') {
        bloomPass.resolution.set(Math.floor(cw * finalPR), Math.floor(ch * finalPR));
    }

    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    css3dRenderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

// --- Edge arrow hints: show on hover/touch, auto-hide after 3s ---
(function setupEdgeHints() {
    const HIDE_DELAY = 3000; // ms
    let hideTimer = null;

    function createHint(side, labelText) {
        const d = document.createElement('div');
        d.className = `edge-hint edge-hint--${side}`;
        d.setAttribute('aria-hidden', 'true');
        d.setAttribute('role', 'button');
        d.tabIndex = -1;

        // Arrow SVG (points right). We'll rotate for left via CSS transform when needed.
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M8 5l8 7-8 7');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'currentColor');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(path);

        // Rotate the arrow SVG depending on requested side
        switch (side) {
            case 'left': svg.style.transform = 'rotate(180deg)'; break; // point left
            case 'top': svg.style.transform = 'rotate(-90deg)'; break; // point up
            case 'bottom': svg.style.transform = 'rotate(90deg)'; break; // point down
            default: svg.style.transform = 'rotate(0deg)'; break; // right
        }

        d.appendChild(svg);

        // keep hints non-focusable but accessible for screen readers via label
        const srLabel = document.createElement('span');
        srLabel.className = 'visually-hidden';
        srLabel.textContent = labelText || (side === 'left' ? 'Ir a la línea de tiempo (presiona ←)' : 'Ir a la Tierra (presiona →)');
        d.appendChild(srLabel);

        // Visible label chip
        if (labelText) {
            const chip = document.createElement('div');
            chip.className = 'edge-hint__label';
            chip.textContent = labelText;
            d.appendChild(chip);
        }

        // hover behavior: keep visible while hovering
        d.addEventListener('mouseenter', () => {
            if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        });
        d.addEventListener('mouseleave', () => {
            if (hideTimer) { clearTimeout(hideTimer); }
            hideTimer = setTimeout(hideHints, HIDE_DELAY);
        });

        return d;
    }

    const leftHint = createHint('left', 'Agenda');
    const rightHint = createHint('right', 'Mapa');
    const topHint = createHint('top', 'Plataforma');
    const bottomHint = createHint('bottom', 'Instagram');
    document.body.appendChild(leftHint);
    document.body.appendChild(rightHint);
    document.body.appendChild(topHint);
    document.body.appendChild(bottomHint);

    function showHints() {
        // make visible and reset hide timer
        leftHint.classList.add('visible');
        rightHint.classList.add('visible');
        topHint.classList.add('visible');
        bottomHint.classList.add('visible');
        leftHint.setAttribute('aria-hidden', 'false');
        rightHint.setAttribute('aria-hidden', 'false');
        topHint.setAttribute('aria-hidden', 'false');
        bottomHint.setAttribute('aria-hidden', 'false');

        if (hideTimer) { clearTimeout(hideTimer); }
        hideTimer = setTimeout(hideHints, HIDE_DELAY);
    }

    function hideHints() {
        leftHint.classList.remove('visible');
        rightHint.classList.remove('visible');
        topHint.classList.remove('visible');
        bottomHint.classList.remove('visible');
        leftHint.setAttribute('aria-hidden', 'true');
        rightHint.setAttribute('aria-hidden', 'true');
        topHint.setAttribute('aria-hidden', 'true');
        bottomHint.setAttribute('aria-hidden', 'true');
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    }

    // Show on meaningful interaction: mousemove, touchstart
    let lastShown = 0;
    function onInteraction() {
        const now = Date.now();
        // throttle to avoid DOM thrash
        if (now - lastShown < 250) return;
        lastShown = now;
        showHints();
    }

    window.addEventListener('mousemove', onInteraction, { passive: true });
    window.addEventListener('touchstart', onInteraction, { passive: true });

    // Also show when focusing via keyboard (accessibility)
    window.addEventListener('keydown', (e) => {
        // if arrow keys, no need to show hints
        if (e.key && e.key.startsWith('Arrow')) return;
        onInteraction();
    });

    // Optional: tap hints to trigger navigation (but do not change behavior if user doesn't want)
    leftHint.addEventListener('click', () => navigateWithFade('line.html', { force: true, duration: 800 }));
    rightHint.addEventListener('click', () => navigateWithFade('earth.html', { force: true, duration: 800 }));
    topHint.addEventListener('click', () => navigateWithFade('https://toxii.webflow.io/plantform', { force: true, duration: 800 }));
    bottomHint.addEventListener('click', () => navigateWithFade('https://www.instagram.com/toxi.media/', { force: true, duration: 800 }));

    // Hide on initial load after a short delay if they were shown
    setTimeout(hideHints, HIDE_DELAY + 5000);

})();
