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
const userDropdown = document.getElementById('user-dropdown');
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
const closeModalBtns = document.getElementsByClassName('close-modal');
const editPropertyBtn = document.getElementById('edit-property-btn');
const deletePropertyBtn = document.getElementById('delete-property-btn');
const profileBtn = document.getElementById('profile-btn');
const profileSection = document.getElementById('profile-section');
const profileBackBtn = document.getElementById('profile-back-btn');
const transferPropertyBtn = document.getElementById('transfer-property-btn');
const transferModal = document.getElementById('transfer-modal');
const newOwnerWallet = document.getElementById('new-owner-wallet');
const cancelTransferBtn = document.getElementById('cancel-transfer');
const confirmTransferBtn = document.getElementById('confirm-transfer');
const searchUserBtn = document.getElementById('search-user-btn');
const wizardBackBtn = document.getElementById('wizard-back-btn');

// API Base URL
const API_BASE_URL = 'http://127.0.0.1:5000';
const CONTRACT_SERVER_URL = 'http://127.0.0.1:8000';

// Global variables
let web3;
let currentAccount;
let propertyContract;
let landRegistryContract;
let transferOwnershipContract;
let usersContract;

// Current user and wallet state
let currentUser = null;
let currentWalletAddress = null;
let currentProperty = null;

// Add network configuration
const REQUIRED_NETWORK_ID = '5777'; // Ganache default network ID
const REQUIRED_NETWORK_NAME = 'Ganache';

// Add Kenyan counties data
const KENYAN_COUNTIES = [
    "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita-Taveta",
    "Garissa", "Wajir", "Mandera", "Marsabit", "Isiolo", "Meru",
    "Tharaka-Nithi", "Embu", "Kitui", "Machakos", "Makueni", "Nyandarua",
    "Nyeri", "Kirinyaga", "Murang'a", "Kiambu", "Turkana", "West Pokot",
    "Samburu", "Trans-Nzoia", "Uasin Gishu", "Elgeyo-Marakwet", "Nandi",
    "Baringo", "Laikipia", "Nakuru", "Narok", "Kajiado", "Kericho",
    "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia", "Siaya",
    "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi"
];

const PROPERTY_FORM_FIELDS = [
    'propertyTitle', 
    'streetAddress', 
    'postalCode', 
    'county', 
    'plotNumber'
];

// Property status mapping
const PROPERTY_STATUS = {
    0: 'Created',
    1: 'Scheduled',
    2: 'Verified',
    3: 'Rejected',
    4: 'OnSale',
    5: 'Bought'
};

// Helper Functions

function getStatusText(statusCode) {
    return PROPERTY_STATUS[statusCode] || 'Unknown';
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`);
    
    if (field && errorElement) {
        field.classList.add('error-input');
        errorElement.textContent = message;
    }
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`);
    
    if (field && errorElement) {
        field.classList.remove('error-input');
        errorElement.textContent = '';
    }
}

function validateField(fieldId, errorMessage) {
    const field = document.getElementById(fieldId);
    if (!field.value.trim()) {
        showFieldError(fieldId, errorMessage);
        return false;
    } else {
        clearFieldError(fieldId);
        return true;
    }
}

function showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

function showError(message) {
    // Hide technical details from users
    const userFriendlyMessages = {
        'Internal JSON-RPC error': 'Network error occurred. Please try again.',
        'User denied transaction': 'Transaction was cancelled',
        'gas required exceeds allowance': 'Insufficient gas. Please try again.'
    };

    const friendlyMessage = userFriendlyMessages[message] || message;

    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${friendlyMessage}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 5000);
}

// Blockchain Functions

async function checkNetwork() {
    try {
        const chainId = await web3.eth.net.getId();
        console.log('Connected to network ID:', chainId);
        
        if (chainId.toString() !== REQUIRED_NETWORK_ID) {
            throw new Error(`Please connect to ${REQUIRED_NETWORK_NAME} network. Current network ID: ${chainId}`);
        }
        return true;
    } catch (error) {
        console.error('Network check failed:', error);
        throw error;
    }
}

