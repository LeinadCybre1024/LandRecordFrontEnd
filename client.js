// DOM Elements
const authContainer = document.getElementById('auth-container');
const dashboardContainer = document.getElementById('dashboard-container');
const adminDashboard = document.getElementById('admin-dashboard');
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const userBtn = document.getElementById('user-btn');
const adminUserBtn = document.getElementById('admin-user-btn');
const userDropdown = document.getElementById('user-dropdown');
const adminUserDropdown = document.getElementById('admin-user-dropdown');
const logoutBtn = document.getElementById('logout-btn');
const adminLogoutBtn = document.getElementById('admin-logout-btn');
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
const adminProfileBtn = document.getElementById('admin-profile-btn');
const profileModal = document.getElementById('profile-modal');
const transferPropertyBtn = document.getElementById('transfer-property-btn');
const transferModal = document.getElementById('transfer-modal');
const newOwnerWallet = document.getElementById('new-owner-wallet');
const cancelTransferBtn = document.getElementById('cancel-transfer');
const confirmTransferBtn = document.getElementById('confirm-transfer');
const searchUserBtn = document.getElementById('search-user-btn');
const adminPropertiesList = document.getElementById('admin-properties-list');
const verifyPropertyModal =  document.getElementById('verify-property-modal');
const approvePropertyBtn = document.getElementById('approve-property-btn');
const rejectPropertyBtn = document.getElementById('reject-property-btn');


// API Base URL
const API_BASE_URL = 'http://127.0.0.1:5000';

// Current user and wallet state
let currentUser = null;
let currentWalletAddress = null;
let currentProperty = null;
let currentVerificationProperty = null;

// User roles
const USER_ROLES = {
    ADMIN: '12',
    CLIENT: '34',
    STAFF: '56'
};

// Property contract instance
let propertyContract = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    initializeCountyDropdown();
    loadContracts();
});

