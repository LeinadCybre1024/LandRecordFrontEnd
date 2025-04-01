// DOM Elements
const authContainer = document.getElementById('auth-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const userBtn = document.getElementById('user-btn');
const adminUserBtn = document.getElementById('admin-user-btn')
const userDropdown = document.getElementById('user-dropdown');
const adminUserDropdown = document.getElementById('admin-user-dropdown');
const logoutBtn = document.getElementById('logout-btn');
const propertyForm = document.getElementById('propertyForm');
const successMessage = document.getElementById('successMessage');
const connectWalletBtnLogin = document.getElementById('connect-wallet-btn-login');
const connectWalletBtnRegister = document.getElementById('connect-wallet-btn-register');
const propertiesList = document.getElementById('properties-list');
const registrationWizard = document.getElementById('registration-wizard');
const propertyCards = document.getElementById('property-cards');
const addPropertyBtn = document.getElementById('add-property-btn');
const cancelRegistrationBtn = document.getElementById('cancel-registration');
const nextStep1Btn = document.getElementById('next-step-1');
const prevStep2Btn = document.getElementById('prev-step-2');
const nextStep2Btn = document.getElementById('next-step-2');
const prevStep3Btn = document.getElementById('prev-step-3');
const returnToDashboardBtn = document.getElementById('return-to-dashboard');
const propertyModal = document.getElementById('property-modal');
const closeModalBtn = document.getElementsByClassName('close-modal');
const editPropertyBtn = document.getElementById('edit-property-btn');
const deletePropertyBtn = document.getElementById('delete-property-btn');


//TO-DO  session management
// API Base URL
const API_BASE_URL = 'http://127.0.0.1:5000';

// Current user
let currentUser = null;
let currentWalletAddress = null;

// Event Listeners
loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.style.display = "block";
    registerForm.style.display = "none";
});

registerTab.addEventListener('click', () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    loginForm.style.display = "none";
    registerForm.style.display = "block";
});

loginBtn.addEventListener('click', handleLogin);
registerBtn.addEventListener('click', handleRegister);
userBtn.addEventListener('click', toggleUserDropdown);
logoutBtn.addEventListener('click', handleLogout);
propertyForm.addEventListener('submit', handlePropertyRegistration);
adminUserBtn.addEventListener('click', toggleAdminUserDropdown)


// Wallet connection buttons
if (connectWalletBtnLogin) {
    connectWalletBtnLogin.addEventListener('click', () => connectWallet('login-wallet'));
}
if (connectWalletBtnRegister) {
    connectWalletBtnRegister.addEventListener('click', () => connectWallet('register-wallet'));
}

// Close all modals when clicking close buttons
document.querySelectorAll('.close-modal').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
        // Find the closest parent modal and hide it
        const modal = this.closest('.modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    });
});

// Close modal when clicking outside modal content
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
        e.target.style.display = 'none';
    }
});

document.getElementById('cancel-add-user').addEventListener('click', () => {
    addUserModal.style.display = "block";
});

// Functions
async function connectWallet(inputFieldId) {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            currentWalletAddress = accounts[0];
            
            // Update the appropriate input field
            document.getElementById(inputFieldId).value = currentWalletAddress;
            
            // Also update the wallet address display in dashboard if we're already connected
            if (document.getElementById('wallet-address-display')) {
                document.getElementById('wallet-address-display').textContent = 
                    currentWalletAddress.substring(0, 6) + '...' + currentWalletAddress.substring(38);
            }
            
            return currentWalletAddress;
        } catch (error) {
            console.error("Error connecting to MetaMask:", error);
            alert("Failed to connect wallet. Please try again.");
            return null;
        }
    } else {
        alert("MetaMask is not installed. Please install it to use this application.");
        return null;
    }
}

async function handleLogin() {
    const walletAddress = document.getElementById('login-wallet').value;
    const password = document.getElementById('login-password').value;
    
    // Simple validation
    if (!walletAddress) {
        showError('login-wallet-error', 'Wallet address is required');
        return;
    }
    
    if (!password) {
        showError('login-password-error', 'Password is required');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                walletAddress,
                password
            })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            currentWalletAddress = walletAddress;
            showDashboard(currentUser);
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Error during login. Please try again.');
    }
}