async function loadContractABI(contractName) {
    try {
        console.log(`Fetching ABI for ${contractName} contract...`);
        const response = await fetch(`${CONTRACT_SERVER_URL}/${contractName}.json`);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${contractName} ABI: ${response.statusText}`);
        }
        const contractData = await response.json();
    
        if (!contractData.abi || !Array.isArray(contractData.abi)) {
            throw new Error(`Invalid ABI format for ${contractName}`);
        }

        const networkId = await web3.eth.net.getId();
        const deployedAddress = contractData.networks[networkId]?.address;
        
        if (!deployedAddress) {
            throw new Error(`${contractName} contract not deployed on network ${networkId}`);
        }
        
        console.log(`${contractName} deployed address:`, deployedAddress);
        
        return {
            abi: contractData.abi,
            address: deployedAddress
        };
    } catch (error) {
        console.error(`Error loading ${contractName} ABI:`, error);
        throw error;
    }
}

async function loadContracts() {
    try {
        console.log("Loading contracts...");
        
        if (typeof window.ethereum === 'undefined') {
            throw new Error('Please install MetaMask to use this application');
        }

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log("Connected wallet address:", accounts[0]);
        currentAccount = accounts[0];

        web3 = new Web3(window.ethereum);
        console.log("Web3 initialized");

        await checkNetwork();

        const [property, landRegistry, users, transferOwnership] = await Promise.all([
            loadContractABI('Property'),
            loadContractABI('LandRegistry'),
            loadContractABI('Users'),
            loadContractABI('TransferOwnership')
        ]);

        propertyContract = new web3.eth.Contract(property.abi, property.address);
        landRegistryContract = new web3.eth.Contract(landRegistry.abi, landRegistry.address);
        usersContract = new web3.eth.Contract(users.abi, users.address);
        transferOwnershipContract = new web3.eth.Contract(transferOwnership.abi, transferOwnership.address);

        console.log("All contracts loaded successfully");
        return true;
    } catch (error) {
        console.error("Error loading contracts:", error);
        showError('Failed to load blockchain contracts: ' + error.message);
        return false;
    }
}

async function connectWallet(inputElement) {
    try {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('Please install MetaMask to use this application');
        }

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        
        if (inputElement) {
            inputElement.value = account;
        }
        
        currentWalletAddress = account;
        
        if (!web3) {
            web3 = new Web3(window.ethereum);
            console.log("Web3 initialized during wallet connect");
        }

        console.log("Wallet connected:", account);
        
        if (!propertyContract || !landRegistryContract || !usersContract || !transferOwnershipContract) {
            await loadContracts();
        }

        return account;
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showError('Failed to connect wallet: ' + error.message);
        return null;
    }
}

// User Functions

async function handleLogin(walletAddress, password) {
    if (!walletAddress || !password) {
        showError('Please enter both wallet address and password');
        return;
    }

    try {
        await loadContracts();
        
        const isRegistered = await usersContract.methods.isRegistered(walletAddress).call();
        
        if (!isRegistered) {
            showError('User not registered. Please register first.');
            return;
        }

        const userDetails = await usersContract.methods.getUserDetails(walletAddress).call();
        
        const userInfo = {
            walletAddress: walletAddress,
            firstName: userDetails[0],
            lastName: userDetails[1],
            idNumber: userDetails[2],
            accountCreated: userDetails[3]
        };
        localStorage.setItem('currentUser', JSON.stringify(userInfo));

        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('dashboard-container').style.display = 'block';
        document.getElementById('username').textContent = `${userDetails[0]} ${userDetails[1]}`;
        document.getElementById('user-avatar').textContent = `${userDetails[0][0]}${userDetails[1][0]}`;
        document.getElementById('wallet-address-display').textContent = walletAddress;

        await loadProperties();
        
    } catch (error) {
        console.error('Login error:', error);
        showError('Login failed: ' + error.message);
    }
}

function handleLogout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentWalletAddress');
    
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
    
    document.getElementById('dashboard-container').style.display = 'none';
    document.getElementById('auth-container').style.display = 'block';
}

// Property Functions

async function loadProperties() {
    try {
        const propertyCards = document.getElementById('property-cards');
        propertyCards.innerHTML = '';

        // Fetch from MongoDB API
        const response = await fetch(`${API_BASE_URL}/properties?owner=${currentWalletAddress}`);
        const result = await response.json();
        console.log(result)

        if (!response.ok) {
            throw new Error(result.message || 'Failed to load properties');
        }
        
        if (!result.properties || result.properties.length === 0) {
            propertyCards.innerHTML = '<div class="no-properties">No properties registered yet</div>';
            return;
        }

        result.properties.forEach(property => {
            // Determine status class based on property status
            let statusClass = '';
            let statusText = '';
            
            if (property.status === 'verified') {
                statusClass = 'verified';
                statusText = 'Verified';
            } else if (property.status === 'pending') {
                statusClass = 'pending';
                statusText = 'Pending';
            } else if (property.status === 'rejected') {
                statusClass = 'rejected';
                statusText = 'Rejected';
            } else {
                statusClass = 'unknown';
                statusText = 'Unknown';
            }
            
            // Add blockchain indicator
            const blockchainStatus = property.blockchainPropertyId ? 
                '<div class="blockchain-indicator on-blockchain" title="Registered on blockchain"><i class="fas fa-link"></i></div>' :
                '<div class="blockchain-indicator not-on-blockchain" title="Not on blockchain yet"><i class="fas fa-unlink"></i></div>';
            
            const card = document.createElement('div');
            card.className = 'property-card';
            card.dataset.propertyId = property._id;
            
            // Add hover actions container (only show transfer button if verified)
            const hoverActions = document.createElement('div');
            hoverActions.className = 'property-card-actions';
            
            // Always show edit and delete buttons
            hoverActions.innerHTML = `
                <button class="btn-action edit-btn" title="Edit Property">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete-btn" title="Delete Property">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            // Only add transfer button if property is verified
            if (property.status === 'verified') {
                hoverActions.innerHTML += `
                    <button class="btn-action transfer-btn" title="Transfer Property">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                `;
            }
            
            card.innerHTML = `
                ${blockchainStatus}
                <div class="property-title">${property.title || 'Untitled Property'}</div>
                <div class="property-details">
                    <div class="property-detail">
                        <span class="detail-label">Plot Number:</span>
                        <span>${property.plotNumber}</span>
                    </div>
                    <div class="property-detail">
                        <span class="detail-label">Status:</span>
                        <span class="property-status ${statusClass}">${statusText}</span>
                    </div>
                </div>
            `;
            
            card.appendChild(hoverActions);
            propertyCards.appendChild(card);

            // Add click handlers for the action buttons
            const editBtn = card.querySelector('.edit-btn');
            const deleteBtn = card.querySelector('.delete-btn');
            const transferBtn = card.querySelector('.transfer-btn');

            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showPropertyRegistrationWizard(property._id);
            });

            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                    deleteProperty(property._id);
                
            });

            if (transferBtn) {
                transferBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentProperty = property;
                    showTransferModal();
                });
            }

            // Still keep the main card click for viewing details
            card.addEventListener('click', () => {
                currentProperty = property;
                showPropertyDetails(property._id);
            });
        });
    } catch (error) {
        console.error('Error loading properties:', error);
        document.getElementById('property-cards').innerHTML = '<div class="error">Failed to load properties</div>';
    }
}

