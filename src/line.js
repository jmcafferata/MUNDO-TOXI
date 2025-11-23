import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
// --- 3D TOXI Logo ---
let logoModel;

// Simplex Noise Utility (Minimal, copy from main.js)
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
        let n0, n1, n2;
        const F2 = 0.5*(Math.sqrt(3.0)-1.0);
        const s = (xin+yin)*F2;
        const i = Math.floor(xin+s);
        const j = Math.floor(yin+s);
        const G2 = (3.0-Math.sqrt(3.0))/6.0;
        const t = (i+j)*G2;
        const X0 = i-t;
        const Y0 = j-t;
        const x0 = xin-X0;
        const y0 = yin-Y0;
        let i1, j1;
        if(x0>y0) {i1=1; j1=0;} else {i1=0; j1=1;}
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2;
        const y2 = y0 - 1.0 + 2.0 * G2;
        const ii = i & 255;
        const jj = j & 255;
        const gi0 = this.perm[ii+this.perm[jj]] % 12;
        const gi1 = this.perm[ii+i1+this.perm[jj+j1]] % 12;
        const gi2 = this.perm[ii+1+this.perm[jj+1]] % 12;
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
        return 70.0 * (n0 + n1 + n2);
    }
}

const simplex = new SimplexNoise();

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
bloomPass.threshold = 0.5;
bloomPass.strength = 1.0;
bloomPass.radius = 0.4;

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
// labelRenderer.domElement.style.pointerEvents = 'none'; // Enable pointer events for interaction
document.body.appendChild(labelRenderer.domElement);

// Interaction State
let timeOffset = 0;
let isDragging = false;
let previousX = 0;
let velocity = 0;
let lastMoveTime = 0;

// Sensitivity
const PIXELS_PER_MINUTE = 10; 
const MS_PER_MINUTE = 60000;
const FRICTION = 0.95;

function onPointerDown(e) {
    isDragging = true;
    velocity = 0;
    previousX = e.clientX || e.touches[0].clientX;
    lastMoveTime = performance.now();
}

function onPointerMove(e) {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    if (clientX === undefined) return;
    
    const now = performance.now();
    lastMoveTime = now;

    const deltaX = clientX - previousX;
    previousX = clientX;
    
    // Dragging right moves "back" in time (seeing left/past)
    const minutesMoved = deltaX / PIXELS_PER_MINUTE;
    const timeChange = minutesMoved * MS_PER_MINUTE;
    timeOffset -= timeChange;
    
    velocity = -timeChange;
}

function onPointerUp() {
    isDragging = false;
}

function onWheel(e) {
    e.preventDefault();
    // Wheel down (positive) -> move forward in time
    const minutesMoved = e.deltaY * 0.05; 
    const timeChange = minutesMoved * MS_PER_MINUTE;
    
    // Apply momentum for smooth scrolling
    // (1 - FRICTION) factor ensures total distance traveled matches the input
    velocity += timeChange * (1 - FRICTION);
}

const interactionElement = labelRenderer.domElement;
interactionElement.style.pointerEvents = 'auto'; // Ensure it captures events
interactionElement.addEventListener('mousedown', onPointerDown);
interactionElement.addEventListener('touchstart', onPointerDown, { passive: false });

window.addEventListener('mousemove', onPointerMove);
window.addEventListener('touchmove', onPointerMove, { passive: false });

window.addEventListener('mouseup', onPointerUp);
window.addEventListener('touchend', onPointerUp);

interactionElement.addEventListener('wheel', onWheel, { passive: false });

/*
// OrbitControls
const controls = new OrbitControls(camera, labelRenderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = true;
controls.enableZoom = true;
controls.enableRotate = true;
*/

// Line of points
const numPoints = 361; // 6 hours (360 min) + center. 1 point = 1 minute.
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(numPoints * 3);

for (let i = 0; i < numPoints; i++) {
    positions[i * 3] = (i - (numPoints - 1) / 2) * 0.3;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;
}
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// Add color attribute for per-point coloring
const colors = new Float32Array(numPoints * 3);
for (let i = 0; i < numPoints; i++) {
    colors[i * 3] = 1;
    colors[i * 3 + 1] = 1;
    colors[i * 3 + 2] = 1;
}
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({ size: 0.08, vertexColors: true }); // smaller dots
const points = new THREE.Points(geometry, material);
scene.add(points);

