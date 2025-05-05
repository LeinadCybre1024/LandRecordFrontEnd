const Web3 = require('web3');

// Mock Web3 and contracts
jest.mock('web3');

describe('Admin Application Tests', () => {
    let web3;
    let landRegistryContract;
    let propertyContract;
    let usersContract;

    beforeEach(() => {
        // Setup DOM elements
        document.body.innerHTML = `
            <div id="admin-container">
                <input id="admin-wallet" />
                <input id="admin-password" />
                <button id="admin-login-btn">Login</button>
                <div id="pending-requests">
                    <table id="pending-requests-table">
                        <tbody></tbody>
                    </table>
                </div>
                <div id="user-management">
                    <table id="users-table">
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        `;

        // Mock Web3 instance
        web3 = {
            eth: {
                Contract: jest.fn(),
                getAccounts: jest.fn(),
                net: {
                    getId: jest.fn().mockResolvedValue('5777')
                }
            }
        };

        // Mock contract instances
        landRegistryContract = {
            methods: {
                getPendingRequests: jest.fn(),
                approveLandRegistration: jest.fn(),
                rejectLandRegistration: jest.fn()
            }
        };

        propertyContract = {
            methods: {
                getLandDetailsAsStruct: jest.fn()
            }
        };

        usersContract = {
            methods: {
                getAllUsers: jest.fn(),
                blockUser: jest.fn(),
                unblockUser: jest.fn()
            }
        };

        // Mock ethereum provider
        global.ethereum = {
            request: jest.fn(),
            on: jest.fn()
        };
    });

    describe('Admin Login', () => {
        test('should login successfully with admin credentials', async () => {
            const mockWallet = '0x123...';
            const mockPassword = 'admin123';

            // Fill form
            document.getElementById('admin-wallet').value = mockWallet;
            document.getElementById('admin-password').value = mockPassword;

            // Mock admin check
            const isAdmin = true;
            usersContract.methods.isAdmin = jest.fn().mockReturnValue({
                call: jest.fn().mockResolvedValue(isAdmin)
            });

            // Trigger login
            await document.getElementById('admin-login-btn').click();

            // Verify
            expect(usersContract.methods.isAdmin).toHaveBeenCalledWith(mockWallet);
            expect(localStorage.getItem('adminUser')).toBeTruthy();
        });

        test('should reject non-admin login', async () => {
            const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
            
            // Mock admin check
            usersContract.methods.isAdmin = jest.fn().mockReturnValue({
                call: jest.fn().mockResolvedValue(false)
            });

            // Trigger login
            await document.getElementById('admin-login-btn').click();

            expect(alertMock).toHaveBeenCalledWith('Invalid admin credentials');
        });
    });

    describe('Pending Requests Management', () => {
        test('should load and display pending requests', async () => {
            const mockPendingRequests = [
                {
                    landId: '1',
                    owner: '0x456...',
                    status: 'PENDING'
                }
            ];

            landRegistryContract.methods.getPendingRequests.mockReturnValue({
                call: jest.fn().mockResolvedValue(mockPendingRequests)
            });

            propertyContract.methods.getLandDetailsAsStruct.mockReturnValue({
                call: jest.fn().mockResolvedValue(['Land 1', 'Location 1', '100', '0x456...'])
            });

            await window.loadPendingRequests();

            const table = document.getElementById('pending-requests-table');
            expect(table.getElementsByTagName('tr').length).toBeGreaterThan(0);
        });

        test('should approve land registration request', async () => {
            const mockLandId = '1';
            const mockTx = { status: true };

            landRegistryContract.methods.approveLandRegistration.mockReturnValue({
                send: jest.fn().mockResolvedValue(mockTx)
            });

            await window.approveLandRequest(mockLandId);

            expect(landRegistryContract.methods.approveLandRegistration)
                .toHaveBeenCalledWith(mockLandId);
        });
    });

    describe('User Management', () => {
        test('should load and display all users', async () => {
            const mockUsers = [
                {
                    wallet: '0x789...',
                    firstName: 'John',
                    lastName: 'Doe',
                    isBlocked: false
                }
            ];

            usersContract.methods.getAllUsers.mockReturnValue({
                call: jest.fn().mockResolvedValue(mockUsers)
            });

            await window.loadUsers();

            const table = document.getElementById('users-table');
            expect(table.getElementsByTagName('tr').length).toBeGreaterThan(0);
        });

        test('should block user', async () => {
            const mockWallet = '0x789...';
            const mockTx = { status: true };

            usersContract.methods.blockUser.mockReturnValue({
                send: jest.fn().mockResolvedValue(mockTx)
            });

            await window.blockUser(mockWallet);

            expect(usersContract.methods.blockUser)
                .toHaveBeenCalledWith(mockWallet);
        });

        test('should unblock user', async () => {
            const mockWallet = '0x789...';
            const mockTx = { status: true };

            usersContract.methods.unblockUser.mockReturnValue({
                send: jest.fn().mockResolvedValue(mockTx)
            });

            await window.unblockUser(mockWallet);

            expect(usersContract.methods.unblockUser)
                .toHaveBeenCalledWith(mockWallet);
        });
    });
}); 