async function showPropertyDetails(propertyId) {
    try {
        // Fetch from MongoDB API
        const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to load property details');
        }
        
        const property = result.property;
        currentProperty = property;
        
        document.getElementById('modal-property-title').textContent = property.title || 'Untitled Property';
        document.getElementById('modal-plot-number').textContent = property.plotNumber;
        document.getElementById('modal-address').textContent = property.streetAddress;
        document.getElementById('modal-county').textContent = property.county;
        document.getElementById('modal-postal-code').textContent = property.postalCode;
        
        const statusText = property.status === 'verified' ? 'Verified' : 
                          property.status === 'pending' ? 'Pending' :
                          property.status === 'rejected' ? 'Rejected' : 'Unknown';
                          
        const statusClass = property.status === 'verified' ? 'verified' : 
                           property.status === 'pending' ? 'pending' :
                           property.status === 'rejected' ? 'rejected' : 'unknown';

        const statusElement = document.getElementById('modal-status');
        statusElement.textContent = statusText;
        statusElement.className = `status-badge ${statusClass}`;
        
        // Add blockchain status indicator
        const blockchainStatusElement = document.createElement('div');
        blockchainStatusElement.className = property.blockchainPropertyId ? 
            'blockchain-indicator on-blockchain' : 'blockchain-indicator not-on-blockchain';
        blockchainStatusElement.innerHTML = property.blockchainPropertyId ? 
            '<i class="fas fa-link"></i> On Blockchain' : '<i class="fas fa-unlink"></i> Not On Blockchain';
        
        // Add it to the modal header
        const modalHeader = document.querySelector('#property-modal .modal-header');
        modalHeader.appendChild(blockchainStatusElement);
        
        // Update transfer button visibility
        const transferBtn = document.getElementById('transfer-property-btn');
        if (property.status === 'verified') {
            transferBtn.style.display = 'inline-block';
        } else {
            transferBtn.style.display = 'none';
        }
        
        document.getElementById('property-modal').style.display = 'block';
    } catch (error) {
        console.error('Error loading property details:', error);
        showError('Failed to load property details');
    }
}

function showPropertyRegistrationWizard(propertyId = null) {
    const wizard = document.getElementById('registration-wizard');
    const propertiesList = document.getElementById('properties-list');
    
    if (!wizard || !propertiesList) {
        console.error('Required elements not found');
        return;
    }
    
    wizard.style.display = 'block';
    propertiesList.style.display = 'none';
    
    const submitButton = document.getElementById('submit-property');
    if (propertyId) {
        submitButton.innerHTML = '<i class="fas fa-save"></i> Update Property';
        submitButton.dataset.mode = 'edit';
        submitButton.dataset.propertyId = propertyId;
        loadPropertyDetailsForEditing(propertyId);
    } else {
        submitButton.innerHTML = '<i class="fas fa-file-signature"></i> Register Property';
        submitButton.dataset.mode = 'new';
        submitButton.removeAttribute('data-property-id');
        
        document.getElementById('propertyTitle').value = '';
        document.getElementById('streetAddress').value = '';
        document.getElementById('postalCode').value = '';
        document.getElementById('county').value = '';
        document.getElementById('plotNumber').value = '';
    }
    
    showWizardStep(1);
}

