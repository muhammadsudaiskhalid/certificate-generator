/**
 * AI Innovation Society - Certificate Generator
 * Main JavaScript File
 * 
 * This script handles:
 * - Form validation
 * - Certificate ID auto-generation
 * - Canvas rendering with background image
 * - PDF generation and download
 * - Print functionality
 */

// ========================================
// CONFIGURATION - Canvas and Text Positioning
// ========================================

const CONFIG = {
    // Canvas dimensions (A4 Landscape at ~300 DPI)
    canvas: {
        width: 3508,
        height: 2480
    },
    
    // Text positioning coordinates (x, y) - Adjusted for the actual template
    textPositions: {
        // Participant name - BOLD, ABOVE the decorative line
        participantName: {
            x: 1754,  // Center
            y: 1300   // Moved lower
        },
        // Event details text - BELOW the line
        eventLine1: {
            x: 1754,
            y: 1480   // Moved lower
        },
        eventLine2: {
            x: 1754,
            y: 1570   // Moved lower
        },
        // Serial number - Bottom right corner
        serialNumber: {
            x: 3350,
            y: 2380
        }
    },
    
    // Font configurations
    fonts: {
        participantName: {
            size: 90,
            weight: 'bold',
            family: 'Georgia, serif',
            color: '#1e3a5f'  // Navy Blue - Bold
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
        // Keep these for fallback mode
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
        eventDetails: {
            size: 49,
            weight: 'normal',
            family: 'Arial, sans-serif',
            color: '#000000ff'
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
            color: '#1e3a5f'
        }
    },
    
    // Signatories from JSON template
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
    
    // Background template image (the actual certificate template)
    backgroundImage: 'Participation Certificate.png'
};

// ========================================
// DOM ELEMENTS
// ========================================

const elements = {
    form: document.getElementById('certificateForm'),
    canvas: document.getElementById('certificateCanvas'),
    participantName: document.getElementById('participantName'),
    eventName: document.getElementById('eventName'),
    eventDate: document.getElementById('eventDate'),
    generateBtn: document.getElementById('generateBtn'),
    downloadPdfBtn: document.getElementById('downloadPdfBtn'),
    printBtn: document.getElementById('printBtn'),
    placeholderMessage: document.getElementById('placeholderMessage'),
    canvasWrapper: document.querySelector('.canvas-wrapper')
};

// Canvas 2D context
const ctx = elements.canvas.getContext('2d');

// State management
let certificateGenerated = false;
let backgroundImageLoaded = false;
let backgroundImage = new Image();
let participantsList = []; // List of valid participants from CSV

// CSV Configuration
const CSV_CONFIG = {
    fileName: 'AIS Event Joining Participant.csv',
    nameColumnIndex: 2  // Column C (0-indexed)
};

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initialize the application
 */
function init() {
    // Set canvas dimensions
    elements.canvas.width = CONFIG.canvas.width;
    elements.canvas.height = CONFIG.canvas.height;
    
    // Load background image
    loadBackgroundImage();
    
    // Load participants list from CSV
    loadParticipantsList();
    
    // Attach event listeners
    attachEventListeners();
    
    // Set default date to today
    setDefaultDate();
}

/**
 * Load participants list from CSV file
 */
function loadParticipantsList() {
    Papa.parse(CSV_CONFIG.fileName, {
        download: true,
        header: false,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.data && results.data.length > 1) {
                // Skip header row, extract names from column C (index 2)
                participantsList = results.data
                    .slice(1) // Skip header
                    .map(row => row[CSV_CONFIG.nameColumnIndex]?.trim().toLowerCase())
                    .filter(name => name); // Remove empty names
                console.log(`Loaded ${participantsList.length} participants from CSV`);
            }
        },
        error: function(error) {
            console.error('Error loading participants CSV:', error);
        }
    });
}

/**
 * Load the certificate background image
 */
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

/**
 * Set default date to today
 */
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    elements.eventDate.value = today;
}

/**
 * Attach all event listeners
 */