function initializeEventListeners() {
    // Authentication
    loginTab.addEventListener('click', showLoginForm);
    registerTab.addEventListener('click', showRegisterForm);
    loginBtn.addEventListener('click', handleLogin);
    registerBtn.addEventListener('click', handleRegister);
    
    
    // Wallet connection
    if (connectWalletBtnLogin) {
        connectWalletBtnLogin.addEventListener('click', () => connectWallet('login-wallet'));
    }
    if (connectWalletBtnRegister) {
        connectWalletBtnRegister.addEventListener('click', () => connectWallet('register-wallet'));
    }
    
    // User dropdowns
    if (userBtn) {
        userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleUserDropdown();
        });
    }
    
    if (adminUserBtn) {
        adminUserBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleAdminUserDropdown();
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        if (userDropdown) userDropdown.classList.remove('show');
        if (adminUserDropdown) adminUserDropdown.classList.remove('show');
    });
    
    // Logout
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', handleLogout);
    
    // Property registration
    if (addPropertyBtn) addPropertyBtn.addEventListener('click', showPropertyWizard);
    if (cancelRegistrationBtn) cancelRegistrationBtn.addEventListener('click', hidePropertyWizard);
    if (returnToDashboardBtn) returnToDashboardBtn.addEventListener('click', hidePropertyWizard);
    if (nextStep1Btn) nextStep1Btn.addEventListener('click', validateStep1);
    if (prevStep2Btn) prevStep2Btn.addEventListener('click', () => navigateStep(1));
    if (nextStep2Btn) nextStep2Btn.addEventListener('click', validateStep2);
    if (prevStep3Btn) prevStep3Btn.addEventListener('click', () => navigateStep(2));
    if (propertyForm) propertyForm.addEventListener('submit', handlePropertyRegistration);
    
    // Property actions
    if (editPropertyBtn) editPropertyBtn.addEventListener('click', editProperty);
    if (deletePropertyBtn) deletePropertyBtn.addEventListener('click', deleteProperty);
    
    // Profile
    if (profileBtn) profileBtn.addEventListener('click', showProfileModal);
    if (adminProfileBtn) adminProfileBtn.addEventListener('click', showProfileModal);
    
    // Modal close buttons
    Array.from(closeModalBtns).forEach(btn => {
        if (btn) btn.addEventListener('click', closeAllModals);
    });
    
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    // Transfer ownership
    if (transferPropertyBtn) transferPropertyBtn.addEventListener('click', showTransferModal);
    if (cancelTransferBtn) cancelTransferBtn.addEventListener('click', () => transferModal.style.display = 'none');
    if (confirmTransferBtn) confirmTransferBtn.addEventListener('click', handleTransferOwnership);
    if (searchUserBtn) searchUserBtn.addEventListener('click', searchUsers);

    // Admin UI event listeners
    const adminPropertiesBtn = document.getElementById('admin-properties-btn');
    const adminUsersBtn = document.getElementById('admin-users-btn');
    
    if (adminPropertiesBtn) {
        adminPropertiesBtn.addEventListener('click', () => toggleAdminSections('properties'));
    }
    
    if (adminUsersBtn) {
        adminUsersBtn.addEventListener('click', () => toggleAdminSections('users'));
    }

    // Property status filter buttons
    document.querySelectorAll('.status-filter .btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const status = this.dataset.status;
            loadAdminProperties(status);
            
            // Update active state
            document.querySelectorAll('.status-filter .btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // User role filter buttons
    document.querySelectorAll('.role-filter .btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const role = this.dataset.role;
            loadAdminUsers(role);
            
            // Update active state
            document.querySelectorAll('.role-filter .btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Reject user modal buttons
    const confirmRejectBtn = document.getElementById('confirm-reject-user');
    const cancelRejectBtn = document.getElementById('cancel-reject-user');
    
    if (confirmRejectBtn) {
        confirmRejectBtn.addEventListener('click', rejectUser);
    }
    
    if (cancelRejectBtn) {
        cancelRejectBtn.addEventListener('click', () => {
            document.getElementById('reject-user-modal').style.display = 'none';
        });
    }
}

// Load contracts
async function loadContracts() {
    try {
        // Load Property contract
        const propertyContractData = await loadContract("Property");
        if (!propertyContractData) {
            throw new Error("Failed to load Property contract");
        }

        // Initialize Web3
        const web3 = new Web3(window.ethereum);
        propertyContract = new web3.eth.Contract(propertyContractData.abi, propertyContractData.address);

        console.log("Property contract initialized:", propertyContract);
    } catch (error) {
        console.error('Error loading contracts:', error);
        showToast('Error loading smart contracts', 'error');
    }
}

async function loadContract(contractName) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/${contractName}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} for ${contractName}`);
        }
        const contractData = await response.json();
    
        const contractABI = contractData.abi;
        const networkId = Object.keys(contractData.networks)[0];
        const contractAddress = contractData.networks[networkId]?.address || 'UNKNOWN_ADDRESS';
    
        console.log(`${contractName} ABI:`, contractABI);
        console.log(`${contractName} Address:`, contractAddress);
    
        return { abi: contractABI, address: contractAddress };
    } catch (error) {
        console.error(`Error loading ${contractName} contract:`, error);
        return null;
    }
}

// Property Contract Functions
async function addLandToBlockchain(locationId, revenueDepartmentId, surveyNumber, area) {
    if (!propertyContract || !currentWalletAddress) {
        throw new Error("Contract not initialized or wallet not connected");
    }

    console.log(currentWalletAddress)

    try {
        const result = await propertyContract.methods.addLand(
            locationId,
            revenueDepartmentId,
            surveyNumber,
            currentWalletAddress,
            area
        ).send({ from: currentWalletAddress });

        // Check if the event is present in the result
        if (result.events && result.events.LandCreated) {
            // Get the property ID from the event
            const propertyId = result.events.LandCreated.returnValues.propertyId;
            return propertyId;
        } else {
            throw new Error("LandCreated event not found in transaction receipt");
        }

    } catch (error) {
        console.error("Error adding land to blockchain:", error);
        throw error;
    }
}


async function updateLandOnBlockchain(propertyId, surveyNumber, address, postalCode) {
    if (!propertyContract || !currentWalletAddress) {
        throw new Error("Contract not initialized or wallet not connected");
    }

    try {
        await propertyContract.methods.editLand(
            propertyId,
            surveyNumber,
            address,
            postalCode
        ).send({ from: currentWalletAddress });

        return true;
    } catch (error) {
        console.error("Error updating land on blockchain:", error);
        throw error;
    }
}

async function removeLandFromBlockchain(propertyId) {
    if (!propertyContract || !currentWalletAddress) {
        throw new Error("Contract not initialized or wallet not connected");
    }

    try {
        await propertyContract.methods.removeLand(propertyId)
            .send({ from: currentWalletAddress });

        return true;
    } catch (error) {
        console.error("Error removing land from blockchain:", error);
        throw error;
    }
}

async function transferLandOwnership(propertyId, newOwner) {
    console.log(propertyId)
    if (!propertyContract || !currentWalletAddress || !propertyId) {
        showToast("Transfer Error Occured !!", "error");
        throw new Error("Contract not initialized or wallet not connected");
    }

    // Validate propertyId is a positive number
    if (typeof propertyId !== 'number' || propertyId <= 0) {
        throw new Error("Invalid property ID");
    }

    // Validate newOwner is a valid Ethereum address
    if (!/^0x[a-fA-F0-9]{40}$/.test(newOwner)) {
        throw new Error("Invalid new owner address");
    }

    try {
        const result = await propertyContract.methods.updateOwner(
            propertyId,
            newOwner
        ).send({ from: currentWalletAddress });

        return result.transactionHash;
    } catch (error) {
        console.error("Error transferring land ownership:", error);
        throw error;
    }
}

async function getLandDetails(propertyId) {
    if (!propertyContract) {
        throw new Error("Contract not initialized");
    }

    try {
        const land = await propertyContract.methods.getLandDetailsAsStruct(propertyId).call();
        return land;
    } catch (error) {
        console.error("Error getting land details:", error);
        throw error;
    }
}

// Property Management Functions
async function handlePropertyRegistration(e) {
    e.preventDefault();
    
    if (!currentWalletAddress) {
        showToast('Please connect your wallet first', 'error');
        return;
    }

    // Collect form data
    const propertyData = {
        title: document.getElementById('propertyTitle').value,
        streetAddress: document.getElementById('streetAddress').value,
        postalCode: document.getElementById('postalCode').value,
        county: document.getElementById('county').value,
        plotNumber: document.getElementById('plotNumber').value,
        owner: currentWalletAddress
    };

    const formData = new FormData();
    formData.append('property', JSON.stringify(propertyData));
    
    const deedDocument = document.getElementById('deedDocument');
    if (deedDocument && deedDocument.files[0]) {
        formData.append('deedDocument', deedDocument.files[0]);
    } else {
        showToast('Title deed document is required', 'error');
        return;
    }

    const surveyPlan = document.getElementById('surveyPlan');
    if (surveyPlan && surveyPlan.files[0]) {
        formData.append('surveyPlan', surveyPlan.files[0]);
    }

    

    try {
        // For demo purposes, we'll use dummy values for location and revenue department
        const locationId = 1; // Should come from your UI/backend
        const revenueDepartmentId = 1; // Should come from your UI/backend
        const surveyNumber = propertyData.plotNumber;
        const area = 100; // Should come from your UI

        // Register property on blockchain
        showToast('Registering property on blockchain...', 'info');
        const propertyId = await addLandToBlockchain(
            locationId,
            revenueDepartmentId,
            surveyNumber,
            area
        );

        console.log(propertyId)

        // Register property on backend
        formData.append('blockchainPropertyId', propertyId);
        
        const response = await fetch(`${API_BASE_URL}/properties`, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            propertyForm.style.display = 'none';
            successMessage.style.display = 'block';
            loadUserProperties();
            showToast('Property registered successfully', 'success');
            propertyForm.reset();
            document.querySelectorAll('.file-info').forEach(el => el.textContent = '');
        } else {
            showToast(data.message || 'Property registration failed', 'error');
        }
    } catch (error) {
        console.error('Property registration error:', error);
        showToast('Error during property registration: ' + error.message, 'error');
    }
}

async function editProperty() {
    if (!currentProperty) return;
    
    const surveyNumber = document.getElementById('plotNumber').value;
    const address = document.getElementById('streetAddress').value;
    const postalCode = document.getElementById('postalCode').value;

    try {
        // Update on blockchain
        await updateLandOnBlockchain(
            currentProperty.blockchainPropertyId,
            surveyNumber,
            address,
            postalCode
        );

        // Update on backend
        const response = await fetch(`${API_BASE_URL}/properties/${currentProperty._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                plotNumber: surveyNumber,
                streetAddress: address,
                postalCode: postalCode
            })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Property updated successfully', 'success');
            propertyModal.style.display = "none";
            hidePropertyWizard();
            loadUserProperties();
        } else {
            showToast(data.message || 'Failed to update property', 'error');
        }
    } catch (error) {
        console.error('Error updating property:', error);
        showToast('Error updating property: ' + error.message, 'error');
    }
}