// --- Audio Waveform Integration (Disabled) ---
let audioCtx = null;
let audioElement = null;
let audioSource = null;
let audioAnalyser = null;
let audioDataArray = null;
let useAudioWave = false;

/*
// CONFIGURACIÓN DEL STREAM (ICECAST)
// 1. Pega aquí la URL de tu "Mountpoint" de Icecast.
// 2. IMPORTANTE: Para que la onda visual se mueva, tu servidor Icecast debe tener CORS habilitado.
// 3. Si tu web está en HTTPS, el stream también debe ser HTTPS (o el navegador lo bloqueará).
const STREAM_URL = 'http://localhost:8000/stream'; // <--- REEMPLAZA ESTO CON TU URL DE ICECAST

function initAudioStream() {
    if (audioCtx) return;

    try {
        audioElement = new Audio(STREAM_URL);
        audioElement.crossOrigin = 'anonymous'; // Necesario para que el visualizador funcione (CORS)
        
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioSource = audioCtx.createMediaElementSource(audioElement);
        audioAnalyser = audioCtx.createAnalyser();
        audioAnalyser.fftSize = 1024;
        
        audioSource.connect(audioAnalyser);
        audioAnalyser.connect(audioCtx.destination); // Escuchar en parlantes
        
        audioDataArray = new Uint8Array(audioAnalyser.fftSize);
        useAudioWave = true;
        
        audioElement.play().then(() => {
            console.log('Stream playback started');
        }).catch(err => {
            console.warn('Autoplay blocked', err);
        });
    } catch (e) {
        console.error('Error initializing stream:', e);
        alert('Error al conectar con el stream. Revisa la consola.');
    }
}

// UI para iniciar
const playBtn = document.createElement('button');
playBtn.textContent = 'CONECTAR A TRANSMISIÓN EN VIVO';
playBtn.className = 'audio-unmute-btn';
playBtn.style.fontFamily = '"Helvetica Now", sans-serif';
document.body.appendChild(playBtn);

playBtn.addEventListener('click', () => {
    initAudioStream();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    playBtn.remove();
});
*/

// --- Markers for half-hour intervals ---
const markerPoolSize = 20; // Match label pool
const markerGeometry = new THREE.BufferGeometry();
const markerPositions = new Float32Array(markerPoolSize * 2 * 3); // 2 vertices per line
const markerColorsArray = new Float32Array(markerPoolSize * 2 * 3);
markerGeometry.setAttribute('position', new THREE.BufferAttribute(markerPositions, 3));
markerGeometry.setAttribute('color', new THREE.BufferAttribute(markerColorsArray, 3));

const markerMaterial = new THREE.LineBasicMaterial({ vertexColors: true });
const markers = new THREE.LineSegments(markerGeometry, markerMaterial);
scene.add(markers);

// --- Present Line (Fixed at center) ---
const presentLineGeometry = new THREE.BufferGeometry();
const presentLineVertices = new Float32Array([
    0, 0.5, 0,
    0, -0.5, 0
]);
presentLineGeometry.setAttribute('position', new THREE.BufferAttribute(presentLineVertices, 3));
const presentLineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
const presentLine = new THREE.Line(presentLineGeometry, presentLineMaterial);
scene.add(presentLine);

// --- Labels Setup ---
// Present Label (Fixed on screen)
const presentDiv = document.createElement('div');
presentDiv.className = 'label';
presentDiv.style.position = 'absolute';
presentDiv.style.bottom = '15%';
presentDiv.style.left = '0';
presentDiv.style.width = '100%';
presentDiv.style.textAlign = 'center';
presentDiv.style.display = 'flex';
presentDiv.style.justifyContent = 'center';
presentDiv.style.alignItems = 'center';
presentDiv.style.color = 'white';
presentDiv.style.fontSize = '16px';
presentDiv.style.fontWeight = 'bold';
presentDiv.style.fontFamily = '"Helvetica Now", sans-serif';
presentDiv.style.background = 'transparent';
presentDiv.style.border = 'none';
presentDiv.style.boxShadow = 'none';
presentDiv.style.pointerEvents = 'none';
document.body.appendChild(presentDiv);

