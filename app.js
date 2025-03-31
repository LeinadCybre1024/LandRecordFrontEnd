// Initialize Web3
const web3 = new Web3(Web3.givenProvider || "http://localhost:7545");

const isConnected = false;

// Contract Address and ABI
const contractAddress = "0x2119EC0C931677cD2a2748107f22C61faCaBf4C3"; // Replace with your deployed contract address
const abi = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "ownerName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "location",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "area",
        "type": "uint256"
      }
    ],
    "name": "LandAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "LandApproved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "newOwner",
        "type": "string"
      }
    ],
    "name": "LandTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      }
    ],
    "name": "UserRegistered",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isAdmin",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "landCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "lands",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "ownerName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "location",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "area",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isSold",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isApproved",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "userDetails",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_newAdmin",
        "type": "address"
      }
    ],
    "name": "addAdmin",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      }
    ],
    "name": "registerUser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_ownerName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_location",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_area",
        "type": "uint256"
      }
    ],
    "name": "addLand",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }
    ],
    "name": "approveLand",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_newOwner",
        "type": "string"
      }
    ],
    "name": "transferLand",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }
    ],
    "name": "getLand",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Initialize the contract
const landRecordContract = new web3.eth.Contract(abi, contractAddress);

// Check for an existing session
let currentAccount = null;

// Update UI based on connection state
const updateUI = (isConnected) => {
  const walletStatus = document.getElementById("walletStatus");
  const disconnectButton = document.getElementById("disconnectWallet");
  const userDetailsSection = document.getElementById("userDetailsSection");
  const connectButton = document.getElementById('connectWallet');
  const userAccount = document.getElementById('userAccount');
  const connectionStatus = document.getElementById('connectionStatus');

  if (isConnected) {
    walletStatus.innerText = ` ${currentAccount}`;
    connectButton.classList.add("hidden");
    userAccount.classList.remove('hidden');
    connectionStatus.classList.replace('bg-red-500', 'bg-green-500');
    disconnectButton.classList.remove("hidden");
    userDetailsSection.style.display = "block";
    showLandForms();
  } else {
    disconnectButton.classList.add("hidden");
    connectButton.classList.remove("hidden");
    userAccount.classList.add('hidden');
    connectionStatus.classList.replace('bg-green-500', 'bg-red-500');
    walletStatus.innerText = "Not connected";
    userDetailsSection.style.display = "none";
    hideLandForms();
  }
};

// Show land forms when logged in
const showLandForms = () => {
  document.getElementById("addLandSection").style.display = "block";
  document.getElementById("transferLandSection").style.display = "block";
  document.getElementById("getLandSection").style.display = "block";
};

// Hide land forms when logged out
const hideLandForms = () => {
  document.getElementById("addLandSection").style.display = "none";
  document.getElementById("transferLandSection").style.display = "none";
  document.getElementById("getLandSection").style.display = "none";
};

// Connect Wallet
const connectWallet = async () => {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      currentAccount = accounts[0];
      updateUI(true);
    } catch (error) {
      console.error("User denied account access or error occurred:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to connect wallet",
        text: "Please ensure MetaMask is installed and you have granted access.",
      });
    }
  } else {
    Swal.fire({
      icon: "error",
      title: "MetaMask not installed",
      text: "Please install MetaMask to use this application.",
    });
  }
};

// Disconnect Wallet
const disconnectWallet = () => {
  Swal.fire({
    title: "Are you sure?",
    text: "You are about to disconnect your wallet.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, disconnect!",
    cancelButtonText: "No, keep connected",
  }).then((result) => {
    if (result.isConfirmed) {
      currentAccount = null;
      updateUI(false);
      Swal.fire("Disconnected!", "Your wallet has been disconnected.", "success");
    } else {
      Swal.fire("Cancelled", "Your wallet is still connected.", "info");
    }
  });
};

// Check session on page load
const checkSession = async () => {
  const accounts = await web3.eth.getAccounts();
  if (accounts.length > 0 && currentAccount != null) {
    currentAccount = accounts[0];
    updateUI(true);
  } else {
    updateUI(false);
  }
};

// Register User Details
document.getElementById("userDetailsForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const userName = document.getElementById("userName").value;

  try {
    await landRecordContract.methods.registerUser(userName).send({ from: currentAccount });
    Swal.fire({
      icon: "success",
      title: "Success!",
      text: "User details saved successfully!",
    });
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to save user details.",
    });
  }
});

// Add Land
document.getElementById("addLandForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const ownerName = document.getElementById("ownerName").value;
  const location = document.getElementById("location").value;
  const area = document.getElementById("area").value;

  try {
    await landRecordContract.methods.addLand(ownerName, location, area).send({ from: currentAccount });
    Swal.fire({
      icon: "success",
      title: "Success!",
      text: "Land added successfully!",
    });
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to add land.",
    });
  }
});

// Transfer Land
document.getElementById("transferLandForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const landId = document.getElementById("landId").value;
  const newOwner = document.getElementById("newOwner").value;

  try {
    await landRecordContract.methods.transferLand(landId, newOwner).send({ from: currentAccount });
    Swal.fire({
      icon: "success",
      title: "Success!",
      text: "Land transferred successfully!",
    });
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to transfer land.",
    });
  }
});

// Get Land Details
document.getElementById("getLandForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const landId = document.getElementById("landIdDetails").value;

  try {
    const land = await landRecordContract.methods.getLand(landId).call();
    const landDetails = `
      <p><strong>Owner Name:</strong> ${land[0]}</p>
      <p><strong>Location:</strong> ${land[1]}</p>
      <p><strong>Area:</strong> ${land[2]} sq. ft.</p>
      <p><strong>Is Sold:</strong> ${land[3] ? "Yes" : "No"}</p>
      <p><strong>Is Approved:</strong> ${land[4] ? "Yes" : "No"}</p>
    `;
    document.getElementById("landDetails").innerHTML = landDetails;
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to fetch land details.",
    });
  }
});

// Event Listeners
document.getElementById("connectWallet").addEventListener("click", connectWallet);
document.getElementById("disconnectWallet").addEventListener("click", disconnectWallet);

// Check session on page load
window.addEventListener("load", checkSession);