async function loadPropertyDetailsForEditing(propertyId) {
    try {
        // First fetch from MongoDB to get the blockchain property ID
        const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`);
        const result = await response.json();
        
        if (!response.ok || result.status !== 'success') {
            throw new Error(result.message || 'Failed to load property details');
        }

        const mongoProperty = result.property;
        
        // Populate the form with data from MongoDB
        document.getElementById('propertyTitle').value = mongoProperty.title || '';
        document.getElementById('streetAddress').value = mongoProperty.streetAddress || '';
        document.getElementById('postalCode').value = mongoProperty.postalCode || '';
        document.getElementById('county').value = mongoProperty.county || '';
        document.getElementById('plotNumber').value = mongoProperty.plotNumber || '';
        
        // Set the blockchain property ID in a hidden field if it exists
        if (mongoProperty.blockchainPropertyId) {
            document.getElementById('submit-property').dataset.blockchainId = mongoProperty.blockchainPropertyId;
        }
        
        // If no blockchainPropertyId, show a message
        if (!mongoProperty.blockchainPropertyId) {
            showError('This property is not yet registered on blockchain. Saving will register it.');
        }
    } catch (error) {
        console.error('Error loading property for editing:', error);
        showError('Failed to load property details: ' + error.message);
        throw error;
    }
}

function showWizardStep(stepNumber) {
    const wizardSteps = document.querySelectorAll('.wizard-step');
    wizardSteps.forEach((step, index) => {
        step.style.display = index + 1 === stepNumber ? 'block' : 'none';
    });

    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        if (index + 1 === stepNumber) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

// Transfer Functions

function showTransferModal() {
    document.getElementById('transfer-modal').style.display = 'block';
    document.getElementById('new-owner-wallet').value = '';
    document.getElementById('selected-user').style.display = 'none';
    document.getElementById('user-search-results').innerHTML = '';
}

async function displaySearchResults(users) {
    const resultsContainer = document.getElementById('user-search-results');
    resultsContainer.innerHTML = '';
    
    if (users.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">No users found</div>';
        return;
    }
    
    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-result-card';
        userCard.innerHTML = `
            <div class="user-avatar">${user.firstName[0]}${user.lastName[0]}</div>
            <div class="user-info">
                <span class="user-name">${user.firstName} ${user.lastName}</span>
                <span class="user-wallet">${user.walletAddress}</span>
            </div>
        `;
        
        userCard.addEventListener('click', () => {
            document.getElementById('new-owner-wallet').value = user.walletAddress;
            document.getElementById('transfer-user-name').textContent = `${user.firstName} ${user.lastName}`;
            document.getElementById('transfer-user-wallet').textContent = user.walletAddress;
            document.getElementById('transfer-user-avatar').textContent = `${user.firstName[0]}${user.lastName[0]}`;
            document.getElementById('selected-user').style.display = 'block';
        });
        
        resultsContainer.appendChild(userCard);
    });
}

// Initialize Functions

function initializeCounties() {
    const countySelect = document.getElementById('county');
    if (countySelect) {
        KENYAN_COUNTIES.forEach(county => {
            const option = document.createElement('option');
            option.value = county;
            option.textContent = county;
            countySelect.appendChild(option);
        });
    }
}

function initializeEventListeners() {
    // Wallet connection
    connectWalletBtnLogin.addEventListener('click', async () => {
        const walletInput = document.getElementById('login-wallet');
        await connectWallet(walletInput);
    });

    connectWalletBtnRegister.addEventListener('click', async () => {
        const walletInput = document.getElementById('register-wallet');
        await connectWallet(walletInput);
    });

    // Tab switching
    loginTab.addEventListener('click', () => {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
    });

    registerTab.addEventListener('click', () => {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
    });

    // Login and Register
    loginBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const walletAddress = document.getElementById('login-wallet').value;
        const password = document.getElementById('login-password').value;
        await handleLogin(walletAddress, password);
    });

    registerBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const userData = {
            firstName: document.getElementById('register-first-name').value,
            lastName: document.getElementById('register-last-name').value,
            walletAddress: document.getElementById('register-wallet').value,
            password: document.getElementById('register-password').value,
            idNumber: document.getElementById('register-id-number').value
        };
        
        const confirmPassword = document.getElementById('register-confirm').value;
        const passportPhoto = document.getElementById('register-passport').files[0];
        const idDocument = document.getElementById('register-id-document').files[0];
        
        if (userData.password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        if (!passportPhoto || !idDocument) {
            showError('Passport photo and ID document are required');
            return;
        }
        
        try {
            await registerUser(userData, passportPhoto, idDocument);
            document.getElementById('login-tab').click();
        } catch (error) {
            console.error('Registration failed:', error);
            // Error message already shown by the register function
        }
    });

    // User dropdown
    userBtn.addEventListener('click', () => {
        userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
    });

    profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showProfileSection();
        userDropdown.style.display = 'none';
    });

    addPropertyBtn.addEventListener('click', () => {
        showPropertyRegistrationWizard();
        document.getElementById('user-dropdown').style.display = 'none';
    });

    logoutBtn.addEventListener('click', () => {
        handleLogout();
        document.getElementById('user-dropdown').style.display = 'none';
    });

    // Property wizard navigation
    wizardBackBtn.addEventListener('click', () => {
        registrationWizard.style.display = 'none';
        propertiesList.style.display = 'block';
    });

    cancelRegistrationBtn.addEventListener('click', () => {
        registrationWizard.style.display = 'none';
        propertiesList.style.display = 'block';
    });

    returnToDashboardBtn.addEventListener('click', () => {
        registrationWizard.style.display = 'none';
        propertiesList.style.display = 'block';
        successMessage.style.display = 'none';
    });

    nextStep1Btn.addEventListener('click', (e) => {
        e.preventDefault();
        let isValid = true;
        
        PROPERTY_FORM_FIELDS.forEach(fieldId => {
            if (!validateField(fieldId, 'This field is required')) {
                isValid = false;
            }
        });
        
        if (isValid) {
            document.getElementById('review-propertyTitle').textContent = document.getElementById('propertyTitle').value;
            document.getElementById('review-streetAddress').textContent = document.getElementById('streetAddress').value;
            document.getElementById('review-postalCode').textContent = document.getElementById('postalCode').value;
            document.getElementById('review-county').textContent = document.getElementById('county').value;
            document.getElementById('review-plotNumber').textContent = document.getElementById('plotNumber').value;
            
            showWizardStep(2);
        }
    });
    
    nextStep2Btn.addEventListener('click', (e) => {
        e.preventDefault();
        const deedDocument = document.getElementById('deedDocument').files[0];
        const surveyPlan = document.getElementById('surveyPlan').files[0];
        const errorElement = document.getElementById('deedDocument-error');
        
        // Validate file size (5MB max)
        if (deedDocument && deedDocument.size > 5 * 1024 * 1024) {
            errorElement.textContent = 'File size must be less than 5MB';
            return;
        }

        // Validate file type
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (deedDocument && !validTypes.includes(deedDocument.type)) {
            errorElement.textContent = 'Only PDF, JPEG, and PNG files are allowed';
            return;
        }

        // Clear any previous errors
        errorElement.textContent = '';

        // Update preview handling for both deed and survey
        const deedPreview = document.getElementById('deed-preview');
        const deedFilename = document.getElementById('deed-filename');
        const surveyPreview = document.getElementById('survey-preview');
        const surveyFilename = document.getElementById('survey-filename');
        
        // Handle deed document preview
        if (deedDocument) {
            deedFilename.textContent = deedDocument.name;
            if (deedDocument.type.includes('image')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    deedPreview.innerHTML = `
                        <img src="${e.target.result}" alt="Deed Document" class="document-preview-img">
                        <div class="file-size">${(deedDocument.size / 1024 / 1024).toFixed(2)} MB</div>
                    `;
                };
                reader.readAsDataURL(deedDocument);
            } else {
                deedPreview.innerHTML = `
                    <i class="fas fa-file-pdf"></i>
                    <div class="file-info">
                        <span>${deedDocument.name}</span>
                        <span class="file-size">${(deedDocument.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                `;
            }
        }
        
        // Handle survey plan preview
        if (surveyPlan) {
            surveyFilename.textContent = surveyPlan.name;
            if (surveyPlan.type.includes('image')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    surveyPreview.innerHTML = `
                        <img src="${e.target.result}" alt="Survey Plan" class="document-preview-img">
                        <div class="file-size">${(surveyPlan.size / 1024 / 1024).toFixed(2)} MB</div>
                    `;
                };
                reader.readAsDataURL(surveyPlan);
            } else if (surveyPlan.type === 'application/pdf') {
                surveyPreview.innerHTML = `
                    <i class="fas fa-file-pdf"></i>
                    <div class="file-info">
                        <span>${surveyPlan.name}</span>
                        <span class="file-size">${(surveyPlan.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                `;
            }
        } else {
            surveyPreview.innerHTML = `
                <i class="fas fa-file-image"></i>
                <span>No survey plan uploaded</span>
            `;
        }
        
        showWizardStep(3);
    });

    prevStep2Btn.addEventListener('click', () => {
        showWizardStep(1);
    });

    prevStep3Btn.addEventListener('click', () => {
        showWizardStep(2);
    });

    // Update property form submission
    propertyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const mode = document.getElementById('submit-property').dataset.mode;
            const propertyId = document.getElementById('submit-property').dataset.propertyId;
            
            const propertyData = {
                title: document.getElementById('propertyTitle').value,
                streetAddress: document.getElementById('streetAddress').value,
                postalCode: document.getElementById('postalCode').value,
                county: document.getElementById('county').value,
                plotNumber: document.getElementById('plotNumber').value,
                owner: currentWalletAddress
            };
            
            const deedDocument = document.getElementById('deedDocument').files[0];
            const surveyPlan = document.getElementById('surveyPlan').files[0];
            
            if (mode === 'new') {
                await registerProperty(propertyData, deedDocument, surveyPlan);
            } else {
                await updateProperty(propertyId, propertyData, deedDocument, surveyPlan);
            }
            
            document.getElementById('successMessage').style.display = 'block';
            document.getElementById('propertyForm').style.display = 'none';
            
            await loadProperties();
        } catch (error) {
            console.error('Error submitting property:', error);
            // Error message already shown by the register/update functions
        }
    });

    // Update delete property handler
    deletePropertyBtn.addEventListener('click', async () => {
        if (currentProperty && confirm('Are you sure you want to delete this property?')) {
            try {
                await deleteProperty(currentProperty._id);
                propertyModal.style.display = 'none';
                await loadProperties();
            } catch (error) {
                console.error('Failed to delete property:', error);
                showError('Failed to delete property: ' + error.message);
            }
        }
    });

    // Update transfer property handler
    confirmTransferBtn.addEventListener('click', async () => {
        const recipientWallet = document.getElementById('new-owner-wallet').value;
        if (!recipientWallet) {
            showError('Please select a recipient');
            return;
        }
        
        if (recipientWallet.toLowerCase() === currentWalletAddress.toLowerCase()) {
            showError('You cannot transfer property to yourself');
            return;
        }

        // Verify recipient is registered
        try {
            const isRegistered = await usersContract.methods.isRegistered(recipientWallet).call();
            if (!isRegistered) {
                showError('Recipient is not a registered user');
                return;
            }

            // Show confirmation dialog
            if (!confirm(`Are you sure you want to transfer this property to ${recipientWallet}? This action cannot be undone.`)) {
                return;
            }

            // Show loading indicator
            confirmTransferBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            confirmTransferBtn.disabled = true;

            await transferProperty(currentProperty._id, recipientWallet);
            transferModal.style.display = 'none';
            propertyModal.style.display = 'none';
            await loadProperties();
            showSuccessMessage('Property transfer completed successfully!');
        } catch (error) {
            console.error('Transfer failed:', error);
            showError('Transfer failed: ' + error.message);
        } finally {
            confirmTransferBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Confirm Transfer';
            confirmTransferBtn.disabled = false;
        }
    });

    // Close modals
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    Array.from(closeModalBtns).forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modal = closeBtn.closest('.modal');
            modal.style.display = 'none';
        });
    });

    // Field validation
    document.getElementById('propertyTitle').addEventListener('blur', () => {
        validateField('propertyTitle', 'Property title is required');
    });

    document.getElementById('streetAddress').addEventListener('blur', () => {
        validateField('streetAddress', 'Street address is required');
    });

    document.getElementById('postalCode').addEventListener('blur', () => {
        validateField('postalCode', 'Postal code is required');
    });

    document.getElementById('plotNumber').addEventListener('blur', () => {
        validateField('plotNumber', 'Plot number is required');
    });

    // Update these event listeners in initializeEventListeners()
    editPropertyBtn.addEventListener('click', () => {
        if (currentProperty) {
            propertyModal.style.display = 'none';
            showPropertyRegistrationWizard(currentProperty._id);
        }
    });

    deletePropertyBtn.addEventListener('click', async () => {
        if (currentProperty && confirm('Are you sure you want to delete this property?')) {
            try {
                await deleteProperty(currentProperty._id);
                propertyModal.style.display = 'none';
                await loadProperties();
            } catch (error) {
                console.error('Failed to delete property:', error);
                showError('Failed to delete property: ' + error.message);
            }
        }
    });

    transferPropertyBtn.addEventListener('click', () => {
        if (currentProperty && currentProperty.status === 'verified') {
            propertyModal.style.display = 'none';
            showTransferModal();
        }
    });

    // Update the search user functionality
    searchUserBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const searchTerm = document.getElementById('search-user').value.trim();
        
        if (!searchTerm) {
            showError('Please enter a name or wallet address to search');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(searchTerm)}`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Search failed');
            }
            
            displaySearchResults(result.users);
        } catch (error) {
            console.error('Search error:', error);
            showError('Search failed: ' + error.message);
        }
    });

    // Add to initializeEventListeners()
    document.getElementById('change-password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            showError("New passwords don't match");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            showSuccessMessage("Password changed successfully");
            document.getElementById('change-password-form').reset();
        } catch (error) {
            showError(error.message);
        }
    });

    // Close modal when clicking outside content
    document.addEventListener('click', (e) => {
        const profileSection = document.getElementById('profile-section');
        if (e.target === profileSection) {
            hideProfileSection();
        }
    });

    // Close modal when clicking close button
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Close user dropdown when clicking outside
    window.addEventListener('click', function(event) {
        const userDropdown = document.getElementById('user-dropdown');
        const userBtn = document.getElementById('user-btn');
        
        if (!event.target.matches('#user-btn') && !event.target.matches('#user-btn *')) {
            userDropdown.style.display = 'none';
        }
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        initializeCounties();
        await loadContracts();
        initializeEventListeners();
        
        // Handle MetaMask account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', async (accounts) => {
                if (accounts.length === 0) {
                    currentWalletAddress = null;
                    const loginWalletInput = document.getElementById('login-wallet');
                    const registerWalletInput = document.getElementById('register-wallet');
                    if (loginWalletInput) loginWalletInput.value = '';
                    if (registerWalletInput) registerWalletInput.value = '';
                    console.log('Wallet disconnected');
                } else {
                    currentWalletAddress = accounts[0];
                    const loginWalletInput = document.getElementById('login-wallet');
                    const registerWalletInput = document.getElementById('register-wallet');
                    if (loginWalletInput) loginWalletInput.value = accounts[0];
                    if (registerWalletInput) registerWalletInput.value = accounts[0];
                    console.log('Wallet account changed:', accounts[0]);
                    
                    // Reload properties if on dashboard
                    if (dashboardContainer.style.display === 'block') {
                        await loadProperties();
                    }
                }
            });
        }
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize application: ' + error.message);
    }
});

