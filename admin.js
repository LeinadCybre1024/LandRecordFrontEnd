// Admin Dashboard JavaScript
let propertyContract;
let landRegistryContract;
let transferOfOwnershipContract;
let usersContract;
let web3;
let currentAccount;
let isAuthenticated = false;

// Initialize the application
async function init() {
    if (typeof window.ethereum === 'undefined') {
        showError('Please install MetaMask to use this application');
        return;
    }

    try {
        // Initialize Web3
        web3 = new Web3(window.ethereum);
        
        // Initialize contracts
        await initializeContracts();
        
        setupEventListeners();
        
        // Check if user is already authenticated
        const token = localStorage.getItem('adminToken');
        if (token) {
            try {
                await connectWallet();
                await authenticateAdmin();
            } catch (error) {
                console.error('Authentication failed:', error);
                localStorage.removeItem('adminToken');
            }
        }
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize application');
    }
}

async function initializeContracts() {
    try {
        // Load all contract data
        await Promise.all([
            loadContract("Property"),
            loadContract("LandRegistry"),
            loadContract("TransferOfOwnership"),
            loadContract("Users")
        ]);
        console.log("All contracts initialized successfully");
    } catch (error) {
        console.error("Error initializing contracts:", error);
        throw error;
    }
}

async function loadContract(contractName) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/${contractName}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const contractData = await response.json();
        
        // Store contract data in localStorage
        localStorage.setItem(`${contractName}_ContractABI`, JSON.stringify(contractData.abi));
        const networkId = Object.keys(contractData.networks)[0];
        const address = contractData.networks[networkId].address;
        localStorage.setItem(`${contractName}_ContractAddress`, address);
        
        console.log(`${contractName} Contract loaded:`, {
            address: address,
            abi: contractData.abi
        });
        
        // Initialize contract instance
        switch(contractName) {
            case "Property":
                propertyContract = new web3.eth.Contract(contractData.abi, address);
                break;
            case "LandRegistry":
                landRegistryContract = new web3.eth.Contract(contractData.abi, address);
                break;
            case "TransferOfOwnership":
                transferOfOwnershipContract = new web3.eth.Contract(contractData.abi, address);
                break;
            case "Users":
                usersContract = new web3.eth.Contract(contractData.abi, address);
                break;
        }
        
        return { abi: contractData.abi, address };
    } catch (error) {
        console.error(`Error loading ${contractName} contract:`, error);
        throw error;
    }
}

// Setup event listeners
function setupEventListeners() {
    const connectWalletBtn = document.getElementById('connect-wallet-btn');
    const loginBtn = document.getElementById('login-btn');
    const addUserBtn = document.getElementById('addUserBtn');
    const approveUserBtn = document.getElementById('approveUserBtn');
    const rejectUserBtn = document.getElementById('rejectUserBtn');
    
    connectWalletBtn.addEventListener('click', connectWallet);
    loginBtn.addEventListener('click', handleLogin);
    
    // User dropdown and logout
    document.getElementById('userMenuBtn')?.addEventListener('click', toggleUserDropdown);
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    document.getElementById('profileBtn')?.addEventListener('click', showProfile);
    document.getElementById('changePasswordBtn')?.addEventListener('click', showChangePasswordModal);
    document.getElementById('submitPasswordChange')?.addEventListener('click', handlePasswordChange);
    
    // Property verification buttons
    document.getElementById('verifyProperty')?.addEventListener('click', verifySelectedProperty);
    document.getElementById('rejectProperty')?.addEventListener('click', rejectSelectedProperty);
    
    // User form toggle
    const toggleUserFormBtn = document.getElementById('toggleUserFormBtn');
    if (toggleUserFormBtn) {
        toggleUserFormBtn.addEventListener('click', toggleUserForm);
    }

    const cancelAddUserBtn = document.getElementById('cancelAddUserBtn');
    if (cancelAddUserBtn) {
        cancelAddUserBtn.addEventListener('click', toggleUserForm);
    }
    
    if (addUserBtn) {
        addUserBtn.addEventListener('click', addNewUser);
    }
    
    if (approveUserBtn) {
        approveUserBtn.addEventListener('click', () => {
            const userId = document.getElementById('userModal').dataset.userId;
            approveUser(userId);
        });
    }
    
    if (rejectUserBtn) {
        rejectUserBtn.addEventListener('click', () => {
            const userId = document.getElementById('userModal').dataset.userId;
            rejectUser(userId);
        });
    }
    
    // Search functionality
    const searchInput = document.getElementById('searchProperty');
    const searchBtn = document.getElementById('searchBtn');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal();
        }
    });
}