function attachEventListeners() {
    // Form submission
    elements.form.addEventListener('submit', handleFormSubmit);
    
    // Download PDF button
    elements.downloadPdfBtn.addEventListener('click', handleDownloadPdf);
    
    // Print button
    elements.printBtn.addEventListener('click', handlePrint);
    
    // Real-time validation on input
    const inputs = elements.form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => clearFieldError(input));
    });
    
    // Real-time participant name validation
    elements.participantName.addEventListener('input', debounce(validateParticipantName, 500));
    
    // Autocomplete functionality for participant name
    setupAutocomplete();
}

// ========================================
// AUTOCOMPLETE FUNCTIONALITY
// ========================================

// Track highlighted suggestion index for keyboard navigation
let highlightedIndex = -1;

/**
 * Setup autocomplete for participant name input
 */
function setupAutocomplete() {
    const input = elements.participantName;
    const dropdown = document.getElementById('suggestionsDropdown');
    
    if (!input || !dropdown) return;
    
    // Show suggestions on input
    input.addEventListener('input', function() {
        const query = this.value.trim();
        if (query.length >= 2) {
            showSuggestions(query, dropdown);
        } else {
            hideSuggestions(dropdown);
        }
    });
    
    // Handle keyboard navigation
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
    
    // Hide on focus out (with delay to allow click)
    input.addEventListener('blur', function() {
        setTimeout(() => hideSuggestions(dropdown), 200);
    });
    
    // Show on focus if there's a query
    input.addEventListener('focus', function() {
        const query = this.value.trim();
        if (query.length >= 2) {
            showSuggestions(query, dropdown);
        }
    });
}

/**
 * Show filtered suggestions in dropdown
 */
function showSuggestions(query, dropdown) {
    const queryLower = query.toLowerCase();
    
    // Get original names from CSV (we need to re-parse or store originals)
    // For now, filter from participantsList and capitalize
    const matches = participantsList
        .filter(name => name.includes(queryLower))
        .slice(0, 8) // Limit to 8 suggestions
        .map(name => capitalizeWords(name)); // Capitalize for display
    
    highlightedIndex = -1; // Reset highlight
    
    if (matches.length === 0) {
        dropdown.innerHTML = '<div class="no-suggestions">No matching participants found</div>';
    } else {
        dropdown.innerHTML = matches.map((name, index) => {
            // Highlight the matching part
            const highlightedName = highlightMatch(name, query);
            return `<div class="suggestion-item" data-name="${name}" data-index="${index}">${highlightedName}</div>`;
        }).join('');
        
        // Add click handlers to suggestions
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

/**
 * Highlight matching text in suggestion
 */
function highlightMatch(text, query) {
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<span class="match">$1</span>');
}

/**
 * Escape special regex characters
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Capitalize each word
 */
function capitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Update highlighted suggestion styling
 */
function updateHighlight(items) {
    items.forEach((item, index) => {
        if (index === highlightedIndex) {
            item.classList.add('highlighted');
        } else {
            item.classList.remove('highlighted');
        }
    });
}

/**
 * Select a suggestion and fill the input
 */
function selectSuggestion(name) {
    elements.participantName.value = name;
    // Trigger validation
    validateParticipantName();
}

/**
 * Hide suggestions dropdown
 */
function hideSuggestions(dropdown) {
    dropdown.classList.remove('active');
    dropdown.innerHTML = '';
    highlightedIndex = -1;
}

/**
 * Debounce function to limit validation calls
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Validate participant name in real-time
 */
function validateParticipantName() {
    const name = elements.participantName.value.trim();
    const validationStatus = document.getElementById('validationStatus');
    
    if (!validationStatus) return;
    
    if (name.length < 3) {
        validationStatus.textContent = '';
        validationStatus.className = 'validation-status';
        return;
    }
    
    if (participantsList.length === 0) {
        validationStatus.textContent = '⏳ Loading participant list...';
        validationStatus.className = 'validation-status loading';
        return;
    }
    
    if (isParticipantValid(name)) {
        validationStatus.textContent = '✓ Registered participant';
        validationStatus.className = 'validation-status valid';
        elements.participantName.classList.remove('error');
        document.getElementById('participantNameError').textContent = '';
    } else {
        validationStatus.textContent = '✗ Not registered - Please fill the registration form first';
        validationStatus.className = 'validation-status invalid';
    }
}

// ========================================
// FORM VALIDATION
// ========================================

/**
 * Validate a single form field
 * @param {HTMLElement} field - The form field to validate
 * @returns {boolean} - Whether the field is valid
 */
function validateField(field) {
    const fieldName = field.name;
    const value = field.value.trim();
    const errorElement = document.getElementById(`${fieldName}Error`);
    
    let isValid = true;
    let errorMessage = '';
    
    // Check required fields
    if (field.required && !value) {
        isValid = false;
        errorMessage = `${getFieldLabel(fieldName)} is required`;
    }
    
    // Update UI
    if (!isValid) {
        field.classList.add('error');
        if (errorElement) {
            errorElement.textContent = errorMessage;
        }
        // Add shake animation
        field.parentElement.classList.add('shake');
        setTimeout(() => field.parentElement.classList.remove('shake'), 300);
    } else {
        field.classList.remove('error');
        if (errorElement) {
            errorElement.textContent = '';
        }
    }
    
    return isValid;
}

/**
 * Clear error state from a field
 * @param {HTMLElement} field - The form field
 */
function clearFieldError(field) {
    field.classList.remove('error');
    const errorElement = document.getElementById(`${field.name}Error`);
    if (errorElement) {
        errorElement.textContent = '';
    }
}

/**
 * Get human-readable label for a field
 * @param {string} fieldName - The field name
 * @returns {string} - Human-readable label
 */
function getFieldLabel(fieldName) {
    const labels = {
        participantName: 'Participant Name',
        eventName: 'Event Name',
        eventDate: 'Date'
    };
    return labels[fieldName] || fieldName;
}

/**
 * Validate all form fields
 * @returns {boolean} - Whether all fields are valid
 */
function validateForm() {
    const requiredFields = elements.form.querySelectorAll('[required]');
    let allValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            allValid = false;
        }
    });
    
    return allValid;
}

