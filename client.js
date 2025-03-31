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

// Wallet connection buttons
if (connectWalletBtnLogin) {
    connectWalletBtnLogin.addEventListener('click', () => connectWallet('login-wallet'));
}
if (connectWalletBtnRegister) {
    connectWalletBtnRegister.addEventListener('click', () => connectWallet('register-wallet'));
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!userBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove('show');
    }
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

function toggleUserDropdown() {
    userDropdown.classList.toggle('show');
}

async function handleLogout() {
    try {
        await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        
        currentUser = null;
        currentWalletAddress = null;
        dashboardContainer.style.display = 'none';
        authContainer.style.display = 'flex';
        
        // Reset forms
        document.getElementById('login-wallet').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('register-name').value = '';
        document.getElementById('register-wallet').value = '';
        document.getElementById('register-password').value = '';
        document.getElementById('register-confirm').value = '';
        
        // Show login tab
        loginTab.click();
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
    loadUsersContract();
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