async function deleteProperty() {
    if (!currentProperty) return;
    
    if (confirm('Are you sure you want to delete this property?')) {
        try {
            // Delete from blockchain
            await removeLandFromBlockchain(currentProperty.blockchainPropertyId);

            // Delete from backend
            const response = await fetch(`${API_BASE_URL}/properties/${currentProperty._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                propertyModal.style.display = "none";
                loadUserProperties();
                showToast('Property deleted successfully', 'success');
            } else {
                showToast(data.message || 'Failed to delete property', 'error');
            }
        } catch (error) {
            console.error('Error deleting property:', error);
            showToast('Error deleting property: ' + error.message, 'error');
        }
    }
}

async function handleTransferOwnership() {
    const newOwner = document.getElementById('new-owner-wallet').value.trim();
    
    if (!newOwner) {
        toast.classList.add('show');
        showToast('Please select a recipient', 'error');
        return;
    }

    if (currentProperty.status === 'pending'){
        toast.classList.add('show');
        showToast('Await verification to continue', 'error')
        return
    }
    console.log(currentProperty)
    
    if (!currentProperty || !currentWalletAddress) {
        toast.classList.add('show');
        showToast('Error: Property or wallet not loaded', 'error');
        return;
    }

    try {
        // Transfer on blockchain
        const txHash = await transferLandOwnership(
            Number(currentProperty.blockchainPropertyId),
            newOwner
        );

        // Update backend
        const response = await fetch(`${API_BASE_URL}/properties/${currentProperty._id}/transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                currentOwner: currentWalletAddress,
                newOwner: newOwner,
                txHash: txHash
            })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Transfer completed successfully!', 'success');
            transferModal.style.display = 'none';
            propertyModal.style.display = 'none';
            loadUserProperties();
        } else {
            showToast('Blockchain transfer succeeded but backend update failed: ' + data.message, 'warning');
        }
    } catch (error) {
        console.error('Transfer error:', error);
        showToast('Error during transfer: ' + error.message, 'error');
    }
}

// Property UI Functions
function showTransferModal() {
    if (!currentProperty) return;
    
    // Verify ownership before showing transfer modal
    if (currentProperty.owner.toLowerCase() !== currentWalletAddress.toLowerCase()) {
        showToast('Only the property owner can transfer ownership', 'error');
        return;
    }
    
    propertyModal.style.display = 'none';
    transferModal.style.display = 'block';
    document.getElementById('search-user').value = '';
    document.getElementById('user-search-results').innerHTML = '';
    document.getElementById('selected-user').classList.add('hidden');
    document.getElementById('new-owner-wallet').value = '';
}

