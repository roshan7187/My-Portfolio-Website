import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Configuration ---
const CONFIG = {
    particleCount: 2000,
    particleSize: 0.05,
    cameraZ: 5,
    mouseSensitivity: 0.0005,
    projects: [
        { title: "News Portal", desc: "Real-time news aggregator with admin dashboard.", tech: "React / Node.js", radius: 2.5, speed: 0.2, color: 0xff4444, link: "#" },
        { title: "E-Commerce", desc: "Full-stack shopping platform with Stripe integration.", tech: "Next.js / Stripe", radius: 3.5, speed: 0.15, color: 0x44ff44, link: "#" },
        { title: "Device Tracker", desc: " IoT device monitoring system on AWS.", tech: "IoT / AWS", radius: 4.5, speed: 0.1, color: 0x4444ff, link: "#" },
        { title: "Debatify", desc: "Gamified debating platform with live voting.", tech: "WebRTC / Socket.io", radius: 5.5, speed: 0.08, color: 0xffff44, link: "#" },
        { title: "2048 App", desc: "Optimized clone of the popular puzzle game.", tech: "React / Logic", radius: 6.5, speed: 0.05, color: 0xff44ff, link: "#" },
        { title: "AI Chatbot", desc: "NLP-based customer support agent.", tech: "Python / TensorFlow", radius: 7.5, speed: 0.12, color: 0x00f0ff, link: "#" },
        { title: "Crypto Dash", desc: "Real-time cryptocurrency tracker.", tech: "Vue.js / API", radius: 8.5, speed: 0.09, color: 0xffaa00, link: "#" },
        { title: "Task Master", desc: "Productivity app with gamification.", tech: "React Native / Firebase", radius: 9.5, speed: 0.06, color: 0x00ff00, link: "#" }
    ]
};

// --- Global State ---
const state = {
    mouseX: 0,
    mouseY: 0,
    targetX: 0,
    targetY: 0,
    isDragging: false,
    previousMousePosition: { x: 0, y: 0 },
    rotationVelocity: { x: 0, y: 0 },
    solarSystem: null,
    raycaster: new THREE.Raycaster(),
    mouseVector: new THREE.Vector2(),
    hoveredPlanet: null
};