// ========================================
// CERTIFICATE ID GENERATION
// ========================================

/**
 * Generate a unique certificate serial number
 * Format: AIS/YYYY/MMDD/XXXX
 * @returns {string} - Generated serial number
 */
function generateCertificateId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const randomNum = String(Math.floor(1000 + Math.random() * 9000)); // 4-digit random
    return `AIS/${year}/${month}${day}/${randomNum}`;
}

// ========================================
// FORM HANDLING
// ========================================

/**
 * Handle form submission
 * @param {Event} event - Form submit event
 */
function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Validate participant name against CSV list
    const participantName = elements.participantName.value.trim();
    if (!isParticipantValid(participantName)) {
        showParticipantError('Your name was not found because you haven\'t filled the registration form.');
        return;
    }
    
    // Gather form data - using JSON template
    const formData = {
        participantName: participantName,
        eventName: elements.eventName.value.trim(),
        eventDate: formatDate(elements.eventDate.value),
        certificateId: generateCertificateId()
    };
    
    // Generate certificate
    generateCertificate(formData);
}

/**
 * Check if participant name exists in the CSV list
 * @param {string} name - Participant name to validate
 * @returns {boolean} - Whether the participant is valid
 */
function isParticipantValid(name) {
    if (participantsList.length === 0) {
        console.warn('Participants list not loaded yet');
        return true; // Allow if list not loaded (fallback)
    }
    const normalizedName = name.trim().toLowerCase();
    return participantsList.some(participant => 
        participant === normalizedName || 
        participant.includes(normalizedName) || 
        normalizedName.includes(participant)
    );
}

/**
 * Show error message for invalid participant
 * @param {string} message - Error message to display
 */
function showParticipantError(message) {
    const errorElement = document.getElementById('participantNameError');
    const validationStatus = document.getElementById('validationStatus');
    
    elements.participantName.classList.add('error');
    if (errorElement) {
        errorElement.textContent = message;
    }
    if (validationStatus) {
        validationStatus.textContent = '❌ Not registered';
        validationStatus.className = 'validation-status invalid';
    }
    
    // Shake animation
    elements.participantName.parentElement.classList.add('shake');
    setTimeout(() => elements.participantName.parentElement.classList.remove('shake'), 300);
}

