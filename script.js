import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBt0nW_xlQMvKTduV0qmMufGFFZ9hpIFlE",
    authDomain: "study-guide-e44d8.firebaseapp.com",
    projectId: "study-guide-e44d8",
    storageBucket: "study-guide-e44d8.firebasestorage.app",
    messagingSenderId: "604563750602",
    appId: "1:604563750602:web:ac1e70765f649afbff3e33",
    measurementId: "G-GJC2Q0TGQP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

let folders = {};
let currentFolder = null;

// Load data from Firestore
async function loadData() {
    try {
        const querySnapshot = await getDocs(collection(db, "folders"));
        folders = {};
        querySnapshot.forEach((doc) => {
            folders[doc.id] = doc.data();
        });
        renderFolders();
    } catch (e) {
        console.error("Error loading documents: ", e);
        alert("Error loading data. Check console for details.");
    }
}

// Expose functions to window for HTML onclick handlers
window.openModal = function () {
    document.getElementById('modal').classList.add('active');
    document.getElementById('folderNameInput').value = '';
    document.getElementById('folderNameInput').focus();
}

window.closeModal = function () {
    document.getElementById('modal').classList.remove('active');
}

window.createFolder = async function () {
    const name = document.getElementById('folderNameInput').value.trim();
    if (!name) return;

    const id = Date.now().toString();
    const newFolder = {
        name: name,
        cards: Array(6).fill(null).map(() => ({ question: '', answer: '' }))
    };

    try {
        await setDoc(doc(db, "folders", id), newFolder);
        folders[id] = newFolder;
        renderFolders();
        closeModal();
    } catch (e) {
        console.error("Error adding document: ", e);
        alert("Error creating folder. Check console.");
    }
}

function renderFolders() {
    const container = document.getElementById('foldersView');
    // Remove all folders that are NOT the "New Folder" button (which calls openModal)
    const existingFolders = Array.from(container.children).filter(el => {
        const onclick = el.getAttribute('onclick');
        const isNewFolderBtn = onclick && onclick.includes('openModal');
        return !isNewFolderBtn;
    });
    existingFolders.forEach(el => el.remove());

    // Find the "New Folder" button to insert before it
    const newFolderBtn = Array.from(container.children).find(el => {
        const onclick = el.getAttribute('onclick');
        return onclick && onclick.includes('openModal');
    });

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

        if (newFolderBtn) {
            container.insertBefore(card, newFolderBtn);
        } else {
            container.appendChild(card);
        }
    });
}

window.deleteFolder = async function (id) {
    if (confirm('Delete this folder?')) {
        try {
            await deleteDoc(doc(db, "folders", id));
            delete folders[id];
            renderFolders();
        } catch (e) {
            console.error("Error deleting document: ", e);
            alert("Error deleting folder.");
        }
    }
}

window.openFolder = function (id) {
    currentFolder = id;
    document.getElementById('foldersView').classList.add('hidden');
    document.getElementById('cardsView').classList.remove('hidden');
    document.getElementById('currentFolderName').textContent = folders[id].name;
    renderCards();
}

window.backToFolders = function () {
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

// Debounce function to prevent too many writes
let debounceTimer;
window.updateCard = function (index, field, value) {
    folders[currentFolder].cards[index][field] = value;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        try {
            const folderRef = doc(db, "folders", currentFolder);
            await updateDoc(folderRef, {
                cards: folders[currentFolder].cards
            });
        } catch (e) {
            console.error("Error updating document: ", e);
        }
    }, 1000); // Wait 1 second after last keystroke before saving
}

window.addCard = async function () {
    if (!currentFolder) return;

    // Add new empty card
    folders[currentFolder].cards.push({ question: '', answer: '' });

    // Update UI immediately
    renderCards();

    // Update Firestore
    try {
        const folderRef = doc(db, "folders", currentFolder);
        await updateDoc(folderRef, {
            cards: folders[currentFolder].cards
        });
    } catch (e) {
        console.error("Error adding card: ", e);
        alert("Error adding card. Check console.");
    }
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