// Pool of Time Labels (for 30min intervals)
const timeLabels = [];
const timeLabelPoolSize = 20; // Enough to cover visible range
for (let i = 0; i < timeLabelPoolSize; i++) {
    const div = document.createElement('div');
    div.className = 'time-label';
    div.style.color = 'white';
    div.style.fontSize = '12px';
    div.style.fontFamily = '"Helvetica Now", sans-serif';
    div.style.background = 'transparent';
    div.style.position = 'absolute';
    div.style.transform = 'translate(-50%, -50%)';
    div.style.pointerEvents = 'none';
    const label = new CSS2DObject(div);
    label.visible = false; // Start hidden
    scene.add(label);
    timeLabels.push(label);
}

// --- Overlay Setup ---
const overlay = document.createElement('div');
overlay.style.position = 'fixed';
overlay.style.top = '0';
overlay.style.left = '0';
overlay.style.width = '100%';
overlay.style.height = '100%';
overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
overlay.style.zIndex = '1000';
overlay.style.display = 'none';
overlay.style.justifyContent = 'center';
overlay.style.alignItems = 'center';
overlay.style.flexDirection = 'column';
document.body.appendChild(overlay);

const closeBtn = document.createElement('button');
closeBtn.textContent = 'CERRAR';
closeBtn.style.position = 'absolute';
closeBtn.style.top = '20px';
closeBtn.style.right = '20px';
closeBtn.style.padding = '10px 20px';
closeBtn.style.backgroundColor = 'white';
closeBtn.style.color = 'black';
closeBtn.style.border = 'none';
closeBtn.style.cursor = 'pointer';
closeBtn.style.fontFamily = '"Helvetica Now", sans-serif';
closeBtn.style.fontWeight = 'bold';
closeBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
    iframe.src = ''; // Stop video
});
overlay.appendChild(closeBtn);

const iframe = document.createElement('iframe');
iframe.style.width = '80%';
iframe.style.height = '80%';
iframe.style.border = 'none';
iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
iframe.setAttribute('allowfullscreen', '');
overlay.appendChild(iframe);

// Next Event Button
const nextBtn = document.createElement('button');
nextBtn.textContent = '>>';
nextBtn.style.position = 'absolute';
nextBtn.style.bottom = '30px';
nextBtn.style.right = '30px';
nextBtn.style.padding = '12px 24px';
nextBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
nextBtn.style.color = 'white';
nextBtn.style.border = '1px solid white';
nextBtn.style.cursor = 'pointer';
nextBtn.style.fontFamily = '"Helvetica Now", sans-serif';
nextBtn.style.fontSize = '14px';
nextBtn.style.backdropFilter = 'blur(5px)';
nextBtn.style.transition = 'all 0.3s ease';
nextBtn.style.zIndex = '999'; // Ensure it's above other elements but below overlay

nextBtn.addEventListener('mouseover', () => {
    nextBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
});
nextBtn.addEventListener('mouseout', () => {
    nextBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
});

nextBtn.addEventListener('click', () => {
    const currentSimulatedTime = Date.now() + timeOffset;
    // Sort events by start time
    const sortedEvents = [...eventsData].sort((a, b) => a.startDate - b.startDate);
    // Find the first event that starts after the current simulated time
    // Add a small buffer (e.g. 1 minute) to ensure we jump to the next one if we are currently AT the start of one
    const nextEvent = sortedEvents.find(e => e.startDate.getTime() > currentSimulatedTime + 60000);
    
    if (nextEvent) {
        // Jump to the start of the event
        timeOffset = nextEvent.startDate.getTime() - Date.now();
        velocity = 0; // Stop any movement
    }
});
document.body.appendChild(nextBtn);

// Previous Event Button
const prevBtn = document.createElement('button');
prevBtn.textContent = '<<';
prevBtn.style.position = 'absolute';
prevBtn.style.bottom = '30px';
prevBtn.style.left = '30px';
prevBtn.style.padding = '12px 24px';
prevBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
prevBtn.style.color = 'white';
prevBtn.style.border = '1px solid white';
prevBtn.style.cursor = 'pointer';
prevBtn.style.fontFamily = '"Helvetica Now", sans-serif';
prevBtn.style.fontSize = '14px';
prevBtn.style.backdropFilter = 'blur(5px)';
prevBtn.style.transition = 'all 0.3s ease';
prevBtn.style.zIndex = '999';

prevBtn.addEventListener('mouseover', () => {
    prevBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
});
prevBtn.addEventListener('mouseout', () => {
    prevBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
});