/**
 * Format date to readable string
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} - Formatted date string
 */
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// ========================================
// CANVAS RENDERING
// ========================================

/**
 * Generate the certificate on canvas
 * @param {Object} data - Certificate data
 */
function generateCertificate(data) {
    // Clear canvas
    ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
    
    // Draw background template
    if (backgroundImageLoaded) {
        // Draw the actual certificate template
        ctx.drawImage(backgroundImage, 0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
        // Only render dynamic text (name, event, date) - template has everything else
        renderDynamicText(data);
    } else {
        // Fallback if template not found
        drawFallbackBackground();
        renderCertificateText(data);
    }
    
    // Update UI state
    certificateGenerated = true;
    enableActionButtons();
    hidePlaceholder();
}

/**
 * Render only the dynamic text fields on top of the template
 * @param {Object} data - Certificate data
 */
function renderDynamicText(data) {
    // Participant Name - BOLD, above the existing line in template
    drawText(
        data.participantName,
        CONFIG.textPositions.participantName,
        CONFIG.fonts.participantName,
        'center'
    );
    
    // Event details line 1: For participating in the event "[Event name]"
    const eventLine1 = `For participating in the event "${data.eventName}"`;
    drawText(
        eventLine1,
        CONFIG.textPositions.eventLine1,
        CONFIG.fonts.eventDetails,
        'center'
    );
    
    // Event details line 2: Hosted by AI Innovation Society of the Department of Artificial Intelligence (STMU), on [Date]
    const eventLine2 = `Hosted by AI Innovation Society of the Department of Artificial Intelligence (STMU), on ${data.eventDate}`;
    drawText(
        eventLine2,
        CONFIG.textPositions.eventLine2,
        CONFIG.fonts.eventDetails,
        'center'
    );
    
    // Serial Number - Bottom right corner for professional credibility
    drawText(
        `Serial No: ${data.certificateId}`,
        CONFIG.textPositions.serialNumber,
        CONFIG.fonts.serialNumber,
        'right'
    );
}

/**
 * Draw decorative line below participant name
 */
function drawDecorativeLine() {
    const lineY = CONFIG.textPositions.decorativeLine.y;
    const centerX = CONFIG.canvas.width / 2;
    const lineWidth = 800;
    
    ctx.save();
    
    // Draw gradient line - Gold color
    const gradient = ctx.createLinearGradient(centerX - lineWidth/2, lineY, centerX + lineWidth/2, lineY);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.15, '#c9a227');
    gradient.addColorStop(0.5, '#c9a227');
    gradient.addColorStop(0.85, '#c9a227');
    gradient.addColorStop(1, 'transparent');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX - lineWidth/2, lineY);
    ctx.lineTo(centerX + lineWidth/2, lineY);
    ctx.stroke();
    
    ctx.restore();
}

/**
 * Draw fallback background when image is not available
 */
function drawFallbackBackground() {
    // Main background - White (as per JSON template theme)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
    
    // Decorative border
    const borderWidth = 40;
    const innerBorderWidth = 20;
    const margin = 80;
    
    // Outer border - Navy Blue
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(margin, margin, CONFIG.canvas.width - margin * 2, CONFIG.canvas.height - margin * 2);
    
    // Inner border - Gold
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = innerBorderWidth;
    ctx.strokeRect(margin + 50, margin + 50, CONFIG.canvas.width - (margin + 50) * 2, CONFIG.canvas.height - (margin + 50) * 2);
    
    // Corner decorations
    drawCornerDecorations();
    
    // Subtle watermark pattern
    drawWatermark();
}

/**
 * Draw decorative corner elements
 */
function drawCornerDecorations() {
    const corners = [
        { x: 150, y: 150 },                                    // Top-left
        { x: CONFIG.canvas.width - 150, y: 150 },              // Top-right
        { x: 150, y: CONFIG.canvas.height - 150 },             // Bottom-left
        { x: CONFIG.canvas.width - 150, y: CONFIG.canvas.height - 150 }  // Bottom-right
    ];
    
    ctx.fillStyle = '#c9a227';
    corners.forEach(corner => {
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, 25, 0, Math.PI * 2);
        ctx.fill();
    });
}