async function handleRegister() {
    const name = document.getElementById('register-name').value;
    const walletAddress = document.getElementById('register-wallet').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    
    // Validation
    if (!name) {
        showError('register-name-error', 'Full name is required');
        return;
    }
    
    if (!walletAddress) {
        showError('register-wallet-error', 'Wallet address is required');
        return;
    }
    
    if (!password) {
        showError('register-password-error', 'Password is required');
        return;
    }
    
    if (password.length < 6) {
        showError('register-password-error', 'Password must be at least 6 characters');
        return;
    }
    
    if (password !== confirm) {
        showError('register-confirm-error', 'Passwords do not match');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                walletAddress,
                password
            })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            currentWalletAddress = walletAddress;
            showDashboard(currentUser);
            alert('Account created successfully!');
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Error during registration. Please try again.');
    }
}

function showDashboard(user) {
    // Update user info
    document.getElementById('username').textContent = user.name;
    document.getElementById('user-avatar').textContent = user.name.split(' ').map(n => n[0]).join('');
    
    // Pre-fill user details in property form
    document.getElementById('fullName').value = user.name;
    document.getElementById('walletAddress').value = user.walletAddress;
    
    // Update wallet address display
    if (document.getElementById('wallet-address-display')) {
        document.getElementById('wallet-address-display').textContent = 
            user.walletAddress.substring(0, 6) + '...' + user.walletAddress.substring(38);
    }
    
    // Switch to dashboard view
    authContainer.style.display = 'none';
    dashboardContainer.style.display = 'block';
}

 // Close all modals when clicking close button or outside
 document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
       document.querySelectorAll('.modal').forEach(modal => {
          modal.classList.add('hidden');
       });
    });
});

// Close modal when clicking outside
document.addEventListener('click', (e) => {
if (e.target.classList.contains('modal')) {
    e.target.classList.add('hidden');
}
});

function toggleUserDropdown() {
    userDropdown.classList.toggle('show');
}

function toggleAdminUserDropdown() {
    adminUserDropdown.classList.toggle('show');
}

async function handleLogout() {
    try {
       
        
        currentUser = null;
        currentWalletAddress = null;
        dashboardContainer.style.display = 'none';
        authContainer.style.display = 'flex';
        
        // Reset forms
        //TO-DO check why not one classname for form reset
        
        document.getElementById('login-wallet').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('register-name').value = '';
        document.getElementById('register-wallet').value = '';
        document.getElementById('register-password').value = '';
        document.getElementById('register-confirm').value = '';
        
        registerForm.style.display = "none"

        document.clas
        // Show login tab
        loginTab.click();

        await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
}

async function handlePropertyRegistration(e) {
    e.preventDefault();
    
    // Get form values
    const fullName = document.getElementById('fullName').value;
    const walletAddress = document.getElementById('walletAddress').value;
    const phone = document.getElementById('phone').value;
    const propertyType = document.getElementById('propertyType').value;
    const address = document.getElementById('address').value;
    const plotNumber = document.getElementById('plotNumber').value;
    const proofOfOwnership = document.getElementById('proofOfOwnership').files[0];
    const idDocument = document.getElementById('idDocument').files[0];
    const passportPhoto = document.getElementById('passportPhoto').files[0];
    
    // Validate form
    let isValid = true;
    
    if (!fullName) {
        showError('fullName-error', 'Full name is required');
        isValid = false;
    }
    
    if (!walletAddress) {
        showError('walletAddress-error', 'Wallet address is required');
        isValid = false;
    }
    
    if (!phone) {
        showError('phone-error', 'Phone number is required');
        isValid = false;
    }
    
    if (!propertyType) {
        showError('propertyType-error', 'Please select a property type');
        isValid = false;
    }
    
    if (!address) {
        showError('address-error', 'Address is required');
        isValid = false;
    }
    
    if (!plotNumber) {
        showError('plotNumber-error', 'Plot number is required');
        isValid = false;
    }
    
    if (!proofOfOwnership) {
        showError('proofOfOwnership-error', 'Proof of ownership is required');
        isValid = false;
    }
    
    if (!idDocument) {
        showError('idDocument-error', 'ID document is required');
        isValid = false;
    }
    
    if (!passportPhoto) {
        showError('passportPhoto-error', 'Passport photo is required');
        isValid = false;
    }
    
    if (!isValid) return;
    
    try {
        const formData = new FormData();
        formData.append('owner', walletAddress);
        formData.append('propertyId', plotNumber);
        formData.append('propertyDocs', proofOfOwnership);
        // Add other files and form data as needed
        
        const response = await fetch(`${API_BASE_URL}/uploadPropertyDocs`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            propertyForm.style.display = 'none';
            successMessage.style.display = 'block';
        } else {
            alert(data.message || 'Property registration failed');
        }
    } catch (error) {
        console.error('Property registration error:', error);
        alert('Error during property registration. Please try again.');
    }
}

function showError(id, message) {
    const errorElement = document.getElementById(id);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Initialize contracts when the page loads
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    loadTransferOwnershipContract();
    loadPropertyContract();
    loadLandRegistryContract();
});