async function searchUsers() {
    const searchTerm = document.getElementById('search-user').value.trim();
    if (!searchTerm) {
        showToast('Please enter a name or wallet address to search', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/search?q=${searchTerm}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            renderSearchResults(data.users);
        } else {
            showToast(data.message || 'Error searching users', 'error');
        }
    } catch (error) {
        console.error('Error searching users:', error);
        showToast('Error searching users', 'error');
    }
}

function renderSearchResults(users) {
    const resultsContainer = document.getElementById('user-search-results');
    resultsContainer.innerHTML = '';
    console.log(users)

    if(currentProperty.status === "pending" || currentProperty.status === "rejected"){
        resultsContainer.innerHTML = '<div class="no-results">Property Not Veified</div>';
        return;
    }

    if (users.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">No users found</div>';
        return;
    }

    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-result-card';
        userCard.innerHTML = `
            <div class="user-avatar">${user.firstName.charAt(0)}${user.lastName.charAt(0)}</div>
            <div class="user-info">
                <div class="user-name">${user.firstName} ${user.lastName}</div>
                <div class="user-wallet">${user.walletAddress.substring(0, 6)}...${user.walletAddress.substring(38)}</div>
            </div>
            <button class="btn btn-sm btn-primary select-user" data-wallet="${user.walletAddress}" data-name="${user.firstName} ${user.lastName}">
                Select
            </button>
        `;
        
        resultsContainer.appendChild(userCard);
    });

    // Add event listeners to select buttons
    document.querySelectorAll('.select-user').forEach(btn => {
        btn.addEventListener('click', function() {
            selectUserForTransfer(
                this.dataset.wallet,
                this.dataset.name
            );
        });
    });
}

function selectUserForTransfer(walletAddress, userName) {
    const transferUserNameEl = document.getElementById('transfer-user-name');
    const transferUserWalletEl = document.getElementById('transfer-user-wallet');
    const transferUserAvatarEl = document.getElementById('transfer-user-avatar');
    const newOwnerWalletEl = document.getElementById('new-owner-wallet');
    const selectedUserEl = document.getElementById('selected-user');

    transferUserNameEl.textContent = userName;
    transferUserWalletEl.textContent = walletAddress;
    transferUserAvatarEl.textContent = userName.split(' ').map(n => n[0]).join('');
    newOwnerWalletEl.value = walletAddress;
    selectedUserEl.classList.remove('hidden');
}

// Helper Functions
function isValidEthAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function showError(id, message) {
    const errorElement = document.getElementById(id);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function hideError(id) {
    const errorElement = document.getElementById(id);
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'verified': return 'status-verified';
        case 'rejected': return 'status-rejected';
        default: return 'status-pending';
    }
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

// Wallet Functions
async function connectWallet(inputFieldId) {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            currentWalletAddress = accounts[0];
            
            // Update UI with connected wallet
            document.getElementById(inputFieldId).value = currentWalletAddress;
            
            if (document.getElementById('wallet-address-display')) {
                document.getElementById('wallet-address-display').textContent = 
                    currentWalletAddress.substring(0, 6) + '...' + currentWalletAddress.substring(38);
            }
            
            return currentWalletAddress;
        } catch (error) {
            console.error("Error connecting to MetaMask:", error);
            showToast("Failed to connect wallet. Please try again.", 'error');
            return null;
        }
    } else {
        showToast("MetaMask is not installed. Please install it to use this application.", 'error');
        return null;
    }
}

// Dashboard Functions
function showDashboard(user) {
    const fullName = `${user.firstName} ${user.lastName}`;
    
    document.getElementById('username').textContent = fullName;
    document.getElementById('user-avatar').textContent = 
        `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    
    if (document.getElementById('wallet-address-display')) {
        document.getElementById('wallet-address-display').textContent = 
            user.walletAddress.substring(0, 6) + '...' + user.walletAddress.substring(38);
    }
    
    authContainer.style.display = 'none';
    dashboardContainer.style.display = 'block';
    adminDashboard.style.display = 'none';
    
    loadUserProperties();
}

function showAdminDashboard(user) {
    const fullName = `${user.firstName} ${user.lastName}`;
    
    document.getElementById('admin-username').textContent = fullName;
    document.getElementById('admin-user-avatar').textContent = 
        `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    
    if (document.getElementById('admin-wallet-address-display')) {
        document.getElementById('admin-wallet-address-display').textContent = 
            user.walletAddress.substring(0, 6) + '...' + user.walletAddress.substring(38);
    }
    
    authContainer.style.display = 'none';
    dashboardContainer.style.display = 'none';
    adminDashboard.style.display = 'block';
    
    loadAdminProperties('verified');
}

function toggleUserDropdown() {
    userDropdown.classList.toggle('show');
}

function toggleAdminUserDropdown() {
    adminUserDropdown.classList.toggle('show');
}

