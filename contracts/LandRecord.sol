// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LandRecord {
    struct Land {
        uint256 id;
        string ownerName;
        string location;
        uint256 area;
        bool isSold;
        bool isApproved;
    }

    struct TransferRequest {
        uint256 landId;
        string newOwner;
        bool isApproved;
    }

    struct Dispute {
        uint256 landId;
        string reason;
        bool isResolved;
    }

    mapping(uint256 => Land) public lands;
    mapping(uint256 => TransferRequest) public pendingTransfers;
    mapping(uint256 => Dispute) public disputes;
    
    uint256 public landCount;
    uint256 public transferFee = 0.01 ether; // Fee for transferring land
    uint256 public addLandFee = 0.02 ether; // Fee for adding land

    address public admin;
    mapping(address => bool) public isAdmin;
    mapping(address => string) public userDetails;

    event LandAdded(uint256 id, string ownerName, string location, uint256 area);
    event LandApproved(uint256 id);
    event LandTransferred(uint256 id, string newOwner);
    event TransferApproved(uint256 id);
    event DisputeResolved(uint256 id);

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Only admin can perform this action");
        _;
    }

    modifier paidFee(uint256 _fee) {
        require(msg.value >= _fee, "Insufficient fee");
        _;
    }

    constructor() {
        admin = msg.sender;
        isAdmin[msg.sender] = true;
    }

    function addAdmin(address _newAdmin) public onlyAdmin {
        isAdmin[_newAdmin] = true;
    }

    function registerUser(string memory _name) public {
        require(bytes(userDetails[msg.sender]).length == 0, "User already registered");
        userDetails[msg.sender] = _name;
    }

    function addLand(string memory _ownerName, string memory _location, uint256 _area) 
        public payable paidFee(addLandFee) 
    {
        landCount++;
        lands[landCount] = Land(landCount, _ownerName, _location, _area, false, false);
        emit LandAdded(landCount, _ownerName, _location, _area);
    }

    function approveLand(uint256 _id) public onlyAdmin {
        require(!lands[_id].isApproved, "Land already approved");
        lands[_id].isApproved = true;
        emit LandApproved(_id);
    }

    function transferLand(uint256 _id, string memory _newOwner) 
        public payable paidFee(transferFee) 
    {
        require(lands[_id].isApproved, "Land is not approved");
        require(!lands[_id].isSold, "Land already sold");
        pendingTransfers[_id] = TransferRequest(_id, _newOwner, false);
    }

    function approveTransfer(uint256 _id) public onlyAdmin {
        require(!pendingTransfers[_id].isApproved, "Transfer already approved");
        lands[_id].ownerName = pendingTransfers[_id].newOwner;
        lands[_id].isSold = true;
        pendingTransfers[_id].isApproved = true;
        emit TransferApproved(_id);
    }

    function raiseDispute(uint256 _id, string memory _reason) public {
        disputes[_id] = Dispute(_id, _reason, false);
    }

    function resolveDispute(uint256 _id) public onlyAdmin {
        require(!disputes[_id].isResolved, "Dispute already resolved");
        disputes[_id].isResolved = true;
        emit DisputeResolved(_id);
    }
}