// Contract loading functions
async function loadUsersContract() {
    await loadContract("Users");
}

async function loadTransferOwnershipContract() {
    await loadContract("TransferOwnership");
}

async function loadPropertyContract() {
    await loadContract("Property");
}

async function loadLandRegistryContract() {
    await loadContract("LandRegistry");
}

async function loadContract(contractName) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/${contractName}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} for ${contractName}`);
        }
        const contractData = await response.json();

        const contractABI = contractData.abi;
        const networkId = Object.keys(contractData.networks)[0]; // Get first available network
        const contractAddress = contractData.networks[networkId]?.address || "UNKNOWN_ADDRESS";

        console.log(`${contractName} ABI:`, contractABI);
        console.log(`${contractName} Address:`, contractAddress);

        // Store in localStorage for later use
        localStorage.setItem(`${contractName}_ContractABI`, JSON.stringify(contractABI));
        localStorage.setItem(`${contractName}_ContractAddress`, contractAddress);
    } catch (error) {
        console.error(`Error loading ${contractName} contract:`, error);
    }
}

// Kenyan Counties
const kenyanCounties = [
    "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita-Taveta", "Garissa", 
    "Wajir", "Mandera", "Marsabit", "Isiolo", "Meru", "Tharaka-Nithi", "Embu", 
    "Kitui", "Machakos", "Makueni", "Nyandarua", "Nyeri", "Kirinyaga", "Murang'a", 
    "Kiambu", "Turkana", "West Pokot", "Samburu", "Trans Nzoia", "Uasin Gishu", 
    "Elgeyo-Marakwet", "Nandi", "Baringo", "Laikipia", "Nakuru", "Narok", "Kajiado", 
    "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia", "Siaya", "Kisumu", 
    "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi"
];

// Properties
let properties = [];
let userProperties = [];
let currentProperty = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize county dropdown
    const countySelect = document.getElementById('county');
    kenyanCounties.forEach(county => {
        const option = document.createElement('option');
        option.value = county;
        option.textContent = county;
        countySelect.appendChild(option);
    });

    // Event listeners
    addPropertyBtn.addEventListener('click', showPropertyWizard);
    cancelRegistrationBtn.addEventListener('click', hidePropertyWizard);
    returnToDashboardBtn.addEventListener('click', hidePropertyWizard);
    nextStep1Btn.addEventListener('click', validateStep1);
    prevStep2Btn.addEventListener('click', () => navigateStep(1));
    nextStep2Btn.addEventListener('click', validateStep2);
    prevStep3Btn.addEventListener('click', () => navigateStep(2));
    
    editPropertyBtn.addEventListener('click', editProperty);
    deletePropertyBtn.addEventListener('click', deleteProperty);

    // File input change handlers
    document.getElementById('deedDocument').addEventListener('change', handleFileUpload);
    document.getElementById('idDocument').addEventListener('change', handleFileUpload);
    document.getElementById('surveyPlan').addEventListener('change', handleFileUpload);
    document.getElementById('passportPhoto').addEventListener('change', handleFileUpload);

   
    // Initialize contracts
   loadContracts();
});



async function loadContracts(){
    loadUserProperties()
    loadLandRegistryContract()
    loadTransferOwnershipContract()
    loadPropertyContract()
}

async function checkSession() {
    try {
        const response = await fetch(`${API_BASE_URL}/check-session`, {
            credentials: 'include'  // Important for cookies
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.authenticated && data.user) {
                currentUser = data.user;
                currentWalletAddress = data.user.walletAddress;
                
                // Show appropriate dashboard based on user role
                if (data.user.role === USER_ROLES.ADMIN) {
                    showAdminDashboard(data.user);
                } else {
                    showDashboard(data.user);
                }
                
                // Load user properties if on regular dashboard
                if (data.user.role !== USER_ROLES.ADMIN) {
                    loadUserProperties();
                }
            }
        }
    } catch (error) {
        console.error('Session check failed:', error);
    }
}

// Show property registration wizard
function showPropertyWizard() {
    propertiesList.style.display = "none";
    registrationWizard.style.display = "block";
    propertyForm.style.display = "block";
    successMessage.style.display = "none";
    navigateStep(1);
}

// Hide property registration wizard
function hidePropertyWizard() {
    propertiesList.style.display = "none";
    registrationWizard.style.display = "block";
    document.getElementById('successMessage').style.display = "block";
    document.getElementById('propertyForm').style.display = 'block';
}

// Navigate between wizard steps
function navigateStep(step) {
    // Hide all steps
    document.querySelectorAll('.wizard-step').forEach(el => {
        el.style.display = "none";
        el.classList.remove('active');
    });

    // Show the selected step
    const stepElement = document.querySelector(`.wizard-step[data-step="${step}"]`);
    stepElement.style.display = "block";
    stepElement.classList.add('active');

    // Update step indicators
    document.querySelectorAll('.wizard-steps .step').forEach(el => {
        el.classList.remove('active');
        if (parseInt(el.dataset.step) <= step) {
            el.classList.add('active');
        }
    });

    // If we're on the review step, update the review content
    if (step === 3) {
        updateReviewContent();
    }
}

// Validate step 1 inputs
function validateStep1() {
    let isValid = true;

    const requiredFields = [
        'propertyTitle', 'streetAddress', 'postalCode', 'county', 'plotNumber'
    ];

    requiredFields.forEach(field => {
        const value = document.getElementById(field).value.trim();
        if (!value) {
            showError(`${field}-error`, 'This field is required');
            isValid = false;
        } else {
            hideError(`${field}-error`);
        }
    });

    if (isValid) {
        navigateStep(2);
    }
}

// Validate step 2 file uploads
function validateStep2() {
    let isValid = true;

    const requiredFiles = [
        'deedDocument', 'idDocument', 'passportPhoto'
    ];

    requiredFiles.forEach(fileId => {
        const fileInput = document.getElementById(fileId);
        if (!fileInput.files || fileInput.files.length === 0) {
            showError(`${fileId}-error`, 'This file is required');
            isValid = false;
        } else if (fileInput.files[0].size > 5 * 1024 * 1024) {
            showError(`${fileId}-error`, 'File size exceeds 5MB limit');
            isValid = false;
        } else {
            hideError(`${fileId}-error`);
        }
    });

    if (isValid) {
        navigateStep(3);
    }
}

// Update review content before showing step 3
function updateReviewContent() {
    // Property details
    document.getElementById('review-propertyTitle').textContent = 
        document.getElementById('propertyTitle').value;
    document.getElementById('review-streetAddress').textContent = 
        document.getElementById('streetAddress').value;
    document.getElementById('review-postalCode').textContent = 
        document.getElementById('postalCode').value;
    document.getElementById('review-county').textContent = 
        document.getElementById('county').value;
    document.getElementById('review-plotNumber').textContent = 
        document.getElementById('plotNumber').value;

    // Document names
    //document.getElementById('review-deedDocument').textContent = 
    //    document.getElementById('deedDocument').files[0]?.file || 'Not uploaded';
    const deedFile = document.getElementById('deedDocument').files[0]
   console.log(deedFile)
    const deedPlaceholder = document.getElementById('deedPlaceholder')
    //deedPlaceholder.innerHTML = "<img src="+deedFile+" />"
    document.getElementById('review-idDocument').textContent = 
        document.getElementById('idDocument').files[0]?.name || 'Not uploaded';
    document.getElementById('review-surveyPlan').textContent = 
        document.getElementById('surveyPlan').files[0]?.name || 'Not uploaded';
    document.getElementById('review-passportPhoto').textContent = 
        document.getElementById('passportPhoto').files[0]?.name || 'Not uploaded';
}

// Handle file uploads and show file info
function handleFileUpload(e) {
    const fileInput = e.target;
    const fileInfoElement = document.getElementById(`${fileInput.id}-info`);
    
    if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        
        if (file.size > 5 * 1024 * 1024) {
            showError(`${fileInput.id}-error`, 'File size exceeds 5MB limit');
            fileInfoElement.textContent = '';
        } else {
            hideError(`${fileInput.id}-error`);
            fileInfoElement.textContent = `${file.name} (${fileSizeMB} MB)`;
        }
    } else {
        fileInfoElement.textContent = '';
    }
}

// Show property details in modal
function showPropertyDetails(property) {
    currentProperty = property;
    
    document.getElementById('modal-property-title').textContent = property.title;
    document.getElementById('modal-plot-number').textContent = property.plotNumber;
    document.getElementById('modal-address').textContent = property.streetAddress;
    document.getElementById('modal-county').textContent = property.county;
    document.getElementById('modal-postal-code').textContent = property.postalCode;
    
    const statusElement = document.getElementById('modal-status');
    statusElement.textContent = property.status;
    statusElement.className = 'status-badge';
    
    if (property.status === 'verified') {
        statusElement.classList.add('status-verified');
    } else if (property.status === 'rejected') {
        statusElement.classList.add('status-rejected');
    } else {
        statusElement.classList.add('status-pending');
    }
    
    propertyModal.style.display = "none";
}

// Edit property
function editProperty() {
    propertyModal.style.display = "block";
    showPropertyWizard();
    
    // Pre-fill form with property data
    document.getElementById('propertyTitle').value = currentProperty.title;
    document.getElementById('streetAddress').value = currentProperty.streetAddress;
    document.getElementById('postalCode').value = currentProperty.postalCode;
    document.getElementById('county').value = currentProperty.county;
    document.getElementById('plotNumber').value = currentProperty.plotNumber;
    
    // TODO: Handle document pre-filling if needed
}

// Delete property
function deleteProperty() {
    if (confirm('Are you sure you want to delete this property?')) {
        // Call API to delete property
        fetch(`${API_BASE_URL}/properties/${currentProperty.id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                propertyModal.style.display = "block";
                loadUserProperties();
            } else {
                alert('Failed to delete property: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error deleting property:', error);
            alert('Error deleting property. Please try again.');
        });
    }
}