// Authentication Functions
async function handleLogin() {
    const walletAddress = document.getElementById('login-wallet').value;
    const password = document.getElementById('login-password').value;
    
    if (!walletAddress) {
        showError('login-wallet-error', 'Wallet address is required');
        showToast('Wallet address is required', 'error');
        return;
    }
    
    if (!password) {
        showError('login-password-error', 'Password is required');
        showToast('Password is required', 'error');
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

        if (data.status === "success") {
            currentUser = {
                firstName: data.user.firstName,
                lastName: data.user.lastName,
                role: data.user.role,
                walletAddress: data.user.walletAddress
            };
            currentWalletAddress = walletAddress;
            
            if (data.user.role === USER_ROLES.ADMIN) {
                showAdminDashboard(currentUser);
            } else {
                showDashboard(currentUser);
            }
            showToast('Login successful', 'success');
        } else {
            showError('login-wallet-error', data.message || 'Login failed');
            showToast(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('login-wallet-error', 'Error during login. Please try again.');
        showToast('Error during login. Please try again.', 'error');
    }
}

async function handleRegister() {
    const firstName = document.getElementById('register-first-name').value.trim();
    const lastName = document.getElementById('register-last-name').value.trim();
    const walletAddress = document.getElementById('register-wallet').value.trim() || currentWalletAddress;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    const idNumber = document.getElementById('register-id-number').value.trim();
    const passportPhoto = document.getElementById('register-passport').files[0];
    const idDocument = document.getElementById('register-id-document').files[0];

    // Clear previous errors
    document.querySelectorAll('.error').forEach(el => el.textContent = '');

    // Validation
    if (!firstName) return showError('register-first-name-error', 'First name is required');
    if (!lastName) return showError('register-last-name-error', 'Last name is required');
    if (!walletAddress) return showError('register-wallet-error', 'Wallet address is required');
    if (!isValidEthAddress(walletAddress)) return showError('register-wallet-error', 'Invalid Ethereum address');
    if (!password || password.length < 6) return showError('register-password-error', 'Password must be at least 6 characters');
    if (password !== confirmPassword) return showError('register-confirm-error', 'Passwords do not match');
    if (!idNumber) return showError('register-id-error', 'ID number is required');
    if (!passportPhoto) return showError('register-passport-error', 'Passport photo is required');
    if (!idDocument) return showError('register-id-document-error', 'ID document is required');

    const registerBtn = document.getElementById('register-btn');
    const originalBtnText = registerBtn.innerHTML;
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    try {
        const formData = new FormData();
        formData.append('firstName', firstName);
        formData.append('lastName', lastName);
        formData.append('walletAddress', walletAddress);
        formData.append('password', password);
        formData.append('idNumber', idNumber);
        formData.append('passportPhoto', passportPhoto);
        formData.append('idDocument', idDocument);

        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Registration complete!', 'success');
            showLoginForm();
            document.getElementById('register-form').reset();
        } else {
            throw new Error(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast(error.message || 'Registration failed. Please try again.', 'error');
    } finally {
        registerBtn.disabled = false;
        registerBtn.innerHTML = originalBtnText;
    }
}

// Property UI Functions
function showPropertyWizard() {

    if(currentUser.status === "pending"){
        registrationWizard.style.display = "block";
        registrationWizard.innerHTML = '<div class="no-results">User Not Veified</div>';
        return;
    }else{
    propertiesList.style.display = "none";
    registrationWizard.style.display = "block";
    propertyForm.style.display = "block";
    successMessage.style.display = "none";
    navigateStep(1);
    }
}

function hidePropertyWizard() {
    propertiesList.style.display = "block";
    registrationWizard.style.display = "none";
    loadUserProperties();
}

function navigateStep(step) {
    document.querySelectorAll('.wizard-step').forEach(el => {
        el.style.display = "none";
        el.classList.remove('active');
    });

    const stepElement = document.querySelector(`.wizard-step[data-step="${step}"]`);
    stepElement.style.display = "block";
    stepElement.classList.add('active');

    document.querySelectorAll('.wizard-steps .step').forEach(el => {
        el.classList.remove('active');
        if (parseInt(el.dataset.step) <= step) {
            el.classList.add('active');
        }
    });

    if (step === 3) {
        updateReviewContent();
    }
}

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

function validateStep2() {
    let isValid = true;

    const requiredFiles = [
        'deedDocument', 'surveyPlan'
    ];

    requiredFiles.forEach(fileId => {
        const fileInput = document.getElementById(fileId);
        if (!fileInput) {
            console.error(`File input with ID ${fileId} not found`);
            return;
        }
        
        if (fileId === 'surveyPlan' && (!fileInput.files || fileInput.files.length === 0)) {
            hideError(`${fileId}-error`);
            return;
        }

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

    // Document previews
    const deedFile = document.getElementById('deedDocument').files[0];
    if (deedFile) {
        document.getElementById('deed-filename').textContent = deedFile.name;
        if (deedFile.type.includes('image')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('deed-preview').innerHTML = 
                    `<img src="${e.target.result}" alt="Title Deed Preview">`;
            };
            reader.readAsDataURL(deedFile);
        }
    }

    const surveyFile = document.getElementById('surveyPlan').files[0];
    if (surveyFile) {
        document.getElementById('survey-filename').textContent = surveyFile.name;
        if (surveyFile.type.includes('image')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('survey-preview').innerHTML = 
                    `<img src="${e.target.result}" alt="Survey Plan Preview">`;
            };
            reader.readAsDataURL(surveyFile);
        }
    }
}

// Property Loading Functions
function loadUserProperties() {
    if (!currentWalletAddress) return;

    fetch(`${API_BASE_URL}/properties?owner=${currentWalletAddress}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        renderProperties(data.properties || []);
    })
    .catch(error => {
        console.error('Error loading properties:', error);
        showToast('Error loading properties', 'error');
    });
}

function renderProperties(properties) {
    propertyCards.innerHTML = '';

    if (properties.length === 0) {
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

    properties.forEach(property => {
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

function showPropertyDetails(property) {
    currentProperty = property;
    console.log(currentProperty)
    
    document.getElementById('modal-property-title').textContent = property.title;
    document.getElementById('modal-plot-number').textContent = property.plotNumber;
    document.getElementById('modal-address').textContent = property.streetAddress;
    document.getElementById('modal-county').textContent = property.county;
    document.getElementById('modal-postal-code').textContent = property.postalCode;
    
    const statusElement = document.getElementById('modal-status');
    statusElement.textContent = property.status;
    statusElement.className = 'status-badge ' + getStatusClass(property.status);
    
    // Show/hide transfer button based on ownership
    const transferBtn = document.getElementById('transfer-property-btn');
    if (transferBtn) {
        transferBtn.style.display = (property.owner === currentWalletAddress) ? 'inline-flex' : 'none';
    }
    
    propertyModal.style.display = "block";
}

// Admin Functions
function loadAdminProperties(status) {
    adminPropertiesList.innerHTML = '<div class="loading">Loading properties...</div>';
    
    fetch(`${API_BASE_URL}/admin/properties?status=${status}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            renderAdminProperties(data.properties, status);
        } else {
            adminPropertiesList.innerHTML = `<div class="error">${data.message || 'Error loading properties'}</div>`;
        }
    })
    .catch(error => {
        console.error('Error loading properties:', error);
        adminPropertiesList.innerHTML = `<div class="error">Error loading properties</div>`;
    });
}

function renderAdminProperties(properties, status) {
    adminPropertiesList.innerHTML = '';

    if (properties.length === 0) {
        adminPropertiesList.innerHTML = `<div class="no-properties">No ${status} properties found</div>`;
        return;
    }

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
        }
        
        propertyCard.innerHTML = `
            <div class="property-header">
                <h3>${property.title}</h3>
                <span class="property-status ${status}">${status}</span>
            </div>
            <div class="property-details">
                <div class="detail-item">
                    <span class="detail-label">Owner:</span>
                    <span>${property.ownerDetails?.firstName} (${property.owner.substring(0, 12)}...${property.owner.substring(38)})</span>
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
                ${property.rejectionReason ? `
                <div class="rejection-reason">
                    <strong>Rejection Reason:</strong> ${property.rejectionReason}
                </div>
                ` : ''}
            </div>
        `;
        
        adminPropertiesList.appendChild(propertyCard);
        
        propertyCard.querySelectorAll('.verify-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const propertyId = btn.dataset.id;
                showVerifyPropertyModal(property);
                currentVerificationProperty = property;
                approvePropertyBtn.addEventListener("click", approveProperty)
                rejectPropertyBtn.addEventListener("click", approveProperty)
            });
        });
    });
}