// Profile Functions
function showProfileSection() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        document.getElementById('profile-name').textContent = `${user.firstName} ${user.lastName}`;
        document.getElementById('profile-wallet').textContent = user.walletAddress;
        document.getElementById('profile-role').textContent = 'Client';
        document.getElementById('profile-avatar').textContent = `${user.firstName[0]}${user.lastName[0]}`;
    }
    
    // Hide other sections
    propertiesList.style.display = 'none';
    registrationWizard.style.display = 'none';
    
    // Show profile section
    profileSection.style.display = 'block';
}

function hideProfileSection() {
    profileSection.style.display = 'none';
    propertiesList.style.display = 'block';
}

// Update event listeners
profileBackBtn.addEventListener('click', () => {
    hideProfileSection();
});

// Enhanced Property Functions with Blockchain-MongoDB Sync

async function registerProperty(propertyData, deedDocument, surveyPlan) {
    try {
        showLoading();
        
        // 1. First register on blockchain
        const blockchainPropertyId = await registerPropertyOnBlockchain(propertyData);

        console.log("BlockChainID",blockchainPropertyId)
        
        // 2. Then sync to MongoDB
        const formData = new FormData();
        formData.append('property', JSON.stringify({
            ...propertyData,
            owner: currentWalletAddress,
            blockchainPropertyId: blockchainPropertyId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));
        
        if (deedDocument) formData.append('deedDocument', deedDocument);
        if (surveyPlan) formData.append('surveyPlan', surveyPlan);
        
        const response = await fetch(`${API_BASE_URL}/properties`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to sync property to database');
        }
        
        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to register property');
        }
        
        showSuccessMessage('Property registered successfully on blockchain and database!');
        return result;
    } catch (error) {
        console.error('Property registration failed:', error);
        showError(error.message);
        
        // Attempt to rollback blockchain registration if MongoDB sync failed
        if (blockchainPropertyId) {
            try {
                await propertyContract.methods.removeProperty(blockchainPropertyId)
                    .send({ from: currentWalletAddress });
                console.log('Blockchain registration rolled back successfully');
            } catch (rollbackError) {
                console.error('Failed to rollback blockchain registration:', rollbackError);
            }
        }
        
        throw error;
    } finally {
        hideLoading();
    }
}