// Load user properties from API
function loadUserProperties() {
    if (!currentWalletAddress) return;

    fetch(`${API_BASE_URL}/properties?owner=${currentWalletAddress}`)
        .then(response => response.json())
        .then(data => {
            userProperties = data.properties || [];
            renderProperties();
        })
        .catch(error => {
            console.error('Error loading properties:', error);
        });
}

// Render properties in the dashboard
function renderProperties() {
    propertyCards.innerHTML = '';

    if (userProperties.length === 0) {
        propertyCards.innerHTML = `
            <div class="no-properties">
                <p>You haven't registered any properties yet.</p>
                <button class="btn btn-primary" id="add-first-property">
                    <i class="fas fa-plus"></i> Add Your First Property
                </button>
            </div>
        `;
        document.getElementById('add-first-property').addEventListener('click', showPropertyWizard);
        return;
    }

    userProperties.forEach(property => {
        const propertyCard = document.createElement('div');
        propertyCard.className = 'property-card';
        propertyCard.innerHTML = `
            <h3 class="property-title">${property.title}</h3>
            <div class="property-details">
                <div class="property-detail">
                    <span class="detail-label">Plot Number:</span>
                    <span>${property.plotNumber}</span>
                </div>
                <div class="property-detail">
                    <span class="detail-label">County:</span>
                    <span>${property.county}</span>
                </div>
                <div class="property-detail">
                    <span class="detail-label">Status:</span>
                    <span class="property-status ${getStatusClass(property.status)}">
                        ${property.status}
                    </span>
                </div>
            </div>
        `;
        propertyCard.addEventListener('click', () => showPropertyDetails(property));
        propertyCards.appendChild(propertyCard);
    });
}