/**
 * Draw subtle watermark
 */
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

/**
 * Render all text elements on the certificate
 * @param {Object} data - Certificate data
 */
function renderCertificateText(data) {
    // Draw logos (text placeholders)
    drawLogoText('AI Innovation Society', CONFIG.textPositions.leftLogo, 'left');
    drawLogoText('Department of Artificial Intelligence\nShifa Tameer-e-Millat University', CONFIG.textPositions.rightLogo, 'right');
    
    // CERTIFICATE title (Blue)
    drawText(
        'CERTIFICATE',
        CONFIG.textPositions.certificateTitle,
        CONFIG.fonts.certificateTitle,
        'center'
    );
    
    // OF PARTICIPATION subtitle (Gold)
    drawText(
        'OF PARTICIPATION',
        CONFIG.textPositions.ofParticipation,
        CONFIG.fonts.ofParticipation,
        'center'
    );
    
    // THIS CERTIFICATE IS AWARDED TO
    drawText(
        'THIS CERTIFICATE IS AWARDED TO',
        CONFIG.textPositions.awardedTo,
        CONFIG.fonts.awardedTo,
        'center'
    );
    
    // Participant Name (Gold, Script/Cursive with underline)
    drawText(
        data.participantName,
        CONFIG.textPositions.participantName,
        CONFIG.fonts.participantName,
        'center'
    );
    
    // Draw decorative underline under name
    drawNameUnderline(data.participantName);
    
    // Event Details text
    const eventDetailsText = `For participating in the event "${data.eventName}" Hosted by AI Innovation Society`;
    const eventDetailsText2 = `of the Department of Artificial Intelligence (STMU), on ${data.eventDate}`;
    
    drawText(
        eventDetailsText,
        CONFIG.textPositions.eventDetails,
        CONFIG.fonts.eventDetails,
        'center'
    );
    
    drawText(
        eventDetailsText2,
        { x: CONFIG.textPositions.eventDetails.x, y: CONFIG.textPositions.eventDetails.y + 60 },
        CONFIG.fonts.eventDetails,
        'center'
    );
    
    // Draw Signatories
    drawSignatories();
    
    // Certificate ID
    drawText(
        data.certificateId,
        CONFIG.textPositions.certificateId,
        CONFIG.fonts.certificateId,
        'right'
    );
}

/**
 * Draw logo text placeholder
 * @param {string} text - Logo text
 * @param {Object} position - Position coordinates
 * @param {string} align - Text alignment
 */
function drawLogoText(text, position, align) {
    ctx.save();
    ctx.font = `${CONFIG.fonts.logoText.weight} ${CONFIG.fonts.logoText.size}px ${CONFIG.fonts.logoText.family}`;
    ctx.fillStyle = CONFIG.fonts.logoText.color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    
    const lines = text.split('\n');
    lines.forEach((line, index) => {
        ctx.fillText(line, position.x, position.y + (index * 40));
    });
    ctx.restore();
}

/**
 * Draw all signatories at the bottom
 */
function drawSignatories() {
    const positions = [
        CONFIG.textPositions.signatory1,
        CONFIG.textPositions.signatory2,
        CONFIG.textPositions.signatory3
    ];
    
    CONFIG.signatories.forEach((signatory, index) => {
        const pos = positions[index];
        
        // Draw signature line
        ctx.save();
        ctx.strokeStyle = '#1e3a5f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pos.x - 150, pos.y - 40);
        ctx.lineTo(pos.x + 150, pos.y - 40);
        ctx.stroke();
        ctx.restore();
        
        // Draw name
        drawText(
            signatory.name,
            { x: pos.x, y: pos.y },
            CONFIG.fonts.signatoryName,
            'center'
        );
        
        // Draw designation
        drawText(
            signatory.designation,
            { x: pos.x, y: pos.y + 45 },
            CONFIG.fonts.signatoryDesignation,
            'center'
        );
    });
}

/**
 * Draw text on canvas with specified styling
 * @param {string} text - Text to draw
 * @param {Object} position - {x, y} coordinates
 * @param {Object} fontConfig - Font configuration
 * @param {string} align - Text alignment
 */