function showVerifyPropertyModal(property) {
 
    if(property){
            currentVerificationProperty = property;
            
            document.getElementById('verify-modal-title').textContent = `Verify: ${property.title}`;
            document.getElementById('verify-owner').textContent = property.ownerDetails?.name || property.owner;
            document.getElementById('verify-title').textContent = property.title;
            document.getElementById('verify-plot-number').textContent = property.plotNumber;
            
            verifyPropertyModal.style.display = "block";
        } else {
            console.log("Failed to show modal")
            showToast('Failed to load property details', 'error');
        }
   
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
            showToast('Property approved successfully', 'success');
            verifyPropertyModal.style.display = 'none';
            loadAdminProperties('verified');
        } else {
            showToast(data.message || 'Failed to approve property', 'error');
        }
    })
    .catch(error => {
        console.error('Error approving property:', error);
        showToast('Error approving property', 'error');
    });
}

function rejectProperty() {
    if (!currentVerificationProperty) return;
    
    const reason = document.getElementById('reject-reason').value;
    if (!reason) {
        showToast('Please provide a rejection reason', 'error');
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
            reason: reason
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showToast('Property rejected successfully', 'success');
            verifyPropertyModal.style.display = 'none';
            document.getElementById('reject-reason').value = '';
            loadAdminProperties('verified');
        } else {
            showToast(data.message || 'Failed to reject property', 'error');
        }
    })
    .catch(error => {
        console.error('Error rejecting property:', error);
        showToast('Error rejecting property', 'error');
    });
}



