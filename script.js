/**
 * AI Innovation Society - Certificate Generator
 * Main JavaScript File
 */

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    canvas: {
        width: 3508,
        height: 2480
    },

    textPositions: {
        participantName: {
            x: 1754,
            y: 1180
        },
        serialNumber: {
            x: 3355,
            y: 2450
        }
    },

    fonts: {
        participantName: {
            size: 160,
            weight: 'normal',
            family: '"Great Vibes", cursive',
            color: '#1e3a5f'
        },
        eventDetails: {
            size: 48,
            weight: 'normal',
            family: 'Georgia, serif',
            color: '#374151'
        },
        eventNameHighlight: {
            size: 48,
            weight: 'bold',
            family: 'Georgia, serif',
            color: '#1e3a5f'
        },
        certificateTitle: {
            size: 140,
            weight: 'bold',
            family: 'Georgia, serif',
            color: '#1e3a8a'
        },
        ofParticipation: {
            size: 80,
            weight: 'bold',
            family: 'Georgia, serif',
            color: '#c9a227'
        },
        awardedTo: {
            size: 45,
            weight: 'normal',
            family: 'Arial, sans-serif',
            color: '#355284ff'
        },
        signatoryName: {
            size: 38,
            weight: 'bold',
            family: 'Georgia, serif',
            color: '#1e3a5f'
        },
        signatoryDesignation: {
            size: 28,
            weight: 'normal',
            family: 'Arial, sans-serif',
            color: '#64748b'
        },
        logoText: {
            size: 32,
            weight: 'bold',
            family: 'Arial, sans-serif',
            color: '#1e3a5f'
        },
        certificateId: {
            size: 30,
            weight: 'normal',
            family: 'Courier New, monospace',
            color: '#94a3b8'
        },
        serialNumber: {
            size: 32,
            weight: 'bold',
            family: 'Consolas, Courier New, monospace',
            color: '#032bf0'
        }
    },

    signatories: [
        {
            name: 'Dr. Hufsa Mohsin',
            designation: 'HOD, Department Of Artificial Intelligence'
        },
        {
            name: 'Sudais Khalid',
            designation: 'President, AI Innovation Society'
        },
        {
            name: 'Muhammad Tahir',
            designation: 'Head, AI Innovation Society'
        }
    ],

    backgroundImage: 'iieq-certificat.png'
};

// ========================================
// DOM ELEMENTS
// ========================================

const elements = {
    form: document.getElementById('certificateForm'),
    canvas: document.getElementById('certificateCanvas'),
    participantName: document.getElementById('participantName'),
    generateBtn: document.getElementById('generateBtn'),
    downloadPdfBtn: document.getElementById('downloadPdfBtn'),
    printBtn: document.getElementById('printBtn'),
    placeholderMessage: document.getElementById('placeholderMessage'),
    canvasWrapper: document.querySelector('.canvas-wrapper'),
    participantInfo: document.getElementById('participantInfo'),
    serialNoDisplay: document.getElementById('serialNoDisplay'),
    statusDisplay: document.getElementById('statusDisplay')
};

const ctx = elements.canvas.getContext('2d');

// State
let certificateGenerated = false;
let backgroundImageLoaded = false;
let backgroundImage = new Image();
let participantsList = [];
let participantsData = [];
let currentParticipantSerial = null;
let fontLoaded = false;

const CSV_CONFIG = {
    fileName: 'AIS%20Event%20Joining%20Participant.csv',
    nameColumnIndex: 2
};

const EVENT_CONFIG = {
    eventName: 'AI Workshop',
    eventDate: 'January 12, 2026'
};

// localStorage key for new names
const STORAGE_KEY = 'ais_new_participants';

// ========================================
// FONT LOADING
// ========================================

function loadCustomFont() {
    if (document.fonts) {
        document.fonts.ready.then(() => {
            fontLoaded = true;
            console.log('Custom fonts loaded successfully');
        });
    } else {
        setTimeout(() => { fontLoaded = true; }, 1000);
    }
}