function drawText(text, position, fontConfig, align = 'center') {
    ctx.save();
    ctx.font = `${fontConfig.weight} ${fontConfig.size}px ${fontConfig.family}`;
    ctx.fillStyle = fontConfig.color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, position.x, position.y);
    ctx.restore();
}

/**
 * Draw decorative underline beneath participant name
 * @param {string} name - Participant name for width calculation
 */
function drawNameUnderline(name) {
    ctx.save();
    ctx.font = `${CONFIG.fonts.participantName.weight} ${CONFIG.fonts.participantName.size}px ${CONFIG.fonts.participantName.family}`;
    const textWidth = ctx.measureText(name).width;
    
    const lineY = CONFIG.textPositions.participantName.y + 70;
    const lineX = CONFIG.textPositions.participantName.x;
    const lineHalfWidth = Math.max(textWidth / 2 + 50, 300);
    
    // Draw gradient line
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

/**
 * Get role title based on participation role
 * @param {string} role - Participation role
 * @returns {string} - Role title
 */
function getRoleTitle(role) {
    const titles = {
        'Participant': 'Participation',
        'Speaker': 'Excellence',
        'Organizer': 'Leadership'
    };
    return titles[role] || 'Participation';
}

/**
 * Get role description based on participation role
 * @param {string} role - Participation role
 * @returns {string} - Role description
 */
function getRoleDescription(role) {
    const descriptions = {
        'Participant': 'participated in',
        'Speaker': 'delivered an insightful presentation at',
        'Organizer': 'organized and coordinated'
    };
    return descriptions[role] || 'participated in';
}

// ========================================
// UI HELPERS
// ========================================

/**
 * Enable PDF download and print buttons
 */
function enableActionButtons() {
    elements.downloadPdfBtn.disabled = false;
    elements.printBtn.disabled = false;
    elements.canvasWrapper.classList.add('has-certificate');
}

/**
 * Hide the placeholder message
 */
function hidePlaceholder() {
    elements.placeholderMessage.classList.add('hidden');
}

// ========================================
// PDF GENERATION
// ========================================

/**
 * Handle PDF download
 */
function handleDownloadPdf() {
    if (!certificateGenerated) {
        alert('Please generate a certificate first.');
        return;
    }
    
    // Show loading state
    elements.downloadPdfBtn.classList.add('loading');
    
    // Small delay to show loading state
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

/**
 * Generate and download PDF
 */
function generatePdf() {
    // Access jsPDF from the UMD build
    const { jsPDF } = window.jspdf;
    
    // Create new PDF document (A4 Landscape)
    // A4 dimensions: 297mm x 210mm (landscape)
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });
    
    // Get canvas as image data (PNG for quality)
    const imgData = elements.canvas.toDataURL('image/png', 1.0);
    
    // Add image to PDF (full page)
    // A4 Landscape: 297mm x 210mm
    pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
    
    // Generate filename with participant name and timestamp
    const participantName = elements.participantName.value.trim().replace(/\s+/g, '_');
    const timestamp = new Date().getTime();
    const filename = `Certificate_${participantName}_${timestamp}.pdf`;
    
    // Download PDF
    pdf.save(filename);
}

// ========================================
// PRINT FUNCTIONALITY
// ========================================

/**
 * Handle print button click
 */
function handlePrint() {
    if (!certificateGenerated) {
        alert('Please generate a certificate first.');
        return;
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Get canvas image data
    const imgData = elements.canvas.toDataURL('image/png', 1.0);
    
    // Create print document
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Certificate</title>
            <style>
                @page {
                    size: A4 landscape;
                    margin: 0;
                }
                body {
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                }
                img {
                    width: 100%;
                    height: auto;
                    max-width: 297mm;
                    max-height: 210mm;
                }
                @media print {
                    body {
                        width: 297mm;
                        height: 210mm;
                    }
                    img {
                        width: 297mm;
                        height: 210mm;
                    }
                }
            </style>
        </head>
        <body>
            <img src="${imgData}" alt="Certificate">
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Wait for image to load then print
    printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
    };
}

// ========================================
// INITIALIZE APPLICATION
// ========================================

// Run initialization when DOM is ready
document.addEventListener('DOMContentLoaded', init);