async function registerPropertyOnBlockchain(propertyData) {
    try {
        const tx = await sendTransaction(
            landRegistryContract.methods.addLand(
                0, // locationId (placeholder)
                propertyData.plotNumber,
                currentWalletAddress,
                propertyData.streetAddress
            ),
            currentWalletAddress
        );
        
        const blockchainPropertyId = tx.events.LandAdded.returnValues.propertyId;
        
        // Update additional property details
        await sendTransaction(
            propertyContract.methods.editLand(
                blockchainPropertyId,
                propertyData.plotNumber,
                propertyData.streetAddress,
                propertyData.postalCode
            ),
            currentWalletAddress
        );
        
        return blockchainPropertyId;
    } catch (error) {
        throw error;
    }
}

async function updateProperty(propertyId, propertyData, deedDocument, surveyPlan) {
    try {
        showLoading();
        
        // First get the property to verify ownership and get blockchain ID
        const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`);
        const result = await response.json();
        
        if (!response.ok || result.status !== 'success') {
            throw new Error(result.message || 'Failed to load property details');
        }

        const mongoProperty = result.property;
        let blockchainPropertyId = mongoProperty.blockchainPropertyId;

        // Prepare form data for the API call
        const formData = new FormData();
        formData.append('property', JSON.stringify({
            ...propertyData,
            owner: currentWalletAddress,
            blockchainPropertyId: blockchainPropertyId,
            updatedAt: new Date().toISOString()
        }));
        
        if (deedDocument) formData.append('deedDocument', deedDocument);
        if (surveyPlan) formData.append('surveyPlan', surveyPlan);

        // If no blockchain ID, register first
        if (!blockchainPropertyId) {
            blockchainPropertyId = await registerPropertyOnBlockchain(propertyData);
            formData.set('property', JSON.stringify({
                ...propertyData,
                owner: currentWalletAddress,
                blockchainPropertyId: blockchainPropertyId,
                updatedAt: new Date().toISOString()
            }));
        } else {
            // Update existing blockchain record
            await updatePropertyOnBlockchain(blockchainPropertyId, propertyData);
        }

        // Then update in MongoDB
        const updateResponse = await fetch(`${API_BASE_URL}/properties/${propertyId}`, {
            method: 'PUT',
            body: formData
        });
        
        const updateResult = await updateResponse.json();
        
        if (!updateResponse.ok || updateResult.status !== 'success') {
            throw new Error(updateResult.message || 'Failed to update property in database');
        }
        
        showSuccessMessage('Property updated successfully!');
        return updateResult;
    } catch (error) {
        console.error('Property update failed:', error);
        showError(error.message);
        throw error;
    } finally {
        hideLoading();
    }
}

async function updatePropertyOnBlockchain(propertyId, propertyData) {
    try {
        await sendTransaction(
            propertyContract.methods.editLand(
                propertyId,
                propertyData.plotNumber,
                propertyData.streetAddress,
                propertyData.postalCode
            ),
            currentWalletAddress
        );
        
        return true;
    } catch (error) {
        console.error('Blockchain update failed:', error);
        throw new Error('Failed to update property on blockchain: ' + error.message);
    }
}

async function deleteProperty(propertyId) {
    try {
        showLoading();
        
        // First get the property details from MongoDB
        const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to load property details');
        }

        const mongoProperty = result.property;
        const blockchainPropertyId = mongoProperty.blockchainPropertyId;

        // Only try to delete from blockchain if it exists there
        if (blockchainPropertyId) {
            try {
                await deletePropertyFromBlockchain(blockchainPropertyId);
            } catch (error) {
                console.error('Failed to delete from blockchain, continuing with MongoDB deletion:', error);
                // Continue with MongoDB deletion even if blockchain deletion fails
            }
        }

        // Delete from MongoDB
        const deleteResponse = await fetch(`${API_BASE_URL}/properties/${propertyId}`, {
            method: 'DELETE'
        });
        
        const deleteResult = await deleteResponse.json();
        
        if (!deleteResponse.ok) {
            throw new Error(deleteResult.message || 'Failed to delete property from database');
        }
        
        showSuccessMessage('Property deleted successfully!');
        return deleteResult;
    } catch (error) {
        console.error('Property deletion failed:', error);
        showError(error.message);
        throw error;
    } finally {
        hideLoading();
    }
}

async function deletePropertyFromBlockchain(propertyId) {
    try {
        await sendTransaction(
            propertyContract.methods.removeLand(propertyId),
            currentWalletAddress
        );
        
        return true;
    } catch (error) {
        console.error('Blockchain deletion failed:', error);
        throw new Error('Failed to delete property from blockchain: ' + error.message);
    }
}

// Enhanced User Functions with Blockchain-MongoDB Sync

async function registerUser(userData, passportPhoto, idDocument) {
    try {
        showLoading();
        
        // 1. First register on blockchain
        await registerUserOnBlockchain(userData);
        
        // 2. Then register in MongoDB
        const formData = new FormData();
        formData.append('firstName', userData.firstName);
        formData.append('lastName', userData.lastName);
        formData.append('walletAddress', userData.walletAddress);
        formData.append('password', userData.password);
        formData.append('idNumber', userData.idNumber);
        formData.append('passportPhoto', passportPhoto);
        formData.append('idDocument', idDocument);
        
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to register user in database');
        }
        
        showSuccessMessage('User registered successfully on blockchain and database!');
        return result;
    } catch (error) {
        console.error('User registration failed:', error);
        showError(error.message);
        throw error;
    } finally {
        hideLoading();
    }
}

async function registerUserOnBlockchain(userData) {
    try {
        const fee = await usersContract.methods.registrationFee().call();
        
        // Pay registration fee
        await sendTransaction(
            usersContract.methods.payRegistrationFee(),
            userData.walletAddress,
            fee
        );
        
        // Register user
        await sendTransaction(
            usersContract.methods.registerUser(
                userData.firstName,
                userData.lastName,
                userData.idNumber
            ),
            userData.walletAddress
        );
        
        return true;
    } catch (error) {
        console.error('Blockchain registration failed:', error);
        throw new Error('Failed to register user on blockchain: ' + error.message);
    }
}

// Enhanced Transfer Functions
async function transferProperty(propertyId, newOwnerWallet) {
    try {
        showLoading();
        
        // 1. First transfer on blockchain
        const txHash = await transferPropertyOnBlockchain(propertyId, newOwnerWallet);
        
        // 2. Then update MongoDB
        const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentOwner: currentWalletAddress,
                newOwner: newOwnerWallet,
                txHash: txHash
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to update property transfer in database');
        }
        
        return result;
    } catch (error) {
        console.error('Property transfer failed:', error);
        throw error;
    } finally {
        hideLoading();
    }
}

async function transferPropertyOnBlockchain(propertyId, newOwnerWallet) {
    try {
        // Verify new owner is registered and verified
        const isRegistered = await usersContract.methods.isRegistered(newOwnerWallet).call();
        if (!isRegistered) {
            throw new Error('Recipient is not a registered user');
        }
        
        // First put property on sale (price 0 for direct transfer)
        await sendTransaction(
            transferOwnershipContract.methods.addPropertyOnSale(
                propertyId,
                0 // price in ETH (0 for direct transfer)
            ),
            currentWalletAddress
        );
        
        // Get the latest sale ID
        const mySales = await transferOwnershipContract.methods.getMySales(currentWalletAddress).call();
        const latestSaleId = mySales[mySales.length - 1].saleId;
        
        // Then transfer ownership
        const tx = await sendTransaction(
            transferOwnershipContract.methods.transferOwnerShip(latestSaleId),
            currentWalletAddress,
            0 // No payment for direct transfer
        );
        
        return tx.transactionHash;
    } catch (error) {
        console.error('Blockchain transfer failed:', error);
        throw error;
    }
}

// Enhanced sendTransaction helper
async function sendTransaction(txMethod, fromAddress, value = 0) {
    try {
        // Estimate gas first
        const gasEstimate = await txMethod.estimateGas({ from: fromAddress, value });
        
        // Add 20% buffer to gas estimate
        const gas = Math.floor(gasEstimate * 1.2);
        
        // Get current gas price and add 10% buffer
        const gasPrice = await web3.eth.getGasPrice();
        const bufferedGasPrice = Math.floor(parseInt(gasPrice) * 1.1).toString();
        
        // Send transaction with proper gas settings
        return await txMethod.send({
            from: fromAddress,
            gas,
            gasPrice: bufferedGasPrice,
            value
        });
    } catch (error) {
        if (error.message.includes('User denied transaction')) {
            throw new Error('Transaction was rejected by user');
        } else if (error.message.includes('gas required exceeds allowance')) {
            throw new Error('Insufficient gas. Please try again with higher gas limit.');
        } else {
            throw error;
        }
    }
}

function showLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="loading-spinner"></div>';
    overlay.id = 'loading-overlay';
    document.body.appendChild(overlay);
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Add password toggle functionality
document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', function() {
        const input = this.previousElementSibling;
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
    });
});