// ========================================
// INITIALIZATION
// ========================================

function init() {
    elements.canvas.width = CONFIG.canvas.width;
    elements.canvas.height = CONFIG.canvas.height;

    loadBackgroundImage();
    loadCustomFont();
    loadParticipantsList();
    attachEventListeners();
}

// ========================================
// AUTO-REGISTER + SILENT SAVE
// ========================================

/**
 * Silently register a new name, assign the next serial,
 * and save it to localStorage so you can retrieve it later.
 * @param {string} rawName
 * @returns {Object} participant
 */
function autoRegisterParticipant(rawName) {
    const name = capitalizeWords(rawName.trim());
    const nameLower = name.toLowerCase();

    const existing = participantsData.find(p => p.nameLower === nameLower);
    if (existing) return existing;

    const nextSerial = String(participantsData.length + 1).padStart(3, '0');

    const newParticipant = {
        serialNo: nextSerial,
        name: name,
        nameLower: nameLower,
        isNew: true
    };

    participantsData.push(newParticipant);
    participantsList.push(nameLower);

    // Silently persist to localStorage
    saveToLocalStorage(newParticipant);

    console.log(`Auto-registered: ${name} → AIS-2026-${nextSerial}`);
    return newParticipant;
}

/**
 * Save a new participant to localStorage silently.
 * To retrieve all saved names, open DevTools → Console and run:
 *   JSON.parse(localStorage.getItem('ais_new_participants'))
 */
function saveToLocalStorage(participant) {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const alreadyExists = saved.some(p => p.nameLower === participant.nameLower);
        if (!alreadyExists) {
            saved.push({
                name: participant.name,
                nameLower: participant.nameLower,
                serialNo: participant.serialNo,
                addedAt: new Date().toISOString()
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        }
    } catch (e) {
        console.warn('localStorage save failed:', e);
    }
}

// ========================================
// CSV LOADING
// ========================================

/**
 * Load participants from CSV, then merge any locally saved
 * new names on top so they persist across sessions.
 */
function loadParticipantsList() {
    console.log('Loading CSV from:', CSV_CONFIG.fileName);
    Papa.parse(CSV_CONFIG.fileName, {
        download: true,
        header: false,
        skipEmptyLines: true,
        complete: function(results) {
            console.log('CSV loaded, rows:', results.data ? results.data.length : 0);
            if (results.data && results.data.length > 1) {
                participantsData = results.data
                    .slice(1)
                    .map((row, index) => ({
                        serialNo: String(index + 1).padStart(3, '0'),
                        name: row[CSV_CONFIG.nameColumnIndex]?.trim() || '',
                        nameLower: row[CSV_CONFIG.nameColumnIndex]?.trim().toLowerCase() || '',
                        isNew: false
                    }))
                    .filter(p => p.name);

                participantsList = participantsData.map(p => p.nameLower);
                console.log(`Loaded ${participantsList.length} participants from CSV`);
            } else {
                console.warn('CSV file is empty or has no data rows');
            }

            // Merge previously saved names from localStorage
            mergeSavedParticipants();
        },
        error: function(error) {
            console.error('Error loading participants CSV:', error);
            // Still try to load any locally saved names
            mergeSavedParticipants();
        }
    });
}

/**
 * Pull any names saved in localStorage and add them to
 * the in-memory list if they aren't already there.
 * This means new names persist across page refreshes.
 */
function mergeSavedParticipants() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (saved.length === 0) return;

        saved.forEach(p => {
            const alreadyIn = participantsData.some(e => e.nameLower === p.nameLower);
            if (!alreadyIn) {
                const nextSerial = String(participantsData.length + 1).padStart(3, '0');
                participantsData.push({
                    serialNo: nextSerial,
                    name: p.name,
                    nameLower: p.nameLower,
                    isNew: true
                });
                participantsList.push(p.nameLower);
            }
        });

        console.log(`Merged ${saved.length} locally saved participant(s)`);
    } catch (e) {
        console.warn('Could not merge localStorage participants:', e);
    }
}

