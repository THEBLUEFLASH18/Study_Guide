let folders = {};
let currentFolder = null;

// Load data from memory
function loadData() {
    const saved = localStorage.getItem('studyAppData');
    if (saved) {
        folders = JSON.parse(saved);
        renderFolders();
    }
}

// Save data to memory
function saveData() {
    localStorage.setItem('studyAppData', JSON.stringify(folders));
}

function openModal() {
    document.getElementById('modal').classList.add('active');
    document.getElementById('folderNameInput').value = '';
    document.getElementById('folderNameInput').focus();
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

function createFolder() {
    const name = document.getElementById('folderNameInput').value.trim();
    if (!name) return;

    const id = Date.now().toString();
    folders[id] = {
        name: name,
        cards: Array(6).fill(null).map(() => ({ question: '', answer: '' }))
    };

    saveData();
    renderFolders();
    closeModal();
}

function renderFolders() {
    const container = document.getElementById('foldersView');
    const existingFolders = Array.from(container.children).filter(el => !el.onclick || el.onclick.toString().includes('openModal'));
    existingFolders.forEach(el => el.remove());

    Object.entries(folders).forEach(([id, folder]) => {
        const card = document.createElement('div');
        card.className = 'folder-card';
        card.innerHTML = `
            <button class="delete-folder" onclick="event.stopPropagation(); deleteFolder('${id}')">×</button>
            <div class="folder-icon">📁</div>
            <div class="folder-name">${folder.name}</div>
            <div class="folder-count">6 cards</div>
        `;
        card.onclick = () => openFolder(id);
        container.insertBefore(card, container.firstChild);
    });
}

function deleteFolder(id) {
    if (confirm('Delete this folder?')) {
        delete folders[id];
        saveData();
        renderFolders();
    }
}

function openFolder(id) {
    currentFolder = id;
    document.getElementById('foldersView').classList.add('hidden');
    document.getElementById('cardsView').classList.remove('hidden');
    document.getElementById('currentFolderName').textContent = folders[id].name;
    renderCards();
}

function backToFolders() {
    if (currentFolder) {
        saveData();
    }
    currentFolder = null;
    document.getElementById('cardsView').classList.add('hidden');
    document.getElementById('foldersView').classList.remove('hidden');
}

function renderCards() {
    const grid = document.getElementById('cardsGrid');
    grid.innerHTML = '';

    folders[currentFolder].cards.forEach((card, index) => {
        const cardBox = document.createElement('div');
        cardBox.className = 'card-box';
        cardBox.innerHTML = `
            <textarea 
                class="question-input" 
                placeholder="Enter question..."
                oninput="updateCard(${index}, 'question', this.value)"
            >${card.question}</textarea>
            <div class="answer-space">
                <textarea 
                    class="answer-input" 
                    placeholder="Enter answer..."
                    oninput="updateCard(${index}, 'answer', this.value)"
                >${card.answer}</textarea>
            </div>
        `;
        grid.appendChild(cardBox);
    });
}

function updateCard(index, field, value) {
    folders[currentFolder].cards[index][field] = value;
    saveData();
}

// Load data on startup
loadData();

// Handle Enter key in modal
document.getElementById('folderNameInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') createFolder();
});

// Close modal on outside click
document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
});