async function handleLogout() {
    try {
        await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        // Reset application state
        currentUser = null;
        currentWalletAddress = null;
        currentProperty = null;
        
        // Reset forms
        document.getElementById('login-wallet').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('register-first-name').value = '';
        document.getElementById('register-last-name').value = '';
        document.getElementById('register-wallet').value = '';
        document.getElementById('register-password').value = '';
        document.getElementById('register-confirm').value = '';
        
        // Hide all containers
        dashboardContainer.style.display = 'none';
        adminDashboard.style.display = 'none';
        authContainer.style.display = 'flex';
        
        // Close all modals
        closeAllModals();
        
        // Reset dropdowns
        if (userDropdown) userDropdown.classList.remove('show');
        if (adminUserDropdown) adminUserDropdown.classList.remove('show');
        
        // Show login form
        showLoginForm();
        
        showToast('Logged out successfully', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Error during logout', 'error');
    }
}

// Utility Functions
function initializeCountyDropdown() {
    const countySelect = document.getElementById('county');
    const kenyanCounties = [
        "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita-Taveta", "Garissa", 
        "Wajir", "Mandera", "Marsabit", "Isiolo", "Meru", "Tharaka-Nithi", "Embu", 
        "Kitui", "Machakos", "Makueni", "Nyandarua", "Nyeri", "Kirinyaga", "Murang'a", 
        "Kiambu", "Turkana", "West Pokot", "Samburu", "Trans Nzoia", "Uasin Gishu", 
        "Elgeyo-Marakwet", "Nandi", "Baringo", "Laikipia", "Nakuru", "Narok", "Kajiado", 
        "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia", "Siaya", "Kisumu", 
        "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi"
    ];
    
    kenyanCounties.forEach(county => {
        const option = document.createElement('option');
        option.value = county;
        option.textContent = county;
        countySelect.appendChild(option);
    });
}

function showLoginForm() {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.style.display = "block";
    registerForm.style.display = "none";
}

function showRegisterForm() {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    loginForm.style.display = "none";
    registerForm.style.display = "block";
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function showProfileModal() {
    if (!currentUser) return;
    
    const fullName = `${currentUser.firstName} ${currentUser.lastName}`;
    document.getElementById('profile-name').textContent = fullName;
    document.getElementById('profile-wallet').textContent = currentUser.walletAddress;
    
    let roleText = 'Client';
    if (currentUser.role === USER_ROLES.ADMIN) roleText = 'Admin';
    else if (currentUser.role === USER_ROLES.STAFF) roleText = 'Staff';
    
    document.getElementById('profile-role').textContent = roleText;
    document.getElementById('profile-avatar').textContent = 
        currentUser.firstName.charAt(0) + currentUser.lastName.charAt(0);
    
    profileModal.style.display = "block";
}

// Admin User Management Functions
function loadAdminUsers(role = 'all') {
    const adminUsersList = document.getElementById('admin-users-list');
    if (!adminUsersList) return;

    adminUsersList.innerHTML = '<div class="loading">Loading users...</div>';
    
    let url = `${API_BASE_URL}/admin/users`;
    if (role !== 'all') {
        url += `?role=${role}`;
    }

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
        adminUsersList.innerHTML = `<div class="error">Error loading users</div>`;
    });
}

function renderAdminUsers(users) {
    const adminUsersList = document.getElementById('admin-users-list');
    adminUsersList.innerHTML = '';

    if (users.length === 0) {
        adminUsersList.innerHTML = '<div class="no-users">No users found</div>';
        return;
    }

    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'admin-user-card';
        
        let roleText = 'Client';
        if (user.userRole === USER_ROLES.ADMIN) roleText = 'Admin';
        else if (user.userRole === USER_ROLES.STAFF) roleText = 'Staff';

        let statusBadge = '';
        if (user.status === 'pending') {
            statusBadge = `
                <div class="user-status pending">
                    <span>Pending Approval</span>
                    <button class="btn btn-sm btn-success approve-user-btn" data-id="${user._id}">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-sm btn-danger reject-user-btn" data-id="${user._id}">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            `;
        } else {
            statusBadge = `
                <div class="user-status ${user.status}">
                    ${user.status === 'active' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-times-circle"></i>'}
                    ${user.status}
                </div>
            `;
        }

        userCard.innerHTML = `
            <div class="user-header">
                <div class="user-avatar">
                    ${user.firstName.charAt(0)}${user.lastName.charAt(0)}
                </div>
                <div class="user-info">
                    <h3>${user.firstName} ${user.lastName}</h3>
                    <div class="user-wallet">${user.walletAddress.substring(0, 6)}...${user.walletAddress.substring(38)}</div>
                </div>
            </div>
            <div class="user-details">
                <div class="detail-item">
                    <span class="detail-label">Role:</span>
                    <span>${roleText}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">ID Number:</span>
                    <span>${user.idNumber || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">KYC Verified:</span>
                    <span class="kyc-status ${user.kycVerified ? 'verified' : 'not-verified'}">
                        ${user.kycVerified ? 'Yes' : 'No'}
                    </span>
                </div>
            </div>
            ${statusBadge}
            <div class="user-actions">
                <button class="btn btn-sm btn-primary view-user-btn" data-id="${user._id}">
                    <i class="fas fa-eye"></i> View Details
                </button>
            </div>
        `;
        
        adminUsersList.appendChild(userCard);

        // Add event listeners
        if (user.status === 'pending') {
            userCard.querySelector('.approve-user-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                approveUser(user._id);
            });
            
            userCard.querySelector('.reject-user-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                showRejectUserModal(user._id);
            });
        }
        
        userCard.querySelector('.view-user-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            showUserDetailsModal(user._id);
        });
    });
}