// ========================================
// BACKGROUND IMAGE
// ========================================

function loadBackgroundImage() {
    backgroundImage.onload = function() {
        backgroundImageLoaded = true;
        console.log('Background image loaded successfully');
    };
    backgroundImage.onerror = function() {
        backgroundImageLoaded = false;
        console.warn('Background image not found. Using fallback design.');
    };
    backgroundImage.src = CONFIG.backgroundImage;
}

// ========================================
// EVENT LISTENERS
// ========================================

function attachEventListeners() {
    elements.form.addEventListener('submit', handleFormSubmit);
    elements.downloadPdfBtn.addEventListener('click', handleDownloadPdf);
    elements.printBtn.addEventListener('click', handlePrint);

    const inputs = elements.form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => clearFieldError(input));
    });

    elements.participantName.addEventListener('input', debounce(validateParticipantName, 500));
    setupAutocomplete();
}

// ========================================
// AUTOCOMPLETE
// ========================================

let highlightedIndex = -1;

function setupAutocomplete() {
    const input = elements.participantName;
    const dropdown = document.getElementById('suggestionsDropdown');
    if (!input || !dropdown) return;

    input.addEventListener('input', function() {
        const query = this.value.trim();
        if (query.length >= 2) showSuggestions(query, dropdown);
        else hideSuggestions(dropdown);
    });

    input.addEventListener('keydown', function(e) {
        const items = dropdown.querySelectorAll('.suggestion-item');
        if (!dropdown.classList.contains('active') || items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
            updateHighlight(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightedIndex = Math.max(highlightedIndex - 1, 0);
            updateHighlight(items);
        } else if (e.key === 'Enter' && highlightedIndex >= 0) {
            e.preventDefault();
            selectSuggestion(items[highlightedIndex].dataset.name);
            hideSuggestions(dropdown);
        } else if (e.key === 'Escape') {
            hideSuggestions(dropdown);
        }
    });

    input.addEventListener('blur', function() {
        setTimeout(() => hideSuggestions(dropdown), 200);
    });

    input.addEventListener('focus', function() {
        const query = this.value.trim();
        if (query.length >= 2) showSuggestions(query, dropdown);
    });
}

function showSuggestions(query, dropdown) {
    const queryLower = query.toLowerCase();
    const matches = participantsList
        .filter(name => name.includes(queryLower))
        .slice(0, 8)
        .map(name => capitalizeWords(name));

    highlightedIndex = -1;

    if (matches.length === 0) {
        dropdown.innerHTML = '<div class="no-suggestions">No match — will be registered on generate</div>';
    } else {
        dropdown.innerHTML = matches.map((name, index) => {
            const highlighted = highlightMatch(name, query);
            return `<div class="suggestion-item" data-name="${name}" data-index="${index}">${highlighted}</div>`;
        }).join('');

        dropdown.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('mousedown', function(e) {
                e.preventDefault();
                selectSuggestion(this.dataset.name);
                hideSuggestions(dropdown);
            });
            item.addEventListener('mouseenter', function() {
                highlightedIndex = parseInt(this.dataset.index);
                updateHighlight(dropdown.querySelectorAll('.suggestion-item'));
            });
        });
    }

    dropdown.classList.add('active');
}

