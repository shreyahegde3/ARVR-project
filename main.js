// import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import { Water } from 'three/examples/jsm/objects/Water.js';
// import { Sky } from 'three/examples/jsm/objects/Sky.js';
// // import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; // Import GLTFLoader
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


// // Scene, Camera, Renderer
// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
// const renderer = new THREE.WebGLRenderer({ antialias: true });
// renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.toneMapping = THREE.ACESFilmicToneMapping;
// renderer.toneMappingExposure = 0.5;
// document.body.appendChild(renderer.domElement);

// // Set camera position
// camera.position.set(0, 50, 100);
// camera.lookAt(0, 0, 0);

// // Create an 8x8 grid
// const gridSize = 8;
// const gridHelper = new THREE.GridHelper(gridSize * 10, gridSize);
// gridHelper.material.color.set(0x000000); // Set grid color to black
// gridHelper.position.y = 0.1; // Slightly above water to prevent z-fighting
// scene.add(gridHelper);

// // Lighting
// const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
// scene.add(ambientLight);

// const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
// directionalLight.position.set(-1, 1, 1);
// scene.add(directionalLight);

// // Create Water
// const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
// const water = new Water(waterGeometry, {
//     textureWidth: 512,
//     textureHeight: 512,
//     waterNormals: new THREE.TextureLoader().load('https://threejs.org/examples/textures/waternormals.jpg', function (texture) {
//         texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
//     }),
//     sunDirection: new THREE.Vector3(),
//     sunColor: 0xffffff,
//     waterColor: 0x001e0f,
//     distortionScale: 3.7,
//     fog: scene.fog !== undefined,
// });
// water.rotation.x = -Math.PI / 2;
// scene.add(water);

// // Add Sky
// const sky = new Sky();
// sky.scale.setScalar(10000);
// scene.add(sky);

// const skyUniforms = sky.material.uniforms;
// skyUniforms['turbidity'].value = 10;
// skyUniforms['rayleigh'].value = 2;
// skyUniforms['mieCoefficient'].value = 0.005;
// skyUniforms['mieDirectionalG'].value = 0.8;

// const parameters = {
//     elevation: 2,
//     azimuth: 180
// };

// const pmremGenerator = new THREE.PMREMGenerator(renderer);

// function updateSun() {
//     const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
//     const theta = THREE.MathUtils.degToRad(parameters.azimuth);
    
//     const sunPosition = new THREE.Vector3();
//     sunPosition.setFromSphericalCoords(1, phi, theta);
    
//     sky.material.uniforms['sunPosition'].value.copy(sunPosition);
//     water.material.uniforms['sunDirection'].value.copy(sunPosition).normalize();
    
//     scene.environment = pmremGenerator.fromScene(sky).texture;
// }

// updateSun();

// // Load a 3D Model

// const loader = new GLTFLoader();
// loader.load('submarine_5u.glb', function (gltf) {
//     scene.add(gltf.scene); // Add the model to the scene
//     gltf.scene.scale.set(0.01, 0.01, 0.01); // Adjust scaling if needed
//     scene.position.set(0, 0, 0);

// }, undefined, function (error) {
//     console.error(error);
// });


// // OrbitControls
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;
// controls.dampingFactor = 0.05;
// controls.screenSpacePanning = false;
// controls.minDistance = 50;
// controls.maxDistance = 500;
// controls.maxPolarAngle = Math.PI / 2;

// // Configure mouse buttons
// controls.mouseButtons = {
//     LEFT: THREE.MOUSE.ROTATE,
//     MIDDLE: THREE.MOUSE.PAN,
//     RIGHT: THREE.MOUSE.DOLLY
// };

// // Render loop
// function animate() {
//     requestAnimationFrame(animate);
//     water.material.uniforms['time'].value += 1.0 / 60.0;
//     controls.update();
//     renderer.render(scene, camera);
// }

// animate();

// // Handle window resizing
// window.addEventListener('resize', () => {
//     camera.aspect = window.innerWidth / window.innerHeight;
//     camera.updateProjectionMatrix();
//     renderer.setSize(window.innerWidth, window.innerHeight);
// });


import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;
document.body.appendChild(renderer.domElement);

// Set camera position
camera.position.set(0, 50, 100);
camera.lookAt(0, 0, 0);

// Custom shader for glowing effect
const glowVertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFragmentShader = `
  uniform vec3 glowColor;
  uniform float intensity;
  varying vec3 vNormal;
  void main() {
    float brightness = pow(0.8 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
    gl_FragColor = vec4(glowColor * intensity * brightness, 1.0);
  }
`;

// Create a custom grid that's thicker and glows
function createCustomGrid(size, divisions) {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const step = size / divisions;

    for (let i = 0; i <= divisions; i++) {
        const line = i * step - size / 2;
        vertices.push(-size/2, 0, line, size/2, 0, line);
        vertices.push(line, 0, -size/2, line, 0, size/2);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.ShaderMaterial({
        uniforms: {
            glowColor: { value: new THREE.Color(0xaaaaaa) }, // Grey color
            intensity: { value: 1.5 }
        },
        vertexShader: glowVertexShader,
        fragmentShader: glowFragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    });

    const grid = new THREE.LineSegments(geometry, material);
    grid.position.y = 0.1; // Slightly above water
    grid.renderOrder = 1; // Ensure grid renders on top of water

    // Make lines thicker
    grid.material.linewidth = 3;

    return grid;
}

const customGrid = createCustomGrid(80, 8); // 8x8 grid, 80 units wide
scene.add(customGrid);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(-1, 1, 1);
scene.add(directionalLight);

// Create Water
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
const water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load('https://threejs.org/examples/textures/waternormals.jpg', function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined,
});
water.rotation.x = -Math.PI / 2;
water.material.side = THREE.FrontSide; // Render only the top side of the water
scene.add(water);

// Add Sky
const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 10;
skyUniforms['rayleigh'].value = 2;
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.8;

const parameters = {
    elevation: 2,
    azimuth: 180
};

const pmremGenerator = new THREE.PMREMGenerator(renderer);

function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);
    
    const sunPosition = new THREE.Vector3();
    sunPosition.setFromSphericalCoords(1, phi, theta);
    
    sky.material.uniforms['sunPosition'].value.copy(sunPosition);
    water.material.uniforms['sunDirection'].value.copy(sunPosition).normalize();
    
    scene.environment = pmremGenerator.fromScene(sky).texture;
}

updateSun();

// Load a 3D Model

const loader = new GLTFLoader();
loader.load('submarine_5u.glb', function (gltf) {
    scene.add(gltf.scene); // Add the model to the scene
    gltf.scene.scale.set(0.01, 0.01, 0.01); // Adjust scaling if needed
    scene.position.set(0, 0, 0);

}, undefined, function (error) {
    console.error(error);
});

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 50;
controls.maxDistance = 500;
controls.maxPolarAngle = Math.PI / 2;

// Configure mouse buttons
controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.PAN,
    RIGHT: THREE.MOUSE.DOLLY
};

// Render loop
function animate() {
    requestAnimationFrame(animate);
    water.material.uniforms['time'].value += 1.0 / 60.0;
    controls.update();

    // Update grid glow intensity (optional: for pulsating effect)
    const time = Date.now() * 0.001;
    customGrid.material.uniforms.intensity.value = 1.5 + Math.sin(time) * 0.5;

    renderer.render(scene, camera);
}

animate();

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});