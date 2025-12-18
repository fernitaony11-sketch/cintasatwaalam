// GLOBAL STATE
let currentUser = '';
let uploadedImages = [];
let stats = { uploads: 1247, species: 28, users: 5892 };
let currentFilter = 'all';

// SAMPLE DATA
const speciesData = {
    harimau: {
        name: 'Harimau Sumatera (Panthera tigris sumatrae)',
        confidence: 97,
        habitat: 'Hutan hujan primer Sumatera (0-2000m)',
        status: 'Kritis (CR)',
        population: '±400 ekor',
        tips: ['Laporkan perburuan ilegal ke KLHK', 'Tanam pohon di buffer zona habitat', 'Donasi ke HarimauKITAS atau WWF']
    },
    badak: {
        name: 'Badak Jawa (Rhinoceros sondaicus)',
        confidence: 99,
        habitat: 'Taman Nasional Ujung Kulon',
        status: 'Kritis (CR)',
        population: '76 ekor (2025)',
        tips: ['Tolak mitos obat tradisional badak', 'Dukung ekowisata berkelanjutan', 'Partisipasi citizen science']
    },
    maleo: {
        name: 'Burung Maleo (Macrocephalon maleo)',
        confidence: 92,
        habitat: 'Pantai berpasir Sulawesi Utara',
        status: 'Rentan (EN)',
        population: '±4,000 ekor',
        tips: ['Jangan konsumsi telur Maleo', 'Edukasi masyarakat lokal', 'Monitoring sarang via iNaturalist']
    }
};

const gallerySamples = [
    { src: 'https://images.unsplash.com/photo-1426604835664-4c2c868a865d?w=400', species: 'Harimau Sumatera', confidence: 97, category: 'tiger' },
    { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400', species: 'Badak Jawa', confidence: 99, category: 'rhino' },
    { src: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400', species: 'Burung Maleo', confidence: 92, category: 'bird' },
    { src: 'https://images.unsplash.com/photo-1434394690282-1bbd9250524e?w=400', species: 'Harimau Sumatera', confidence: 94, category: 'tiger' },
    { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', species: 'Orangutan', confidence: 91, category: 'rhino' },
    { src: 'https://images.unsplash.com/photo-1570549717069-e5b47c7f3709?w=400', species: 'Burung Maleo', confidence: 89, category: 'bird' }
];

// INIT
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    loadGallery();
    animateStats();
    
    // Event listeners
    setupDragDrop();
    setupFilters();
    setupIntersectionObserver();
});

// LOGIN FUNCTIONS - Akses Bebas
function quickLogin(name) {
    currentUser = name;
    loginSuccess();
}

function loginUser() {
    const username = document.getElementById('username').value.trim();
    currentUser = username || 'Pengunjung';
    loginSuccess();
}

function loginSuccess() {
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('userName').textContent = currentUser;
    document.getElementById('logoutBtn').style.display = 'flex';
    
    // Welcome message
    setTimeout(() => {
        showNotification(`Selamat datang, ${currentUser}! Mari lindungi satwa bersama AI! 🐯`, 'success');
    }, 500);
}

function logoutUser() {
    currentUser = '';
    document.getElementById('loginModal').classList.add('active');
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('username').value = '';
    showNotification('Terima kasih telah berkontribusi!', 'info');
}

// NAVIGATION
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    document.getElementById(sectionId).classList.add('active');
    event.target.closest('.nav-link').classList.add('active');
    
    // Close mobile menu
    document.querySelector('.nav-menu').classList.remove('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMenu() {
    document.querySelector('.nav-menu').classList.toggle('active');
}

// DRAG & DROP - Klasifikasi AI
function setupDragDrop() {
    const uploadArea = document.getElementById('uploadArea');
    const imageUpload = document.getElementById('imageUpload');
    
    uploadArea.addEventListener('click', () => imageUpload.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    imageUpload.addEventListener('change', (e) => handleFile(e.target.files[0]));
    
    // Click hint
    document.querySelector('.click-here').addEventListener('click', () => imageUpload.click());
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    handleFile(e.dataTransfer.files[0]);
}

function handleFile(file) {
    if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
        showNotification('File harus gambar (JPG/PNG) maksimal 5MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        showProcessing();
        setTimeout(() => {
            const result = classifyImage(e.target.result, file.name);
            addToGallery(e.target.result, result.name, result.confidence);
            stats.uploads++;
            stats.species++;
            stats.users++;
            animateStats();
        }, 2000);
    };
    reader.readAsDataURL(file);
}

// MOCK AI CLASSIFICATION
function classifyImage(imageData, filename) {
    const species = Object.values(speciesData)[Math.floor(Math.random() * 3)];
    species.filename = filename;
    
    showResult(species);
    return species;
}

function showProcessing() {
    document.getElementById('uploadArea').classList.add('hidden');
    document.getElementById('processingArea').classList.remove('hidden');
}

function showResult(species) {
    document.getElementById('processingArea').classList.add('hidden');
    document.getElementById('resultArea').classList.remove('hidden');
    
    document.getElementById('previewImg').src = species.image || 'https://images.unsplash.com/photo-1426604835664-4c2c868a865d?w=500';
    document.getElementById('speciesName').textContent = species.name;
    document.getElementById('confidence').textContent = `${species.confidence}%`;
    document.getElementById('habitat').textContent = species.habitat;
    document.getElementById('status').textContent = species.status;
    document.getElementById('population').textContent = species.population;
    
    // Confidence bar
    document.querySelector('.confidence-fill').style.width = `${species.confidence}%`;
    
    // Protection tips
    const tipsList = document.getElementById('protectionList');
    tipsList.innerHTML = species.tips.map(tip => `<li>${tip}</li>`).join('');
}

function resetClassifier() {
    document.getElementById('resultArea').classList.add('hidden');
    document.getElementById('uploadArea').classList.remove('hidden');
    document.getElementById('imageUpload').value = '';
}

// GALERY FUNCTIONS
function loadGallery() {
    gallerySamples.forEach((item, index) => {
        setTimeout(() => addToGallery(item.src, item.species, item.confidence, item.category), index * 150);
    });
}

function addToGallery(src, species, confidence, category = 'all') {
    const galleryGrid = document.getElementById('galleryGrid');
    const item = document.createElement('div');
    item.className = `gallery-item ${category}`;
    item.dataset.category = category;
    item.onclick = () => {
        showSection('classifier');
        setTimeout(() => {
            const speciesData = Object.values(speciesData).find(s => s.name.includes(species));
            showResult(speciesData);
            document.getElementById('previewImg').src = src;
        }, 300);
    };
    
    item.innerHTML = `
        <img src="${src}" alt="${species}" loading="lazy">
        <div class="gallery-info">
            <div class="species-name">${species}</div>
            <div class="confidence-tag">${confidence}% AI</div>
        </div>
    `;
    
    galleryGrid.appendChild(item);
}

function setupFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelector('.filter-btn.active').classList.remove('active');
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            filterGallery();
        });
    });
}

