// ============================================================
// 1. THREE.JS — BACKGROUND 3D INTERAKTIF
// ============================================================
const container = document.getElementById('three-canvas');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0d15);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// --- Particle System ---
const particleGeo = new THREE.BufferGeometry();
const count = 2500;
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);

for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 30;
    positions[i+1] = (Math.random() - 0.5) * 20;
    positions[i+2] = (Math.random() - 0.5) * 30 - 10;

    const color = new THREE.Color().setHSL(0.75 + Math.random() * 0.15, 0.8, 0.5);
    colors[i] = color.r;
    colors[i+1] = color.g;
    colors[i+2] = color.b;
}

particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const particleMat = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
});

const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// --- Glowing Core (Torus Knot) ---
const coreMat = new THREE.MeshStandardMaterial({
    color: 0x7c3aed,
    emissive: 0x3b82f6,
    emissiveIntensity: 0.4,
    roughness: 0.2,
    metalness: 0.8,
    wireframe: false,
});
const coreGeo = new THREE.TorusKnotGeometry(0.8, 0.3, 100, 16);
const core = new THREE.Mesh(coreGeo, coreMat);
core.position.y = -0.2;
scene.add(core);

// --- Ring Orbit ---
const ringMat = new THREE.MeshBasicMaterial({
    color: 0x8b5cf6,
    wireframe: true,
    transparent: true,
    opacity: 0.15,
});
const ringGeo = new THREE.TorusGeometry(1.8, 0.02, 16, 100);
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = Math.PI / 2;
ring.position.y = -0.2;
scene.add(ring);

// --- Lighting ---
const ambient = new THREE.AmbientLight(0x404060);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(2, 5, 5);
scene.add(dirLight);
const pointLight = new THREE.PointLight(0x7c3aed, 0.8, 20);
pointLight.position.set(-3, 1, 4);
scene.add(pointLight);

// --- Mouse Tracking ---
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

// --- Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Animasi Loop ---
function animate() {
    requestAnimationFrame(animate);

    // Rotasi lambat
    particles.rotation.y += 0.0003;
    core.rotation.x += 0.005;
    core.rotation.y += 0.008;
    ring.rotation.z += 0.005;

    // Follow mouse secara halus
    camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.02;
    camera.position.y += (mouseY * 0.8 + 2 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}
animate();

// ============================================================
// 2. CHAT LOGIC — ENDPOINT API
// ============================================================
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearChat');
const charCount = document.querySelector('.char-count');

// Update karakter
chatInput.addEventListener('input', () => {
    charCount.textContent = chatInput.value.length;
});

// Kirim pesan
async function sendMessage() {
    const prompt = chatInput.value.trim();
    if (!prompt) return;

    // Tampilkan pesan user
    appendMessage('user', prompt);
    chatInput.value = '';
    charCount.textContent = '0';
    sendBtn.disabled = true;

    // Tampilkan indikator loading
    const loadingId = appendLoading();

    try {
        const url = `https://api.siputzx.my.id/api/ai/gptoss120b?prompt=${encodeURIComponent(prompt)}&system=You+are+a+helpful+assistant.&temperature=0.7`;
        
        const response = await fetch(url);
        const data = await response.json();

        // Hapus loading
        removeLoading(loadingId);

        if (data.status && data.data) {
            appendMessage('bot', data.data);
        } else {
            appendMessage('bot', '⚠️ Maaf, terjadi kesalahan. Coba lagi nanti.');
        }
    } catch (error) {
        removeLoading(loadingId);
        appendMessage('bot', '❌ Gagal terhubung ke server. Periksa koneksi internetmu.');
        console.error('Error:', error);
    } finally {
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

// Helper: Append message
function appendMessage(type, content) {
    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.innerHTML = `
        <div class="msg-avatar"><i class="fas ${type === 'bot' ? 'fa-robot' : 'fa-user'}"></i></div>
        <div class="msg-bubble">${escapeHtml(content)}</div>
    `;
    chatMessages.appendChild(div);
    scrollToBottom();
}

// Helper: Loading
function appendLoading() {
    const id = 'loading-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'message bot';
    div.innerHTML = `
        <div class="msg-avatar"><i class="fas fa-robot"></i></div>
        <div class="msg-bubble" style="display:flex; gap:6px;">
            <span style="animation: pulse-dot 1.4s infinite;">●</span>
            <span style="animation: pulse-dot 1.4s infinite 0.2s;">●</span>
            <span style="animation: pulse-dot 1.4s infinite 0.4s;">●</span>
        </div>
    `;
    chatMessages.appendChild(div);
    scrollToBottom();
    return id;
}

function removeLoading(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Escape HTML sederhana
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Clear chat
clearBtn.addEventListener('click', () => {
    chatMessages.innerHTML = '';
    appendMessage('bot', '🧹 Chat dibersihkan. Ada yang bisa saya bantu lagi?');
});