// Get CSS class for status
function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'verified': return 'status-verified';
        case 'rejected': return 'status-rejected';
        default: return 'status-pending';
    }
}

// Handle property form submission
async function handlePropertyRegistration(e) {
    e.preventDefault();
    //alert(currentWalletAddress)
    
    const formData = new FormData();
    const propertyData = {
        title: document.getElementById('propertyTitle').value,
        streetAddress: document.getElementById('streetAddress').value,
        postalCode: document.getElementById('postalCode').value,
        county: document.getElementById('county').value,
        plotNumber: document.getElementById('plotNumber').value,
        owner: currentWalletAddress
    };

    formData.append('property', JSON.stringify(propertyData));
    formData.append('deedDocument', document.getElementById('deedDocument').files[0]);
    formData.append('idDocument', document.getElementById('idDocument').files[0]);
    formData.append('passportPhoto', document.getElementById('passportPhoto').files[0]);
    
    if (document.getElementById('surveyPlan').files[0]) {
        formData.append('surveyPlan', document.getElementById('surveyPlan').files[0]);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/properties`, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            // Show success message
            document.getElementById('propertyForm').style.display = 'none';
            document.getElementById('successMessage').style.display = "none";
            
            // Update properties list
            loadUserProperties();
        } else {
            alert(data.message || 'Property registration failed');
        }
    } catch (error) {
        console.error('Property registration error:', error);
        alert('Error during property registration. Please try again.');
    }
}

// ... (keep existing functions like connectWallet, handleLogin, handleRegister, etc.) ...

// Update showDashboard to load properties
function showDashboard(user) {
    // Update user info
    document.getElementById('username').textContent = user.name;
    document.getElementById('user-avatar').textContent = user.name.split(' ').map(n => n[0]).join('');
    
    // Update wallet address display
    if (document.getElementById('wallet-address-display')) {
        document.getElementById('wallet-address-display').textContent = 
            user.walletAddress.substring(0, 6) + '...' + user.walletAddress.substring(38);
    }
    
    // Switch to dashboard view
    authContainer.style.display = 'none';
    dashboardContainer.style.display = 'block';
    
    // Load user properties
    loadUserProperties();
}

// Helper functions
function showError(id, message) {
    const errorElement = document.getElementById(id);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideError(id) {
    const errorElement = document.getElementById(id);
   // errorElement.style.display = 'none';
}

//--------ADMIN-------//
// Add these constants at the top
const USER_ROLES = {
    ADMIN: '12',
    CLIENT: '34',
    STAFF: '56'
};

// Add admin DOM elements
const adminDashboard = document.getElementById('admin-dashboard');
const adminPropertiesBtn = document.getElementById('admin-properties-btn');
const adminUsersBtn = document.getElementById('admin-users-btn');
const adminPropertiesSection = document.getElementById('admin-properties-section');
const adminUsersSection = document.getElementById('admin-users-section');
const adminPropertiesList = document.getElementById('admin-properties-list');
const adminUsersList = document.getElementById('admin-users-list');
const addUserBtn = document.getElementById('add-user-btn');
const addUserModal = document.getElementById('add-user-modal');
const cancelAddUserBtn = document.getElementById('cancel-add-user');
const addUserForm = document.getElementById('add-user-form');
const verifyPropertyModal = document.getElementById('verify-property-modal');
const approvePropertyBtn = document.getElementById('approve-property-btn');
const rejectPropertyBtn = document.getElementById('reject-property-btn');
const rejectionReasonSection = document.getElementById('rejection-reason');
const cancelRejectBtn = document.getElementById('cancel-reject-btn');
const confirmRejectBtn = document.getElementById('confirm-reject-btn');
const rejectReasonInput = document.getElementById('reject-reason');
const profileModal = document.getElementById('profile-modal');
const changePasswordForm = document.getElementById('change-password-form');
const adminProfileBtn = document.getElementById('admin-profile-btn');
const profileBtn = document.getElementById('profile-btn');
const adminLogoutBtn = document.getElementById('admin-logout-btn');

// Current property being verified
let currentVerificationProperty = null;

// Add these event listeners
adminPropertiesBtn.addEventListener('click', () => {
    adminPropertiesSection.style.display = "block";
    adminUsersSection.style.display = "none";
    loadAdminProperties('pending');
});

adminUsersBtn.addEventListener('click', () => {
    adminPropertiesSection.style.display = "none";
    adminUsersSection.style.display = "block";
    loadAdminUsers('all');
});

addUserBtn.addEventListener('click', () => {
    addUserModal.style.display = "block";
});

cancelAddUserBtn.addEventListener('click', () => {
    addUserModal.style.display = "block";
});

addUserForm.addEventListener('submit', handleAddUser);
approvePropertyBtn.addEventListener('click', approveProperty);
rejectPropertyBtn.addEventListener('click', showRejectionReason);
cancelRejectBtn.addEventListener('click', hideRejectionReason);
confirmRejectBtn.addEventListener('click', rejectProperty);
adminProfileBtn.addEventListener('click', showProfileModal);
profileBtn.addEventListener('click', showProfileModal);
adminLogoutBtn.addEventListener('click', handleAdminLogout);
changePasswordForm.addEventListener('submit', handleChangePassword);

// Status filter buttons
document.querySelectorAll('.status-filter .btn-filter').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.status-filter .btn-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadAdminProperties(btn.dataset.status);
    });
});

// Role filter buttons
document.querySelectorAll('.role-filter .btn-filter').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.role-filter .btn-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadAdminUsers(btn.dataset.role);
    });
});

// Update handleLogin to redirect to admin dashboard
async function handleLogin() {
    const walletAddress = document.getElementById('login-wallet').value;
    const password = document.getElementById('login-password').value;
    
    if (!walletAddress) {
        showError('login-wallet-error', 'Wallet address is required');
        return;
    }
    
    if (!password) {
        showError('login-password-error', 'Password is required');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                walletAddress,
                password
            })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            currentWalletAddress = walletAddress;

            console.log("User Roles : "+data.user.role)
            
            // Check if user is admin
            if (data.user.role === USER_ROLES.ADMIN) {
                showAdminDashboard(data.user);
            } else {
                showDashboard(data.user);
            }
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Error during login. Please try again.');
    }
}

// Admin dashboard functions
function showAdminDashboard(user) {
    document.getElementById('admin-username').textContent = user.name;
    document.getElementById('admin-user-avatar').textContent = 
        user.name.split(' ').map(n => n[0]).join('');
    
    if (document.getElementById('admin-wallet-address-display')) {
        document.getElementById('admin-wallet-address-display').textContent = 
            user.walletAddress.substring(0, 6) + '...' + user.walletAddress.substring(38);
    }
    
    authContainer.style.display = 'none';
    dashboardContainer.style.display = 'none';
    adminDashboard.style.display = "none";
    adminDashboard.style.display = 'block'
    
    loadAdminProperties('pending');
    initAdminDashboard();
}

function loadAdminProperties(status) {
    console.log(`Loading admin properties with status: ${status}`);
    adminPropertiesList.innerHTML = '<div class="loading">Loading properties...</div>';
    
    fetch(`${API_BASE_URL}/admin/properties?status=${status}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Received data:', data);
        if (data.status === 'success') {
            renderAdminProperties(data.properties, status);
        } else {
            adminPropertiesList.innerHTML = `<div class="error">${data.message || 'Error loading properties'}</div>`;
        }
    })
    .catch(error => {
        console.error('Error loading properties:', error);
        adminPropertiesList.innerHTML = `<div class="error">Error loading properties. Please try again.</div>`;
    });
}