function highlightMatch(text, query) {
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<span class="match">$1</span>');
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function capitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

function updateHighlight(items) {
    items.forEach((item, index) => {
        item.classList.toggle('highlighted', index === highlightedIndex);
    });
}

function selectSuggestion(name) {
    elements.participantName.value = name;
    validateParticipantName();
}

function hideSuggestions(dropdown) {
    dropdown.classList.remove('active');
    dropdown.innerHTML = '';
    highlightedIndex = -1;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ========================================
// VALIDATION
// ========================================

function validateParticipantName() {
    const name = elements.participantName.value.trim();
    const validationStatus = document.getElementById('validationStatus');

    if (!validationStatus) return;

    if (name.length < 3) {
        validationStatus.textContent = '';
        validationStatus.className = 'validation-status';
        hideParticipantInfo();
        return;
    }

    if (participantsData.length === 0) {
        validationStatus.textContent = '⏳ Loading participant list...';
        validationStatus.className = 'validation-status loading';
        return;
    }

    const participantData = findParticipant(name);

    if (participantData) {
        validationStatus.textContent = '✓ Registered participant';
        validationStatus.className = 'validation-status valid';
        elements.participantName.classList.remove('error');
        const errEl = document.getElementById('participantNameError');
        if (errEl) errEl.textContent = '';
        showParticipantInfo(participantData);
    } else {
        validationStatus.textContent = '✦ New name — will be registered automatically on generate';
        validationStatus.className = 'validation-status valid';
        elements.participantName.classList.remove('error');
        const errEl = document.getElementById('participantNameError');
        if (errEl) errEl.textContent = '';
        hideParticipantInfo();
    }
}

function findParticipant(name) {
    const normalizedName = name.trim().toLowerCase();
    return participantsData.find(p =>
        p.nameLower === normalizedName ||
        p.nameLower.includes(normalizedName) ||
        normalizedName.includes(p.nameLower)
    );
}

function showParticipantInfo(participant) {
    if (elements.participantInfo) {
        elements.participantInfo.style.display = 'block';
        if (elements.serialNoDisplay) {
            elements.serialNoDisplay.textContent = `AIS-2026-${participant.serialNo}`;
        }
        currentParticipantSerial = participant.serialNo;
    }
}

function hideParticipantInfo() {
    if (elements.participantInfo) elements.participantInfo.style.display = 'none';
    currentParticipantSerial = null;
}

function validateField(field) {
    const fieldName = field.name;
    const value = field.value.trim();
    const errorElement = document.getElementById(`${fieldName}Error`);
    let isValid = true;
    let errorMessage = '';

    if (field.required && !value) {
        isValid = false;
        errorMessage = `${getFieldLabel(fieldName)} is required`;
    }

    if (!isValid) {
        field.classList.add('error');
        if (errorElement) errorElement.textContent = errorMessage;
        field.parentElement.classList.add('shake');
        setTimeout(() => field.parentElement.classList.remove('shake'), 300);
    } else {
        field.classList.remove('error');
        if (errorElement) errorElement.textContent = '';
    }

    return isValid;
}

function clearFieldError(field) {
    field.classList.remove('error');
    const errorElement = document.getElementById(`${field.name}Error`);
    if (errorElement) errorElement.textContent = '';
}

function getFieldLabel(fieldName) {
    const labels = { participantName: 'Your Name' };
    return labels[fieldName] || fieldName;
}

function validateForm() {
    const requiredFields = elements.form.querySelectorAll('[required]');
    let allValid = true;
    requiredFields.forEach(field => { if (!validateField(field)) allValid = false; });
    return allValid;
}

// ========================================
// CERTIFICATE ID GENERATION
// ========================================

function generateCertificateId(serialNo) {
    const year = new Date().getFullYear();
    return `AIS-${year}-${serialNo}`;
}

// ========================================
// FORM HANDLING
// ========================================

function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateForm()) return;

    const rawName = elements.participantName.value.trim();
    if (!rawName) return;

    // Find or silently auto-register
    let participantData = findParticipant(rawName);
    if (!participantData) {
        participantData = autoRegisterParticipant(rawName);
    }

    const formData = {
        participantName: capitalizeWords(participantData.name),
        eventName: EVENT_CONFIG.eventName,
        eventDate: EVENT_CONFIG.eventDate,
        certificateId: generateCertificateId(participantData.serialNo)
    };

    showParticipantInfo(participantData);

    const validationStatus = document.getElementById('validationStatus');
    if (validationStatus) {
        validationStatus.textContent = `✓ Certificate generated for ${participantData.name}`;
        validationStatus.className = 'validation-status valid';
    }

    generateCertificate(formData);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// ========================================
// CANVAS RENDERING
// ========================================

function generateCertificate(data) {
    ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

    if (backgroundImageLoaded) {
        ctx.drawImage(backgroundImage, 0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
        renderDynamicText(data);
    } else {
        drawFallbackBackground();
        renderCertificateText(data);
    }

    certificateGenerated = true;
    enableActionButtons();
    hidePlaceholder();
}

function renderDynamicText(data) {
    drawText(
        data.participantName,
        CONFIG.textPositions.participantName,
        CONFIG.fonts.participantName,
        'center'
    );

    drawText(
        `Serial No: ${data.certificateId}`,
        CONFIG.textPositions.serialNumber,
        CONFIG.fonts.serialNumber,
        'right'
    );
}

function drawFallbackBackground() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

    const borderWidth = 40;
    const innerBorderWidth = 20;
    const margin = 80;

    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(margin, margin, CONFIG.canvas.width - margin * 2, CONFIG.canvas.height - margin * 2);

    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = innerBorderWidth;
    ctx.strokeRect(margin + 50, margin + 50, CONFIG.canvas.width - (margin + 50) * 2, CONFIG.canvas.height - (margin + 50) * 2);

    drawCornerDecorations();
    drawWatermark();
}

function drawCornerDecorations() {
    const corners = [
        { x: 150, y: 150 },
        { x: CONFIG.canvas.width - 150, y: 150 },
        { x: 150, y: CONFIG.canvas.height - 150 },
        { x: CONFIG.canvas.width - 150, y: CONFIG.canvas.height - 150 }
    ];
    ctx.fillStyle = '#c9a227';
    corners.forEach(corner => {
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, 25, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawWatermark() {
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.font = 'bold 300px Georgia, serif';
    ctx.fillStyle = '#1e3a5f';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(CONFIG.canvas.width / 2, CONFIG.canvas.height / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.fillText('AIS', 0, 0);
    ctx.restore();
}

function renderCertificateText(data) {
    drawLogoText('AI Innovation Society', CONFIG.textPositions.leftLogo, 'left');
    drawLogoText('Department of Artificial Intelligence\nShifa Tameer-e-Millat University', CONFIG.textPositions.rightLogo, 'right');

    drawText('CERTIFICATE', CONFIG.textPositions.certificateTitle, CONFIG.fonts.certificateTitle, 'center');
    drawText('OF PARTICIPATION', CONFIG.textPositions.ofParticipation, CONFIG.fonts.ofParticipation, 'center');
    drawText('THIS CERTIFICATE IS AWARDED TO', CONFIG.textPositions.awardedTo, CONFIG.fonts.awardedTo, 'center');
    drawText(data.participantName, CONFIG.textPositions.participantName, CONFIG.fonts.participantName, 'center');
    drawNameUnderline(data.participantName);

    const line1 = `For participating in the event "${data.eventName}" Hosted by AI Innovation Society`;
    const line2 = `of the Department of Artificial Intelligence (STMU), on ${data.eventDate}`;

    drawText(line1, CONFIG.textPositions.eventDetails, CONFIG.fonts.eventDetails, 'center');
    drawText(line2, { x: CONFIG.textPositions.eventDetails.x, y: CONFIG.textPositions.eventDetails.y + 60 }, CONFIG.fonts.eventDetails, 'center');

    drawSignatories();
    drawText(data.certificateId, CONFIG.textPositions.certificateId, CONFIG.fonts.certificateId, 'right');
}

function drawLogoText(text, position, align) {
    ctx.save();
    ctx.font = `${CONFIG.fonts.logoText.weight} ${CONFIG.fonts.logoText.size}px ${CONFIG.fonts.logoText.family}`;
    ctx.fillStyle = CONFIG.fonts.logoText.color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    text.split('\n').forEach((line, index) => {
        ctx.fillText(line, position.x, position.y + (index * 40));
    });
    ctx.restore();
}

function drawSignatories() {
    const positions = [
        CONFIG.textPositions.signatory1,
        CONFIG.textPositions.signatory2,
        CONFIG.textPositions.signatory3
    ];

    CONFIG.signatories.forEach((signatory, index) => {
        const pos = positions[index];
        ctx.save();
        ctx.strokeStyle = '#1e3a5f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pos.x - 150, pos.y - 40);
        ctx.lineTo(pos.x + 150, pos.y - 40);
        ctx.stroke();
        ctx.restore();

        drawText(signatory.name, { x: pos.x, y: pos.y }, CONFIG.fonts.signatoryName, 'center');
        drawText(signatory.designation, { x: pos.x, y: pos.y + 45 }, CONFIG.fonts.signatoryDesignation, 'center');
    });
}

function drawText(text, position, fontConfig, align = 'center') {
    ctx.save();
    ctx.font = `${fontConfig.weight} ${fontConfig.size}px ${fontConfig.family}`;
    ctx.fillStyle = fontConfig.color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, position.x, position.y);
    ctx.restore();
}

function drawNameUnderline(name) {
    ctx.save();
    ctx.font = `${CONFIG.fonts.participantName.weight} ${CONFIG.fonts.participantName.size}px ${CONFIG.fonts.participantName.family}`;
    const textWidth = ctx.measureText(name).width;
    const lineY = CONFIG.textPositions.participantName.y + 70;
    const lineX = CONFIG.textPositions.participantName.x;
    const lineHalfWidth = Math.max(textWidth / 2 + 50, 300);

    const gradient = ctx.createLinearGradient(lineX - lineHalfWidth, lineY, lineX + lineHalfWidth, lineY);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.2, '#c9a227');
    gradient.addColorStop(0.5, '#c9a227');
    gradient.addColorStop(0.8, '#c9a227');
    gradient.addColorStop(1, 'transparent');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(lineX - lineHalfWidth, lineY);
    ctx.lineTo(lineX + lineHalfWidth, lineY);
    ctx.stroke();
    ctx.restore();
}

// ========================================
// UI HELPERS
// ========================================

function enableActionButtons() {
    elements.downloadPdfBtn.disabled = false;
    elements.printBtn.disabled = false;
    elements.canvasWrapper.classList.add('has-certificate');
}

function hidePlaceholder() {
    elements.placeholderMessage.classList.add('hidden');
}

// ========================================
// PDF GENERATION
// ========================================

function handleDownloadPdf() {
    if (!certificateGenerated) {
        alert('Please generate a certificate first.');
        return;
    }
    elements.downloadPdfBtn.classList.add('loading');
    setTimeout(() => {
        try {
            generatePdf();
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            elements.downloadPdfBtn.classList.remove('loading');
        }
    }, 100);
}

function generatePdf() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const imgData = elements.canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
    const participantName = elements.participantName.value.trim().replace(/\s+/g, '_');
    const timestamp = new Date().getTime();
    pdf.save(`Certificate_${participantName}_${timestamp}.pdf`);
}

// ========================================
// PRINT
// ========================================

function handlePrint() {
    if (!certificateGenerated) {
        alert('Please generate a certificate first.');
        return;
    }

    const printWindow = window.open('', '_blank');
    const imgData = elements.canvas.toDataURL('image/png', 1.0);

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Certificate</title>
            <style>
                @page { size: A4 landscape; margin: 0; }
                body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                img { width: 100%; height: auto; max-width: 297mm; max-height: 210mm; }
                @media print {
                    body { width: 297mm; height: 210mm; }
                    img { width: 297mm; height: 210mm; }
                }
            </style>
        </head>
        <body><img src="${imgData}" alt="Certificate"></body>
        </html>
    `);

    printWindow.document.close();
    printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
    };
}

// ========================================
// INITIALIZE
// ========================================

document.addEventListener('DOMContentLoaded', init);