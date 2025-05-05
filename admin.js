// Admin Dashboard JavaScript
let propertyContract;
let landRegistryContract;
let transferOwnershipContract;
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
            loadContract("TransferOwnership"),
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
            case "TransferOwnership":
                transferOwnershipContract = new web3.eth.Contract(contractData.abi, address);
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
    
    connectWalletBtn.addEventListener('click', connectWallet);
    loginBtn.addEventListener('click', handleLogin);
    
    // Search functionality
    const searchInput = document.getElementById('searchProperty');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
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
        // Here you would typically verify the admin's credentials
        // For now, we'll just check if the wallet is connected
        await authenticateAdmin();
    } catch (error) {
        console.error('Login failed:', error);
        showError('Login failed. Please check your credentials.');
    }
}

// Authenticate admin
async function authenticateAdmin() {
    try {
        // Load dashboard data
        await loadDashboardData();
        
        isAuthenticated = true;
    } catch (error) {
        console.error('Authentication failed:', error);
        throw error;
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const totalProperties = await propertyContract.methods.getTotalProperties().call();
        const verifiedProperties = await propertyContract.methods.getVerifiedProperties().call();
        const pendingVerifications = await propertyContract.methods.getPendingVerifications().call();
        
        // Update UI
        document.getElementById('totalProperties').textContent = totalProperties;
        document.getElementById('verifiedProperties').textContent = verifiedProperties;
        document.getElementById('pendingVerifications').textContent = pendingVerifications;
        
        await loadPropertyList();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data');
    }
}

// Load property list
async function loadPropertyList() {
    try {
        const propertyTable = document.getElementById('propertyTable');
        const tbody = propertyTable.querySelector('tbody');
        tbody.innerHTML = '';

        const totalProperties = await propertyContract.methods.getTotalProperties().call();
        
        for (let i = 0; i < totalProperties; i++) {
            const property = await propertyContract.methods.getProperty(i).call();
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${i}</td>
                <td>${property.title}</td>
                <td>${property.owner}</td>
                <td>${property.isVerified ? 'Verified' : 'Pending'}</td>
                <td>
                    <button class="btn btn-primary" onclick="showPropertyDetails(${i})">View</button>
                    <button class="btn btn-danger" onclick="deleteProperty(${i})">Delete</button>
                </td>
            `;
            
            tbody.appendChild(row);
        }
    } catch (error) {
        console.error('Error loading property list:', error);
        throw error;
    }
}

// Show property details
async function showPropertyDetails(propertyId) {
    try {
        const property = await propertyContract.methods.getProperty(propertyId).call();
        const modal = document.getElementById('propertyDetailsModal');
        
        document.getElementById('modalPropertyId').textContent = propertyId;
        document.getElementById('modalTitle').textContent = property.title;
        document.getElementById('modalOwner').textContent = property.owner;
        document.getElementById('modalStatus').textContent = property.isVerified ? 'Verified' : 'Pending';
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error showing property details:', error);
        showError('Failed to load property details');
    }
}

// Verify property
async function verifyProperty(propertyId) {
    try {
        await propertyContract.methods.verifyProperty(propertyId).send({ from: currentAccount });
        await loadDashboardData();
        closeModal();
        showSuccess('Property verified successfully');
    } catch (error) {
        console.error('Error verifying property:', error);
        showError('Failed to verify property');
    }
}

// Delete property
async function deleteProperty(propertyId) {
    try {
        if (!confirm('Are you sure you want to delete this property?')) {
            return;
        }
        
        await propertyContract.methods.deleteProperty(propertyId).send({ from: currentAccount });
        await loadDashboardData();
        showSuccess('Property deleted successfully');
    } catch (error) {
        console.error('Error deleting property:', error);
        showError('Failed to delete property');
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('propertyDetailsModal');
    modal.style.display = 'none';
}

// Show error message
function showError(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Show success message
function showSuccess(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