prevBtn.addEventListener('click', () => {
    const currentSimulatedTime = Date.now() + timeOffset;
    // Sort events by start time
    const sortedEvents = [...eventsData].sort((a, b) => a.startDate - b.startDate);
    // Find the last event that starts before the current simulated time
    // Use a buffer to jump to the previous one if we are currently at the start of one
    // We reverse the array to find the first one that satisfies "start < current" which corresponds to the closest past event
    const prevEvent = [...sortedEvents].reverse().find(e => e.startDate.getTime() < currentSimulatedTime - 60000);
    
    if (prevEvent) {
        // Jump to the start of the event
        timeOffset = prevEvent.startDate.getTime() - Date.now();
        velocity = 0; // Stop any movement
    }
});
document.body.appendChild(prevBtn);

function getEmbedUrl(url, startTime = 0) {
    let embedUrl = url;
    let videoId = null;
    
    if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
    }

    if (videoId) {
        // Add origin to prevent some CORS/embedding issues
        const origin = window.location.origin;
        embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&origin=${origin}`;
        if (startTime > 0) {
            embedUrl += `&start=${startTime}`;
        }
    }
    
    return embedUrl;
}

// --- Events Management ---
let eventsData = [];
const eventLabels = [];

fetch('events.json?t=' + Date.now())
    .then(response => response.json())
    .then(data => {
        eventsData = data.map(e => {
            const startDate = new Date(e.start);
            const hour = startDate.getHours();
            let colorHex = '#ffffff';
            if (hour >= 6 && hour < 12) colorHex = '#0088ff'; // Blue (TOXI Kids)
            else if (hour >= 12 && hour < 18) colorHex = '#00ff00'; // Green (TOXI Academy)
            else if (hour >= 18) colorHex = '#ff0000'; // Red (TOXI Gaming)
            
            return {
                ...e,
                startDate: startDate,
                endDate: new Date(e.end),
                colorObj: new THREE.Color(colorHex),
                computedColor: colorHex
            };
        });

        // Create labels for each event
        eventsData.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'label';
            // Combine title and location if available
            let text = `<span style="font-size: 1.1em; font-weight: bold;">${event.title}</span>`;
            
            if (event.year && event.director) {
                text += `<br><span style="font-size:0.9em; color:#ddd; font-weight: normal;">${event.year} - ${event.director}</span>`;
            } else if (event.location) {
                text += `<br><span style="font-size:0.9em; color:#ddd; font-weight: normal;">${event.location}</span>`;
            }
            eventDiv.innerHTML = text;
            eventDiv.style.color = event.computedColor;
            eventDiv.style.fontSize = '14px';
            eventDiv.style.fontFamily = '"Helvetica Now", sans-serif';
            eventDiv.style.padding = '6px 10px';
            eventDiv.style.border = `none`;
            eventDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            eventDiv.style.borderRadius = '4px';
            eventDiv.style.textAlign = 'center';
            eventDiv.style.position = 'absolute';
            eventDiv.style.transform = 'translate(-50%, -50%)';
            eventDiv.style.whiteSpace = 'nowrap';
            
            if (event.link) {
                eventDiv.style.cursor = 'pointer';
                eventDiv.style.pointerEvents = 'auto';
                
                // Prevent drag when interacting with the link
                eventDiv.addEventListener('mousedown', (e) => e.stopPropagation());
                eventDiv.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });
                
                eventDiv.addEventListener('click', () => {
                    const currentSimulatedTime = Date.now() + timeOffset;
                    const elapsedMs = currentSimulatedTime - event.startDate.getTime();
                    const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));

                    const finalUrl = getEmbedUrl(event.link, elapsedSeconds);
                    console.log('Opening video at:', finalUrl);
                    
                    overlay.style.display = 'flex';
                    // Small delay to ensure overlay is visible before loading iframe
                    requestAnimationFrame(() => {
                        iframe.src = finalUrl;
                    });
                });
            } else {
                eventDiv.style.pointerEvents = 'none';
            }

            const labelObj = new CSS2DObject(eventDiv);
            labelObj.position.set(0, 0.5, 0); // Initial position
            scene.add(labelObj);
            eventLabels.push(labelObj);
        });
    })
    .catch(err => console.error('Error loading events:', err));


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
const starsCount = 3000;
const starsPositions = new Float32Array(starsCount * 3);
const starsColors = new Float32Array(starsCount * 3);
const starsBlinkOffsets = new Float32Array(starsCount);

for (let i = 0; i < starsCount; i++) {
    const x = (Math.random() - 0.5) * 150;
    const y = (Math.random() - 0.5) * 150;
    const z = (Math.random() - 0.5) * 150;
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
const starsMaterial = new THREE.PointsMaterial({ size: 0.05, sizeAttenuation: true, vertexColors: true }); // smaller stars
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);



// Animate
function animate() {
    requestAnimationFrame(animate);
    const timeMs = performance.now();
    const time = timeMs / 1000; // seconds
    const dt = time - lastTime;
    lastTime = time;

    // Animate line points as a traveling long-wave timeline along the line's X axis.
    // The spatial 'present' is at x = 0; events (points) are fixed in X and their Y value
    // changes as the wave passes through them. Speed is in world units (1 unit/sec).
    const pos = geometry.attributes.position.array;
    const spacing = 0.3; // world spacing between adjacent points (matches initial placement)
    // 1 point = 1 minute. Spacing = 0.3 units.

    const speedSpatial = 1.0; // world units per second
    
    // Apply momentum
    if (!isDragging) {
        timeOffset += velocity;
        velocity *= FRICTION;
        if (Math.abs(velocity) < 10) velocity = 0;
    } else {
        if (performance.now() - lastMoveTime > 100) velocity = 0;
    }

    // Update Present Label
    const nowDate = new Date(Date.now() + timeOffset);
    
    const year = nowDate.getFullYear();
    const month = nowDate.getMonth() + 1;
    const day = nowDate.getDate();
    const hours = nowDate.getHours();
    const minutes = nowDate.getMinutes();
    const seconds = nowDate.getSeconds();
    
    // Removed millennium and century display per request

    const pad = (n) => n.toString().padStart(2, '0');

    presentDiv.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
            <div style="display: flex; gap: 30px; justify-content: center; width:100%;">
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <span style="font-size: 2.5em; font-weight: 300; line-height: 1; display:inline-block; transform:translateY(-12px);">${year}</span>
                    <span style="font-size: 0.6em; letter-spacing: 2px; color: #888;">AÑO</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <span style="font-size: 2.5em; font-weight: 300; line-height: 1; display:inline-block; transform:translateY(-12px);">${pad(month)}</span>
                    <span style="font-size: 0.6em; letter-spacing: 2px; color: #888;">MES</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <span style="font-size: 2.5em; font-weight: 300; line-height: 1; display:inline-block; transform:translateY(-12px);">${pad(day)}</span>
                    <span style="font-size: 0.6em; letter-spacing: 2px; color: #888;">DIA</span>
                </div>
            </div>
            <div style="display: flex; gap: 30px; justify-content: center; width:100%;">
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <span style="font-size: 2.5em; font-weight: 300; line-height: 1; display:inline-block; transform:translateY(-12px);">${pad(hours)}</span>
                    <span style="font-size: 0.6em; letter-spacing: 2px; color: #888;">HORA</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <span style="font-size: 2.5em; font-weight: 300; line-height: 1; display:inline-block; transform:translateY(-12px);">${pad(minutes)}</span>
                    <span style="font-size: 0.6em; letter-spacing: 2px; color: #888;">MINUTO</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <span style="font-size: 2.5em; font-weight: 300; line-height: 1; display:inline-block; transform:translateY(-12px);">${pad(seconds)}</span>
                    <span style="font-size: 0.6em; letter-spacing: 2px; color: #888;">SEGUNDO</span>
                </div>
            </div>
        </div>
    `;

    // Update Event Labels Positions
    // Pre-calculate ranges for coloring
    const activeRanges = [];
    
    if (eventsData.length > 0) {
        eventsData.forEach((event, index) => {
            const diffStartMinutes = (event.startDate - nowDate) / 60000;
            const diffEndMinutes = (event.endDate - nowDate) / 60000;
            
            const xStart = diffStartMinutes * spacing;
            const xEnd = diffEndMinutes * spacing;
            const xCenter = (xStart + xEnd) / 2;
            
            if (eventLabels[index]) {
                eventLabels[index].position.set(xCenter, 1.5, 0);
            }
            
            activeRanges.push({ start: xStart, end: xEnd, color: event.colorObj });
        });
    }

    // Update Time Labels (every 30 mins)
    // Find the nearest previous 30-min mark
    const currentMinutes = nowDate.getMinutes();
    const remainder = currentMinutes % 30;
    const prev30 = new Date(nowDate);
    prev30.setMinutes(currentMinutes - remainder);
    prev30.setSeconds(0);
    prev30.setMilliseconds(0);

    // We want to show labels for +/- 3 hours (180 mins)
    // 30 min intervals -> roughly 6 labels back, 6 labels forward
    let labelIdx = 0;
    for (let i = -6; i <= 6; i++) {
        if (labelIdx >= timeLabels.length) break;
        
        const targetTime = new Date(prev30.getTime() + i * 30 * 60000);
        const diffMinutes = (targetTime - nowDate) / 60000;
        
        // Only show if within reasonable range (slightly more than 3h to catch edges)
        if (Math.abs(diffMinutes) <= 200) {
            const label = timeLabels[labelIdx];
            label.element.textContent = targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const xPos = diffMinutes * spacing;
            
            label.position.set(xPos, -0.5, 0); // Position below the line
            label.visible = true;

            // Update marker position (sync with label)
            if (labelIdx < markerPoolSize) {
                const i = labelIdx * 2;
                const halfHeight = 0.2;

                // Top vertex
                markerPositions[i * 3] = xPos;
                markerPositions[i * 3 + 1] = halfHeight;
                markerPositions[i * 3 + 2] = 0;
                
                // Bottom vertex
                markerPositions[(i + 1) * 3] = xPos;
                markerPositions[(i + 1) * 3 + 1] = -halfHeight;
                markerPositions[(i + 1) * 3 + 2] = 0;

                // Update marker color
                let inEvent = false;
                for (const range of activeRanges) {
                    if (xPos >= range.start && xPos <= range.end) {
                        inEvent = true;
                        break; // First match wins
                    }
                }

                if (inEvent) {
                    const markerTime = new Date(nowDate.getTime() + diffMinutes * 60000);
                    const h = markerTime.getHours();
                    let r=1, g=1, b=1;
                    if (h >= 6 && h < 12) { r=0; g=0.53; b=1; } // #0088ff
                    else if (h >= 12 && h < 18) { r=0; g=1; b=0; } // #00ff00
                    else if (h >= 18) { r=1; g=0; b=0; } // #ff0000

                    markerColorsArray[i * 3] = r;
                    markerColorsArray[i * 3 + 1] = g;
                    markerColorsArray[i * 3 + 2] = b;
                    
                    markerColorsArray[(i + 1) * 3] = r;
                    markerColorsArray[(i + 1) * 3 + 1] = g;
                    markerColorsArray[(i + 1) * 3 + 2] = b;
                } else {
                    markerColorsArray[i * 3] = 1;
                    markerColorsArray[i * 3 + 1] = 1;
                    markerColorsArray[i * 3 + 2] = 1;
                    
                    markerColorsArray[(i + 1) * 3] = 1;
                    markerColorsArray[(i + 1) * 3 + 1] = 1;
                    markerColorsArray[(i + 1) * 3 + 2] = 1;
                }
            }

            labelIdx++;
        }
    }
    // Hide unused labels
    for (let i = labelIdx; i < timeLabels.length; i++) {
        timeLabels[i].visible = false;
    }
    
    // Hide unused markers
    for (let i = labelIdx; i < markerPoolSize; i++) {
        const idx = i * 2;
        markerPositions[idx * 3] = 0;
        markerPositions[idx * 3 + 1] = -10000; // Hide
        markerPositions[idx * 3 + 2] = 0;
        
        markerPositions[(idx + 1) * 3] = 0;
        markerPositions[(idx + 1) * 3 + 1] = -10000; // Hide
        markerPositions[(idx + 1) * 3 + 2] = 0;
    }
    markerGeometry.attributes.position.needsUpdate = true;
    markerGeometry.attributes.color.needsUpdate = true;

    const colors = geometry.attributes.color.array;

    for (let i = 0; i < numPoints; i++) {
        const xPos = pos[i * 3]; // world X position of this event
        
        // Check if this point is within any event time range
        let inEvent = false;
        for (const range of activeRanges) {
            if (xPos >= range.start && xPos <= range.end) {
                inEvent = true;
                break;
            }
        }

        if (inEvent) {
            const diffMinutes = xPos / spacing;
            const pointTime = new Date(nowDate.getTime() + diffMinutes * 60000);
            const h = pointTime.getHours();
            let r=1, g=1, b=1;
            if (h >= 6 && h < 12) { r=0; g=0.53; b=1; } // #0088ff
            else if (h >= 12 && h < 18) { r=0; g=1; b=0; } // #00ff00
            else if (h >= 18) { r=1; g=0; b=0; } // #ff0000

            colors[i * 3] = r;
            colors[i * 3 + 1] = g;
            colors[i * 3 + 2] = b;
        } else {
            colors[i * 3] = 1;
            colors[i * 3 + 1] = 1;
            colors[i * 3 + 2] = 1;
        }

        if (useAudioWave && audioAnalyser && audioDataArray) {
            audioAnalyser.getByteTimeDomainData(audioDataArray);
            // Map point index to audio sample index centered around middle for symmetry
            const centerIndex = Math.floor(audioDataArray.length / 2);
            const spread = Math.min(audioDataArray.length / 2, numPoints);
            // Map i to sample offset
            const t = (i - numPoints / 2) / (numPoints / 2); // -1 .. 1
            const sampleIndex = centerIndex + Math.floor(t * (spread - 1));
            const clamped = Math.max(0, Math.min(audioDataArray.length - 1, sampleIndex));
            const v = (audioDataArray[clamped] - 128) / 128; // -1 .. 1
            // Emphasize center, taper edges
            const edgeFalloff = 1 - Math.min(1, Math.abs(t)); // 1 at center -> 0 at edges
            const amplitude = 2.0; // base vertical scale
            const y = v * amplitude * edgeFalloff;
            // Add slight procedural shimmer so still reactive when silence
            const shimmer = simplex.noise(xPos * 0.05 + time * 0.3, time * 0.15) * 0.15;
            pos[i * 3 + 1] = y + shimmer;
        } else {
            // Fallback noise wave (existing behavior)
            const baseAmplitude = 0.3;
            const velocityRatio = Math.min(Math.abs(velocity) / 500000, 1.0);
            const noiseAmplitude = baseAmplitude + velocityRatio * 2.0;
            const baseFrequency = 0.1;
            const noiseFrequency = baseFrequency + (velocityRatio * 0.4);
            const noiseY = simplex.noise(xPos * noiseFrequency + time * 0.1, time * 0.2) * noiseAmplitude;
            pos[i * 3 + 1] = noiseY;
        }
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;

    // --- Restore missing animations ---

    // Animate stars blinking and moving
    const starColors = starsGeometry.attributes.color.array;
    const starPositions = starsGeometry.attributes.position.array;
    for (let i = 0; i < starsCount; i++) {
        const brightness = 0.7 + 0.3 * Math.sin(time * 3 + starsBlinkOffsets[i]);
        starColors[i * 3] = brightness;
        starColors[i * 3 + 1] = brightness;
        starColors[i * 3 + 2] = brightness;

        // Move stars left to right
        starPositions[i * 3] -= 0.05;
        if (starPositions[i * 3] < -75) {
            starPositions[i * 3] = 75;
            // Randomize Y and Z to create a continuous particle field effect
            starPositions[i * 3 + 1] = (Math.random() - 0.5) * 150;
            starPositions[i * 3 + 2] = (Math.random() - 0.5) * 150;
        }
    }
    starsGeometry.attributes.color.needsUpdate = true;
    starsGeometry.attributes.position.needsUpdate = true;

    // Animate directional light
    directionalLight.position.x = Math.sin(time * 0.5) * 40;

    // Animate logo float/rotation
    if (logoModel) {
        // Calculate position relative to the scrolled time
        // The logo represents "Real Now"
        const diffMinutes = -timeOffset / 60000;
        const xPos = diffMinutes * spacing;
        
        logoModel.position.x = xPos;
        logoModel.position.y = 7 + Math.sin(time * 0.3) * 0.3;
        logoModel.rotation.y = Math.sin(time * 0.5) * (2 * Math.PI / 180);
    }

    // controls.update(); // Removed OrbitControls

    lastTime = time;

    labelRenderer.render(scene, camera);
    composer.render();
}

animate();

    window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});