function initAdminDashboard() {
    adminPropertiesSection.style.display = "none";
    adminUsersSection.style.display = "block";
    loadAdminProperties('pending');
}

function renderAdminProperties(propertiesList, status) {
    // Update the global properties variable
    properties = propertiesList;
    console.log("Global properties:", properties);

    if (properties.length === 0) {
        adminPropertiesList.innerHTML = `<div class="no-properties">No ${status} properties found</div>`;
        return;
    }

    adminPropertiesList.innerHTML = '';
    
    properties.forEach(property => {
        const propertyCard = document.createElement('div');
        propertyCard.className = 'admin-property-card';
        
        let actions = '';
        if (status === 'pending') {
            actions = `
                <button class="btn btn-sm btn-primary verify-btn" data-id="${property._id}">
                    <i class="fas fa-check-circle"></i> Verify
                </button>
            `;
        } else if (status === 'rejected') {
            actions = `
                <div class="rejection-reason">
                    <strong>Reason:</strong> ${property.rejectionReason || 'Not specified'}
                </div>
            `;
        } else if (status === 'verified') {
            actions = `
                <div class="verification-info">
                    Verified by: ${property.verifiedBy || 'Admin'} on 
                    ${new Date(property.verificationDate).toLocaleDateString()}
                </div>
            `;
        }
        
        propertyCard.innerHTML = `
            <div class="property-header">
                <h3>${property.title}</h3>
                <span class="property-status ${status}">${status}</span>
            </div>
            <div class="property-details">
                <div class="detail-item">
                    <span class="detail-label">Owner:</span>
                    <span>${property.ownerDetails?.name || property.owner}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Plot Number:</span>
                    <span>${property.plotNumber}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">County:</span>
                    <span>${property.county}</span>
                </div>
            </div>
            <div class="property-actions">
                ${actions}
            </div>
        `;
        
        adminPropertiesList.appendChild(propertyCard);
    });
    
    // Add event listeners to verify buttons
    document.querySelectorAll('.verify-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            
            const propertyId = btn.dataset.id;
            console.log("ID : "+propertyId)
            showVerifyPropertyModal(propertyId);
        });
    });
}