// --- Initialization ---
// --- Initialization ---
const init = () => {
    // 1. Matrix Preloader Logic
    const canvas = document.getElementById('matrix-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops = [];
        for (let x = 0; x < columns; x++) drops[x] = 1;

        let lastTime = 0;
        const dropInterval = 45;
        let animationFrameId;

        const drawMatrix = (currentTime) => {
            if (currentTime - lastTime > dropInterval) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = "#00f0ff";
                ctx.font = fontSize + "px monospace";

                for (let i = 0; i < drops.length; i++) {
                    const text = Math.random() > 0.5 ? "1" : "0";
                    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975)
                        drops[i] = 0;

                    drops[i]++;
                }
                lastTime = currentTime;
            }
            animationFrameId = requestAnimationFrame(drawMatrix);
        };

        animationFrameId = requestAnimationFrame(drawMatrix);

        // Remove Preloader (Cinematic "God Mode" Transition)
        const preloader = document.getElementById('preloader');
        const ui = document.getElementById('ui-layer');
        const canvasContainer = document.getElementById('canvas-container');

        // Static Reveal: No initial transforms needed

        setTimeout(() => {
            const tl = gsap.timeline({
                onComplete: () => {
                    cancelAnimationFrame(animationFrameId);
                    preloader.remove();
                }
            });

            // 1. Dissolve the Rain (Pure Fade Out)
            tl.to(preloader, {
                opacity: 0,
                duration: 2.5,
                ease: "power2.inOut"
            }, 0);

        }, 5000);
    } else {
        // Fallback if canvas missing
        const preloader = document.getElementById('preloader');
        if (preloader) setTimeout(() => { preloader.remove(); }, 1000);
    }

    // 2. Setup Scene
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0008); // Deep space fog

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = CONFIG.cameraZ;
    camera.position.y = 0;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 3. Create Particles (The "Living Universe")
    // Using a custom buffer geometry for performance
    const particlesGeometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(CONFIG.particleCount * 3);
    // const randomArray = new Float32Array(CONFIG.particleCount * 3); // For individual movement

    for (let i = 0; i < CONFIG.particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 15; // Spread particles
        // randomArray[i] = (Math.random() - 0.5);
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    // particlesGeometry.setAttribute('aRandom', new THREE.BufferAttribute(randomArray, 3));

    // Custom Shader Material for "God Level" Glow
    // Note: Since we are using basic THREE for now to ensure it works without complex GLSL loading first,
    // we use PointsMaterial but with a size attenuation and color map if available, or just colors.
    // For "God Level", we should eventually write a custom ShaderMaterial.
    const material = new THREE.PointsMaterial({
        size: CONFIG.particleSize,
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        // sizeAttenuation: true
    });

    const particlesMesh = new THREE.Points(particlesGeometry, material);
    scene.add(particlesMesh);

    // 4. Add "stars" in background (Simpler dots further away)
    const starGeo = new THREE.BufferGeometry();
    const starCount = 5000;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
        starPos[i] = (Math.random() - 0.5) * 100;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.02, transparent: true, opacity: 0.5 });
    const starMesh = new THREE.Points(starGeo, starMat);
    scene.add(starMesh);

    // 5. Create Atomic System (Projects)
    createAtomicSystem(scene);

    // 6. Interaction Listeners
    document.addEventListener('mousedown', () => state.isDragging = true);
    document.addEventListener('mouseup', () => state.isDragging = false);

    document.addEventListener('mousemove', (event) => {
        state.mouseX = event.clientX - window.innerWidth / 2;
        state.mouseY = event.clientY - window.innerHeight / 2;

        state.mouseVector.x = (event.clientX / window.innerWidth) * 2 - 1;
        state.mouseVector.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Custom Drag Rotation Logic
        if (state.isDragging && state.atomicSystem) {
            const deltaMove = {
                x: event.clientX - state.previousMousePosition.x,
                y: event.clientY - state.previousMousePosition.y
            };

            state.atomicSystem.rotation.y += deltaMove.x * 0.005;
            state.atomicSystem.rotation.x += deltaMove.y * 0.005;
        }

        state.previousMousePosition = { x: event.clientX, y: event.clientY };

        // Hero Title Parallax (Only if not dragging)
        if (!state.isDragging) {
            gsap.to('.hero-title', {
                x: state.mouseX * 0.02,
                y: state.mouseY * 0.02,
                duration: 1
            });
        }

        // Move Tooltip
        const tooltip = document.getElementById('project-tooltip');
        if (state.hoveredPlanet) {
            gsap.to(tooltip, {
                left: event.clientX + 20,
                top: event.clientY + 20,
                duration: 0.1
            });
        }
    });

    // Click Listener for Solar System
    document.addEventListener('click', () => {
        if (state.hoveredPlanet) {
            window.open(state.hoveredPlanet.userData.link, '_blank');
        }
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // 7. Animation Loop
    const clock = new THREE.Clock();

    const animate = () => {
        const elapsedTime = clock.getElapsedTime();

        particlesMesh.rotation.y = elapsedTime * 0.05;
        starMesh.rotation.y = elapsedTime * 0.01;

        // Atomic Orbit Animation
        if (state.atomicSystem) {
            // Auto Rotation (Slow) if not dragging
            if (!state.isDragging) {
                state.atomicSystem.rotation.y += 0.002; // Slow global rotation
            }

            state.atomicSystem.children.forEach(orbit => {
                // Rotate the pivot (the electron)
                if (orbit.userData.pivot && orbit.userData.speed) {
                    orbit.userData.pivot.rotation.z += orbit.userData.speed * 0.02;
                }
            });
        }

        // Camera Follow
        state.targetX = state.mouseX * CONFIG.mouseSensitivity;
        state.targetY = state.mouseY * CONFIG.mouseSensitivity;
        camera.rotation.y += 0.05 * (state.targetX - camera.rotation.y);
        camera.rotation.x += 0.05 * (state.targetY - camera.rotation.x);

        // Raycasting for Interaction (ONLY when visible)
        if (state.atomicSystem && state.atomicSystem.visible) {
            state.raycaster.setFromCamera(state.mouseVector, camera);
            // Only intersect with the Atomic System group children
            const intersects = state.raycaster.intersectObjects(state.atomicSystem.children, true);

            const tooltip = document.getElementById('project-tooltip');

            if (intersects.length > 0) {
                // Check if it's a planet
                const object = intersects.find(hit => hit.object.userData.isPlanet);
                if (object) {
                    document.body.style.cursor = 'pointer';
                    const planet = object.object;

                    if (state.hoveredPlanet !== planet) {
                        if (state.hoveredPlanet) { // Reset previous hovered planet's scale
                            gsap.to(state.hoveredPlanet.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
                        }
                        state.hoveredPlanet = planet;
                        gsap.to(planet.scale, { x: 2, y: 2, z: 2, duration: 0.3 }); // Bigger pop for atoms

                        // Show Tooltip
                        tooltip.style.display = 'block';
                        document.getElementById('tooltip-title').innerText = planet.userData.title;
                        document.getElementById('tooltip-desc').innerText = planet.userData.desc;
                        document.getElementById('tooltip-tech').innerText = planet.userData.tech;
                        gsap.to(tooltip, { opacity: 1, duration: 0.3 });
                    }
                } else {
                    if (state.hoveredPlanet) {
                        gsap.to(state.hoveredPlanet.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
                        state.hoveredPlanet = null;
                        gsap.to(tooltip, { opacity: 0, duration: 0.2, onComplete: () => tooltip.style.display = 'none' });
                    }
                    document.body.style.cursor = 'default';
                }
            } else {
                if (state.hoveredPlanet) {
                    gsap.to(state.hoveredPlanet.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
                    state.hoveredPlanet = null;
                    gsap.to(tooltip, { opacity: 0, duration: 0.2, onComplete: () => tooltip.style.display = 'none' });
                }
                document.body.style.cursor = 'default';
            }
        }

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    };

    animate();

    // 9. Initialize GSAP ScrollTrigger
    initScrollAnimations(camera, particlesMesh);
};

// --- Helper Functions ---
// --- Helper Functions ---
function createAtomicSystem(scene) {
    const group = new THREE.Group();
    state.atomicSystem = group;
    group.visible = false;
    group.scale.set(0.3, 0.3, 0.3); // Fits screen better
    group.position.set(0, 0, 0); // Explicit Center

    // Core Nucleus (Glowing Sun)
    const nucleusGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const nucleusMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);

    // Add Glow to Nucleus
    const glowGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.15, side: THREE.BackSide });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    nucleus.add(glow);

    group.add(nucleus);

    CONFIG.projects.forEach((proj, i) => {
        // Create a Container for this Orbit (Orientation)
        const orbitGroup = new THREE.Group();

        // Random 3D Rotation for Chaosphere look
        orbitGroup.rotation.x = Math.random() * Math.PI;
        orbitGroup.rotation.y = Math.random() * Math.PI;
        orbitGroup.rotation.z = Math.random() * Math.PI;

        // Orbit Path (Line)
        const curve = new THREE.EllipseCurve(0, 0, proj.radius, proj.radius, 0, 2 * Math.PI, false, 0);
        const points = curve.getPoints(100);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const trackColor = i % 2 === 0 ? 0x00f0ff : 0xffaa00;
        const material = new THREE.LineBasicMaterial({ color: trackColor, transparent: true, opacity: 0.3 });
        const orbitRing = new THREE.Line(geometry, material);
        orbitGroup.add(orbitRing);

        // Planet Pivot (Rotates Z to move planet along the ring)
        const planetPivot = new THREE.Group();
        planetPivot.rotation.z = Math.random() * Math.PI * 2;
        planetPivot.userData = { speed: proj.speed };
        orbitGroup.add(planetPivot);

        // Planet (Transparent Ball)
        const planetGeo = new THREE.SphereGeometry(0.4, 32, 32);
        const planetMat = new THREE.MeshBasicMaterial({
            color: trackColor,
            transparent: true,
            opacity: 0.3,
            depthWrite: false,
            side: THREE.FrontSide
        });
        const planet = new THREE.Mesh(planetGeo, planetMat);

        // Position planet on the ring (radius X)
        planet.position.x = proj.radius;

        // Planet data
        planet.userData = {
            isPlanet: true,
            link: proj.link,
            title: proj.title,
            desc: proj.desc,
            tech: proj.tech,
            originalOpacity: 0.3
        };

        planetPivot.add(planet);
        group.add(orbitGroup);
    });

    scene.add(group);
}

const initScrollAnimations = (camera, mesh) => {
    gsap.registerPlugin(ScrollTrigger);

    // Animate Sections (About, Skills, Contact)
    gsap.utils.toArray('.glass-card').forEach(card => {
        gsap.to(card, {
            opacity: 1,
            y: 0,
            duration: 1,
            scrollTrigger: {
                trigger: card,
                start: "top 85%", // Trigger earlier
                toggleActions: "play none none reverse"
            }
        });
    });

    // Warp Speed effect on Scroll
    ScrollTrigger.create({
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
            // Accelerate rotation based on scroll velocity
            const vel = self.getVelocity();
            gsap.to(mesh.rotation, {
                y: mesh.rotation.y + (vel * 0.0005),
                duration: 0.5,
                overwrite: true
            });

            // Zoom camera slightly
            // camera.position.z = 5 - (self.progress * 2);
        }
    });

    // Visibility Toggles
    ScrollTrigger.create({
        trigger: "#projects",
        start: "top center",
        end: "bottom center",
        onEnter: () => { if (state.atomicSystem) state.atomicSystem.visible = true; },
        onLeave: () => { if (state.atomicSystem) state.atomicSystem.visible = false; },
        onEnterBack: () => { if (state.atomicSystem) state.atomicSystem.visible = true; },
        onLeaveBack: () => { if (state.atomicSystem) state.atomicSystem.visible = false; }
    });
};

init();