function filterGallery() {
    document.querySelectorAll('.gallery-item').forEach(item => {
        if (currentFilter === 'all' || item.dataset.category === currentFilter) {
            item.style.display = 'block';
            item.style.animation = 'fadeInUp 0.5s ease forwards';
        } else {
            item.style.display = 'none';
        }
    });
}

// STATS ANIMATION
function animateStats() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        const target = parseFloat(card.dataset.target.replace(',', ''));
        const number = card.querySelector('.stat-number');
        let current = 0;
        const increment = target / 60;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                number.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                number.textContent = Math.floor(current).toLocaleString();
            }
        }, 30);
    });
}

// SOCIAL SHARING
function shareResult() {
    const speciesName = document.getElementById('speciesName').textContent;
    const confidence = document.getElementById('confidence').textContent;
    
    if (navigator.share) {
        navigator.share({
            title: `Saya menemukan ${speciesName}! (${confidence})`,
            text: `Cek hasil klasifikasi AI SatwaAI. Mari lindungi satwa Indonesia! 🐯`,
            url: `${window.location.href}#classifier`
        });
    } else {
        const shareText = `Saya baru mengklasifikasi ${speciesName} dengan akurasi ${confidence} menggunakan SatwaAI! Mari bergabung melindungi satwa Indonesia: ${window.location.href}`;
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('✅ Teks berhasil disalin! Bagikan ke sosial media', 'success');
        });
    }
}

function saveResult() {
    showNotification('💾 Hasil disimpan ke galeri lokal', 'success');
}

// NOTIFICATION SYSTEM
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        ${message}
    `;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s;
        max-width: 350px;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => notification.style.transform = 'translateX(0)');
    
    // Auto remove
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// INTERSECTION OBSERVER for animations
function setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.gallery-item, .edu-card, .stat-card').forEach(el => {
        observer.observe(el);
    });
}

// INIT APP
function initApp() {
    // Add CSS for notifications
    const style = document.createElement('style');
    style.textContent = `
        .notification { display: flex; align-items: center; gap: 12px; font-weight: 500; }
        .notification i { font-size: 1.3rem; }
    `;
    document.head.appendChild(style);
}

// Mobile menu toggle
document.querySelector('.hamburger').addEventListener('click', toggleMenu);

// Prevent menu close on nav links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelector('.nav-menu').classList.remove('active');
    });
});