function showVerifyPropertyModal(propertyId) {
    console.log(properties)
    const property = properties.find(p => p._id === propertyId);
    if (!property){
         console.log("!property")
         return;
    }
    
    currentVerificationProperty = property;
    console.log("Current")
    
    document.getElementById('verify-modal-title').textContent = `Verify: ${property.title}`;
    document.getElementById('verify-owner').textContent = property.ownerDetails?.name || property.owner;
    document.getElementById('verify-title').textContent = property.title;
    document.getElementById('verify-plot-number').textContent = property.plotNumber;
    
    // Reset rejection UI
    hideRejectionReason();
    rejectReasonInput.value = '';
    
    verifyPropertyModal.style.display = "block"
}

function approveProperty() {
    if (!currentVerificationProperty) return;
    
    fetch(`${API_BASE_URL}/admin/properties/${currentVerificationProperty._id}/verify/${currentWalletAddress}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            action: 'approve'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            verifyPropertyModal.style.display = "none";
            loadAdminProperties('pending');
            showToast('Property approved successfully', 'success');
        } else {
            showToast(data.message || 'Approval failed', 'error');
        }
    })
    .catch(error => {
        console.error('Error approving property:', error);
        showToast('Error approving property', 'error');
    });
}

function showRejectionReason() {
    rejectionReasonSection.style.display = "none";
    approvePropertyBtn.disabled = true;
    rejectPropertyBtn.disabled = true;
}

function hideRejectionReason() {
    rejectionReasonSection.style.display = "block";
    approvePropertyBtn.disabled = false;
    rejectPropertyBtn.disabled = false;
}

function rejectProperty() {
    if (!currentVerificationProperty || !rejectReasonInput.value.trim()) {
        showToast('Please provide a reason for rejection', 'error');
        return;
    }
    
    fetch(`${API_BASE_URL}/admin/properties/${currentVerificationProperty._id}/verify/${currentWalletAddress}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            action: 'reject',
            reason: rejectReasonInput.value.trim()
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            verifyPropertyModal.style.display = "none";
            loadAdminProperties('pending');
            showToast('Property rejected successfully', 'success');
        } else {
            showToast(data.message || 'Rejection failed', 'error');
        }
    })
    .catch(error => {
        console.error('Error rejecting property:', error);
        showToast('Error rejecting property', 'error');
    });
}