// Connect wallet
async function connectWallet() {
    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        currentAccount = accounts[0];
        
        // Update UI
        const walletInput = document.getElementById('login-wallet');
        walletInput.value = currentAccount;
        
        return true;
    } catch (error) {
        console.error('Failed to connect wallet:', error);
        showError('Failed to connect wallet. Please try again.');
        return false;
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const password = document.getElementById('login-password').value;
    
    if (!currentAccount) {
        showError('Please connect your wallet first');
        return;
    }
    
    if (!password) {
        showError('Please enter your password');
        return;
    }
    
    try {
        // Verify admin credentials
        const response = await fetch('http://127.0.0.1:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                walletAddress: currentAccount,
                password: password
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Login failed');
        }
        
        // Check if user is admin
        if (result.user.role !== '12') { // 12 is admin role code
            throw new Error('You do not have admin privileges');
        }
        
        // Store token and authenticate
        localStorage.setItem('adminToken', result.token);
        await authenticateAdmin();
    } catch (error) {
        console.error('Login failed:', error);
        showError(error.message || 'Login failed. Please check your credentials.');
    }
}

// Authenticate admin
async function authenticateAdmin() {
    try {
        // Show dashboard and hide auth container
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('admin-dashboard').classList.remove('hidden');
        
        // Load user info with updated fetch configuration
        const response = await fetch('http://127.0.0.1:5000/profile', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'Content-Type': 'application/json'
            },body: JSON.stringify({
                currentWalletAddress: currentAccount,
            })
        });
        
        const userData = await response.json();
        
        if (!response.ok) {
            throw new Error(userData.message || 'Failed to load user data');
        }
        
        if (userData.user) {
            document.getElementById('userName').textContent = userData.user.firstName || 'Admin';
        }
        
        // Load dashboard data
        await loadDashboardData();
        await loadUserList();
        
        isAuthenticated = true;
    } catch (error) {
        console.error('Authentication failed:', error);
        showError('Authentication failed. Please try again.');
        throw error;
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Fetch property stats from API
        const response = await fetch('http://127.0.0.1:5000/admin/properties');
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to load properties');
        }
        
        console.log(data); // This should show {properties: Array(...), status: 'success'}
        
        // Access the properties array from the response object
        const properties = data.properties || [];
        
        // Calculate stats
        const totalProperties = properties.length;
        const verifiedProperties = properties.filter(p => p.status === 'verified').length;
        const pendingProperties = properties.filter(p => p.status === 'pending').length;
        
        // Update UI
        document.getElementById('totalProperties').textContent = totalProperties;
        document.getElementById('verifiedProperties').textContent = verifiedProperties;
        document.getElementById('pendingProperties').textContent = pendingProperties;
        
        await loadPropertyList();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data');
    }
}