function approveUser(userId) {
    fetch(`${API_BASE_URL}/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showToast('User approved successfully', 'success');
            loadAdminUsers();
        } else {
            showToast(data.message || 'Failed to approve user', 'error');
        }
    })
    .catch(error => {
        console.error('Error approving user:', error);
        showToast('Error approving user', 'error');
    });
}

function showRejectUserModal(userId) {
    const modal = document.getElementById('reject-user-modal');
    if (!modal) return;

    modal.dataset.userId = userId;
    modal.style.display = 'block';
}

function rejectUser() {
    const modal = document.getElementById('reject-user-modal');
    const userId = modal.dataset.userId;
    const reason = document.getElementById('reject-user-reason').value;

    if (!reason) {
        showToast('Please provide a rejection reason', 'error');
        return;
    }

    fetch(`${API_BASE_URL}/admin/users/${userId}/reject`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showToast('User rejected successfully', 'success');
            modal.style.display = 'none';
            document.getElementById('reject-user-reason').value = '';
            loadAdminUsers();
        } else {
            showToast(data.message || 'Failed to reject user', 'error');
        }
    })
    .catch(error => {
        console.error('Error rejecting user:', error);
        showToast('Error rejecting user', 'error');
    });
}

function showUserDetailsModal(userId) {
    fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            const user = data.user;
            const modal = document.getElementById('user-details-modal');
            
            document.getElementById('user-details-name').textContent = `${user.firstName} ${user.lastName}`;
            document.getElementById('user-details-wallet').textContent = user.walletAddress;
            
            let roleText = 'Client';
            if (user.userRole === USER_ROLES.ADMIN) roleText = 'Admin';
            else if (user.userRole === USER_ROLES.STAFF) roleText = 'Staff';
            
            document.getElementById('user-details-role').textContent = roleText;
            document.getElementById('user-details-id').textContent = user.idNumber || 'N/A';
            document.getElementById('user-details-status').textContent = user.status;
            document.getElementById('user-details-kyc').textContent = user.kycVerified ? 'Verified' : 'Not Verified';
            
            // Load passport photo if available
            const passportImg = document.getElementById('user-details-passport');
            
                fetch(`${API_BASE_URL}/admin/users/${userId}/passportPhoto`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
                .then(response =>{
                    console.log(response)
                    passportImg.style.display = 'block';
                passportImg.src = response;
                } )
                .then(data => {
                passportImg.style.display = 'block';
                passportImg.src = data;
                });
            
            
            // Load ID document if available
            const idDocImg = document.getElementById('user-details-id-document');

                fetch(`${API_BASE_URL}/admin/users/${userId}/idDocument`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
                .then(response => response.json())
                .then(data => {
                    console.log(data)
                idDocImg.style.display = 'block';
                idDocImg.src = data;
                });
            
            
            modal.style.display = 'block';
        } else {
            showToast(data.message || 'Failed to load user details', 'error');
        }
    })
    .catch(error => {
        console.error('Error loading user details:', error);
        showToast('Error loading user details', 'error');
    });
}

// UI Section Toggling Functions
function toggleAdminSections(section) {
    const adminSections = {
        'properties': document.getElementById('admin-properties-section'),
        'users': document.getElementById('admin-users-section')
    };

    // Hide all sections first
    Object.values(adminSections).forEach(sec => {
        if (sec) sec.style.display = 'none';
    });

    // Show the selected section
    if (adminSections[section]) {
        adminSections[section].style.display = 'block';
        
        // Load appropriate data
        if (section === 'properties') {
            loadAdminProperties('verified');
        } else if (section === 'users') {
            loadAdminUsers();
        }
    }

    // Update active button state
    const buttons = {
        'properties': document.getElementById('admin-properties-btn'),
        'users': document.getElementById('admin-users-btn')
    };

    Object.values(buttons).forEach(btn => {
        if (btn) btn.classList.remove('active');
    });

    if (buttons[section]) {
        buttons[section].classList.add('active');
    }
}

// Initialize Admin UI
function initializeAdminUI() {
    // Add event listeners for admin section toggling
    const adminPropertiesBtn = document.getElementById('admin-properties-btn');
    const adminUsersBtn = document.getElementById('admin-users-btn');
    
    if (adminPropertiesBtn) {
        adminPropertiesBtn.addEventListener('click', () => toggleAdminSections('properties'));
    }
    
    if (adminUsersBtn) {
        adminUsersBtn.addEventListener('click', () => toggleAdminSections('users'));
    }

    // Add event listener for reject user modal
    const confirmRejectBtn = document.getElementById('confirm-reject-user');
    if (confirmRejectBtn) {
        confirmRejectBtn.addEventListener('click', rejectUser);
    }

    // Initialize with properties section shown by default
    toggleAdminSections('properties');
}

// Update the showAdminDashboard function to include admin UI initialization
function showAdminDashboard(user) {
    const fullName = `${user.firstName} ${user.lastName}`;
    
    document.getElementById('admin-username').textContent = fullName;
    document.getElementById('admin-user-avatar').textContent = 
        user.firstName.charAt(0)+user.lastName.charAt(0);
    
    if (document.getElementById('admin-wallet-address-display')) {
        document.getElementById('admin-wallet-address-display').textContent = 
        user.walletAddress.substring(0, 6) + '...' + user.walletAddress.substring(38);
    }
    
    authContainer.style.display = 'none';
    dashboardContainer.style.display = 'none';
    adminDashboard.style.display = 'block';
    
    // Initialize admin UI components
    initializeAdminUI();
    loadAdminProperties('verified');
}