function loadAdminUsers(role) {
    adminUsersList.innerHTML = '<div class="loading">Loading users...</div>';
    
    const url = role === 'all' ? 
        `${API_BASE_URL}/admin/users` : 
        `${API_BASE_URL}/admin/users?role=${role}`;
    
    fetch(url, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            renderAdminUsers(data.users);
        } else {
            adminUsersList.innerHTML = `<div class="error">${data.message || 'Error loading users'}</div>`;
        }
    })
    .catch(error => {
        console.error('Error loading users:', error);
        adminUsersList.innerHTML = `<div class="error">Error loading users. Please try again.</div>`;
    });
}

function renderAdminUsers(users) {
    if (users.length === 0) {
        adminUsersList.innerHTML = `<div class="no-users">No users found</div>`;
        return;
    }

    adminUsersList.innerHTML = '';
    
    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'admin-user-card';
        
        let roleBadge = '';
        if (user.userRole === USER_ROLES.ADMIN) {
            roleBadge = '<span class="role-badge admin">Admin</span>';
        } else if (user.userRole === USER_ROLES.STAFF) {
            roleBadge = '<span class="role-badge staff">Staff</span>';
        } else {
            roleBadge = '<span class="role-badge client">Client</span>';
        }
        
        userCard.innerHTML = `
            <div class="user-header">
                <div class="user-avatar-small">${user.name.split(' ').map(n => n[0]).join('')}</div>
                <div class="user-info">
                    <h3>${user.name}</h3>
                    <div class="user-wallet">${user.walletAddress.substring(0, 10)}...${user.walletAddress.substring(34)}</div>
                </div>
                ${roleBadge}
            </div>
            <div class="user-details">
                <div class="detail-item">
                    <span class="detail-label">Registered:</span>
                    <span>${new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span class="status-badge ${user.status || 'active'}">${user.status || 'active'}</span>
                </div>
            </div>
        `;
        
        adminUsersList.appendChild(userCard);
    });
}

function handleAddUser(e) {
    e.preventDefault();
    
    const name = document.getElementById('add-user-name').value.trim();
    const walletAddress = document.getElementById('add-user-wallet').value.trim();
    const password = document.getElementById('add-user-password').value;
    const role = document.getElementById('add-user-role').value;
    
    if (!name || !walletAddress || !password) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            name,
            walletAddress,
            password,
            userRole: role
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            addUserModal.style.display = "block";
            addUserForm.reset();
            loadAdminUsers('all');
            showToast('User created successfully', 'success');
        } else {
            showToast(data.message || 'User creation failed', 'error');
        }
    })
    .catch(error => {
        console.error('Error creating user:', error);
        showToast('Error creating user', 'error');
    });
}

function showProfileModal() {
    
    const user = currentUser;
    if (!user) return;
    
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-wallet').textContent = user.walletAddress;
    
    let roleText = 'Client';
    if (user.role === USER_ROLES.ADMIN) roleText = 'Admin';
    else if (user.role === USER_ROLES.STAFF) roleText = 'Staff';
    
    document.getElementById('profile-role').textContent = roleText;
    document.getElementById('profile-avatar').textContent = 
        user.name.split(' ').map(n => n[0]).join('');
    
    
    profileModal.style.display = "block"
}

function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }
    
    fetch(`${API_BASE_URL}/profile/change-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            currentWalletAddress,
            currentPassword,
            newPassword
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showToast('Password changed successfully', 'success');
            document.getElementById('change-password-form').reset();
            profileModal.style.display = "none";
        } else {
            showToast(data.message || 'Password change failed', 'error');
        }
    })
    .catch(error => {
        console.error('Error changing password:', error);
        showToast('Error changing password', 'error');
    });
}

function handleAdminLogout() {
    handleLogout();
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}