// Load property list
async function loadPropertyList(searchTerm = '') {
    try {
        const propertyTableBody = document.getElementById('propertyTableBody');
        propertyTableBody.innerHTML = '';

        // Fetch properties from API
        let url = 'http://127.0.0.1:5000/admin/properties';
        if (searchTerm) {
            url = `http://127.0.0.1:5000/properties/search?plotNumber=${encodeURIComponent(searchTerm)}`;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to load properties');
        }
        
        // Handle the response structure correctly
        let properties = [];
        if (result.properties) {
            properties = result.properties; // For the admin/properties endpoint
        } else if (result.property) {
            properties = [result.property]; // For single property search
        } else if (Array.isArray(result)) {
            properties = result; // If the API returns array directly
        }
        
        console.log('Properties:', properties); // Debug log
        
        if (properties.length === 0) {
            propertyTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No properties found</td></tr>';
            return;
        }
        
        // Populate table
        properties.forEach(property => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${property.blockchainPropertyId || 'N/A'}</td>
                <td>${property.title || 'Untitled'}</td>
                <td>${property.owner || 'Unknown'}</td>
                <td>
                    <span class="status-badge ${property.status || 'unknown'}">
                        ${property.status ? property.status.charAt(0).toUpperCase() + property.status.slice(1) : 'Unknown'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-primary btn-sm view-btn" data-id="${property._id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${property.status === 'pending' ? `
                    <button class="btn btn-success btn-sm verify-btn" data-id="${property._id}">
                        <i class="fas fa-check"></i> Verify
                    </button>
                    <button class="btn btn-danger btn-sm reject-btn" data-id="${property._id}">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    ` : ''}
                </td>
            `;
            
            propertyTableBody.appendChild(row);
            
            // Add event listeners to buttons
            row.querySelector('.view-btn').addEventListener('click', () => showPropertyDetails(property._id));
            if (property.status === 'pending') {
                const verifyBtn = row.querySelector('.verify-btn');
                const rejectBtn = row.querySelector('.reject-btn');
                if (verifyBtn) {
                    verifyBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        verifyProperty(property._id);
                    });
                }
                if (rejectBtn) {
                    rejectBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        rejectProperty(property._id);
                    });
                }
            }
        });
    } catch (error) {
        console.error('Error loading property list:', error);
        showError('Failed to load properties');
    }
}

// Handle search
async function handleSearch() {
    const searchTerm = document.getElementById('searchProperty').value.trim();
    await loadPropertyList(searchTerm);
}

// Show property details in modal
async function showPropertyDetails(propertyId) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/admin/properties/${propertyId}`);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to load property details');
        }
        
        const property = result.property || result;
        
        // Populate modal
        const propertyDetails = document.getElementById('propertyDetails');
        propertyDetails.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">Title:</span>
                <span>${property.title || 'Untitled'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Owner:</span>
                <span>${property.owner}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Plot Number:</span>
                <span>${property.plotNumber}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Address:</span>
                <span>${property.streetAddress}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">County:</span>
                <span>${property.county}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="status-badge ${property.status}">
                    ${property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                </span>
            </div>
            <div class="document-links">
                <a href="http://127.0.0.1:5000/properties/${property._id}/deed" target="_blank" class="btn btn-secondary">
                    <i class="fas fa-file-pdf"></i> View Deed
                </a>
                ${property.surveyPlan ? `
                <a href="http://127.0.0.1:5000/properties/${property._id}/survey" target="_blank" class="btn btn-secondary">
                    <i class="fas fa-file-image"></i> View Survey
                </a>
                ` : ''}
            </div>
        `;
        
        // Store current property ID in modal for verification
        document.getElementById('propertyModal').dataset.propertyId = property._id;
        
        // Update modal actions based on property status
        const modalActions = document.querySelector('#propertyModal .modal-actions');
        if (property.status === 'pending') {
            modalActions.innerHTML = `
                <button class="btn btn-primary" id="verifyProperty">Verify Property</button>
                <button class="btn btn-secondary" id="rejectProperty">Reject Property</button>
            `;
            
            // Re-add event listeners
            document.getElementById('verifyProperty').addEventListener('click', verifySelectedProperty);
            document.getElementById('rejectProperty').addEventListener('click', rejectSelectedProperty);
        } else {
            modalActions.innerHTML = ''; // Hide buttons for non-pending properties
        }
        
        // Show modal
        document.getElementById('propertyModal').style.display = 'block';
    } catch (error) {
        console.error('Error showing property details:', error);
        showError('Failed to load property details');
    }
}

/**
 * Verifies the currently selected property (from the modal)
 */
function verifySelectedProperty() {
    const propertyId = document.getElementById('propertyModal').dataset.propertyId;
    if (propertyId) {
        verifyProperty(propertyId);
    } else {
        showError('No property selected for verification');
    }
}

/**
 * Rejects the currently selected property (from the modal)
 */
function rejectSelectedProperty() {
    const propertyId = document.getElementById('propertyModal').dataset.propertyId;
    if (propertyId) {
        rejectProperty(propertyId);
    } else {
        showError('No property selected for rejection');
    }
}

/**
 * Verifies a property by ID
 */
async function verifyProperty(propertyId) {
    try {
        if (!confirm('Are you sure you want to verify this property?')) {
            return;
        }
        
        const response = await fetch(`http://127.0.0.1:5000/admin/properties/${propertyId}/verify/${currentAccount}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({
                action: 'approve'
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to verify property');
        }
        
        showSuccess('Property verified successfully');
        await loadDashboardData();
        closeModal();
    } catch (error) {
        console.error('Error verifying property:', error);
        showError(error.message || 'Failed to verify property');
    }
}

/**
 * Rejects a property by ID with a reason
 */
async function rejectProperty(propertyId) {
    try {
        const reason = prompt('Please enter the reason for rejection:');
        if (!reason) {
            return;
        }
        
        const response = await fetch(`http://127.0.0.1:5000/admin/properties/${propertyId}/verify/${currentAccount}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({
                action: 'reject',
                reason: reason
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to reject property');
        }
        
        showSuccess('Property rejected successfully');
        await loadDashboardData();
        closeModal();
    } catch (error) {
        console.error('Error rejecting property:', error);
        showError(error.message || 'Failed to reject property');
    }
}

// Load user list
async function loadUserList() {
    try {
        const response = await fetch('http://127.0.0.1:5000/admin/users');
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to load users');
        }
        
        const userTableBody = document.getElementById('userTableBody');
        userTableBody.innerHTML = '';
        
        result.users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.walletAddress}</td>
                <td>${getRoleName(user.userRole)}</td>
                <td>
                    <span class="status-badge ${user.status === 'active' ? 'active' : 'pending'}">
                        ${user.status === 'active' ? 'Active' : 'Pending'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-primary btn-sm view-user-btn" data-id="${user._id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${user.status === 'pending' ? `
                    <button class="btn btn-success btn-sm approve-user-btn" data-id="${user._id}">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-danger btn-sm reject-user-btn" data-id="${user._id}">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    ` : ''}
                </td>
            `;
            
            userTableBody.appendChild(row);
            
            // Add event listeners
            row.querySelector('.view-user-btn').addEventListener('click', () => showUserDetails(user._id));
            if (user.status === 'pending') {
                row.querySelector('.approve-user-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    approveUser(user._id);
                });
                row.querySelector('.reject-user-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    rejectUser(user._id);
                });
            }
        });
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users');
    }
}

function getRoleName(roleCode) {
    const roles = {
        '12': 'Admin',
        '34': 'Client',
        '56': 'Staff'
    };
    return roles[roleCode] || roleCode;
}

// Show user details
async function showUserDetails(userId) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/admin/users/${userId}`);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to load user details');
        }
        
        const user = result.user;
        
        // Populate modal
        const userDetails = document.getElementById('userDetails');
        userDetails.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span>${user.firstName} ${user.lastName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Wallet Address:</span>
                <span>${user.walletAddress}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Role:</span>
                <span>${getRoleName(user.userRole)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="status-badge ${user.status === 'active' ? 'active' : 'pending'}">
                    ${user.status === 'active' ? 'Active' : 'Pending'}
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">ID Number:</span>
                <span>${user.idNumber || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">KYC Verified:</span>
                <span>${user.kycVerified ? 'Yes' : 'No'}</span>
            </div>
            <div class="document-links">
                <a href="http://127.0.0.1:5000/admin/users/${userId}/passportPhoto" target="_blank" class="btn btn-secondary">
                    <i class="fas fa-id-card"></i> View Passport
                </a>
                <a href="http://127.0.0.1:5000/admin/users/${userId}/idDocument" target="_blank" class="btn btn-secondary">
                    <i class="fas fa-file-alt"></i> View ID Document
                </a>
            </div>
        `;
        
        // Store current user ID in modal
        document.getElementById('userModal').dataset.userId = userId;
        
        // Show/hide action buttons based on status
        const approveBtn = document.getElementById('approveUserBtn');
        const rejectBtn = document.getElementById('rejectUserBtn');
        
        if (user.status === 'pending') {
            approveBtn.style.display = 'inline-block';
            rejectBtn.style.display = 'inline-block';
        } else {
            approveBtn.style.display = 'none';
            rejectBtn.style.display = 'none';
        }
        
        // Show modal
        document.getElementById('userModal').style.display = 'block';
    } catch (error) {
        console.error('Error showing user details:', error);
        showError('Failed to load user details');
    }
}

// Approve user
async function approveUser(userId) {
    try {
        if (!confirm('Are you sure you want to approve this user?')) {
            return;
        }
        
        const response = await fetch(`http://127.0.0.1:5000/admin/users/${userId}/approve`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to approve user');
        }
        
        showSuccess('User approved successfully');
        await loadUserList();
        closeModal();
    } catch (error) {
        console.error('Error approving user:', error);
        showError(error.message || 'Failed to approve user');
    }
}

// Reject user
async function rejectUser(userId) {
    try {
        const reason = prompt('Please enter the reason for rejection:');
        if (!reason) return;
        
        const response = await fetch(`http://127.0.0.1:5000/admin/users/${userId}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to reject user');
        }
        
        showSuccess('User rejected successfully');
        await loadUserList();
        closeModal();
    } catch (error) {
        console.error('Error rejecting user:', error);
        showError(error.message || 'Failed to reject user');
    }
}

// Add new user
async function addNewUser() {
    try {
        const firstName = document.getElementById('newUserFirstName').value;
        const lastName = document.getElementById('newUserLastName').value;
        const walletAddress = document.getElementById('newUserWallet').value;
        const password = document.getElementById('newUserPassword').value;
        const role = document.getElementById('newUserRole').value;
        
        if (!firstName || !lastName || !walletAddress || !password || !role) {
            showError('All fields are required');
            return;
        }
        
        const response = await fetch('http://127.0.0.1:5000/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName,
                lastName,
                walletAddress,
                password,
                userRole: role
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to create user');
        }
        
        showSuccess('User created successfully');
        document.getElementById('newUserFirstName').value = '';
        document.getElementById('newUserLastName').value = '';
        document.getElementById('newUserWallet').value = '';
        document.getElementById('newUserPassword').value = '';
        await loadUserList();
    } catch (error) {
        console.error('Error adding user:', error);
        showError(error.message || 'Failed to create user');
    }
}

// Close modal
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Show success message
function showSuccess(message) {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

// Show error message
function showError(message) {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => toast.remove());
    }, 5000); // Longer display for errors
}

// Create toast container if it doesn't exist
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '1000';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    document.body.appendChild(container);
    return container;
}

// User dropdown functions
function toggleUserDropdown() {
    const dropdown = document.querySelector('.dropdown-content');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

async function handleLogout() {
    try {
        // Call logout API
        const response = await fetch('http://127.0.0.1:5000/logout', {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error('Logout failed');
        }
        
        // Clear local storage and session
        localStorage.removeItem('adminToken');
        sessionStorage.clear();
        
        // Redirect to login page
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        showError('Failed to logout. Please try again.');
    }
}

async function showProfile() {
    try {
        const response = await fetch('http://127.0.0.1:5000/check-session',{
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'Content-Type': 'application/json'
            },body: JSON.stringify({
                currentWalletAddress: currentAccount,
            })
        });
        const result = await response.json();
        
        if (!response.ok || !result.authenticated) {
            throw new Error('Not authenticated');
        }
        
        const user = result.user;
        
        // Populate profile modal
        const profileDetails = document.getElementById('profileDetails');
        profileDetails.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span>${user.firstName} ${user.lastName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Wallet Address:</span>
                <span>${user.walletAddress}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Role:</span>
                <span>${getRoleName(user.role)}</span>
            </div>
        `;
        
        // Show modal
        document.getElementById('profileModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile');
    }
}

function showChangePasswordModal() {
    // Clear any previous values and errors
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('passwordChangeError').textContent = '';
    
    // Show modal
    document.getElementById('changePasswordModal').style.display = 'block';
}

async function handlePasswordChange() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorElement = document.getElementById('passwordChangeError');
    
    errorElement.textContent = '';
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        errorElement.textContent = 'All fields are required';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        errorElement.textContent = 'New passwords do not match';
        return;
    }
    
    try {
        const response = await fetch('http://127.0.0.1:5000/profile/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentWalletAddress: currentAccount,
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Password change failed');
        }
        
        showSuccess('Password changed successfully');
        document.getElementById('changePasswordModal').style.display = 'none';
    } catch (error) {
        console.error('Error changing password:', error);
        errorElement.textContent = error.message || 'Failed to change password';
    }
}

function toggleUserForm() {
    const addUserForm = document.getElementById('addUserForm');
    addUserForm.classList.toggle('hidden');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

