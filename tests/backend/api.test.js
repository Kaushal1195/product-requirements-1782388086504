const request = require('supertest');
// Assuming your Express app is exported from src/app.js
// In a real project, you might have a test-specific app instance or mock dependencies.
const app = require('../../src/app'); 

// --- Mocking Database and Initial Setup ---
// In a real test environment, you would typically:
// 1. Use a separate test database or an in-memory database.
// 2. Seed the database with known test data before each test suite or test.
// 3. Clear the database after each test suite or test.

// For this example, we'll simulate database interactions and user/task IDs.
// We'll assume the `app` instance connects to a database that can be reset.

// Placeholder credentials and IDs for testing
const managerCredentials = { email: 'manager@example.com', password: 'password123' };
const employeeCredentials = { email: 'employee@example.com', password: 'password123' };
const nonExistentCredentials = { email: 'nonexistent@example.com', password: 'wrongpassword' };

let managerAccessToken;
let employeeAccessToken;
let managerRefreshToken; // Not directly used in these ACs, but good to store
let employeeRefreshToken; // Not directly used in these ACs, but good to store

// Placeholder IDs for users and tasks that would be created in a real test setup
// In a real scenario, these would be dynamically retrieved from the DB after seeding.
const managerId = 'manager-uuid-123'; 
const employeeId = 'employee-uuid-456'; 
const otherEmployeeId = 'employee-uuid-789'; 
let taskIdAssignedToEmployee; // Will be set after a task is created for the employee
let taskIdAssignedToOtherEmployee; // Will be set after a task is created for another employee
let taskIdForStatusTransitionTest; // A task specifically for AC12

// Helper to log in and get tokens
const loginUser = async (credentials) => {
    const res = await request(app)
        .post('/api/auth/login') // Assuming /api/auth/login endpoint
        .send(credentials);
    
    // Basic assertions for successful login
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    return { accessToken: res.body.accessToken, refreshToken: res.body.refreshToken };
};

// Helper to create a task as a manager
const createTaskAsManager = async (token, taskDetails) => {
    const res = await request(app)
        .post('/api/tasks') // Assuming /api/tasks endpoint for creation
        .set('Authorization', `Bearer ${token}`)
        .send(taskDetails);
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    // We use toMatchObject because the response might include other fields like createdAt, updatedAt
    expect(res.body).toMatchObject({
        title: taskDetails.title,
        description: taskDetails.description,
        priority: taskDetails.priority,
        dueDate: taskDetails.dueDate, // Assuming date format matches
        assignedTo: taskDetails.assignedTo,
        status: taskDetails.status || 'Pending' // Default status if not provided
    });
    return res.body.id;
};

// --- Jest Setup/Teardown ---
beforeAll(async () => {
    // In a real setup, you'd seed your database here with manager and employee users.
    // For this example, we assume these users exist in the DB for login.
    console.log('--- Initializing Test Environment ---');
    console.log('Seeding database with test users and initial data...');
    // Example: await db.seedUsers([managerCredentials, employeeCredentials, { email: 'other@example.com', password: 'password123', role: 'Employee' }]);
    // Example: managerId = await db.getUserId(managerCredentials.email);
    // Example: employeeId = await db.getUserId(employeeCredentials.email);
    // Example: otherEmployeeId = await db.getUserId('other@example.com');

    // Log in manager and employee to get their tokens
    const managerLogin = await loginUser(managerCredentials);
    managerAccessToken = managerLogin.accessToken;
    managerRefreshToken = managerLogin.refreshToken;

    const employeeLogin = await loginUser(employeeCredentials);
    employeeAccessToken = employeeLogin.accessToken;
    employeeRefreshToken = employeeLogin.refreshToken;

    // Create some initial tasks for testing AC7, AC8, AC9, AC10, AC12
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const dayAfterTomorrow = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

    taskIdAssignedToEmployee = await createTaskAsManager(managerAccessToken, {
        title: 'Employee Task 1 for AC7/AC8/AC9/AC10',
        description: 'Description for employee task 1',
        priority: 'High',
        dueDate: tomorrow,
        assignedTo: employeeId, 
        status: 'Pending'
    });

    taskIdAssignedToOtherEmployee = await createTaskAsManager(managerAccessToken, {
        title: 'Other Employee Task for AC7',
        description: 'Description for other employee task',
        priority: 'Medium',
        dueDate: dayAfterTomorrow,
        assignedTo: otherEmployeeId, 
        status: 'Pending'
    });

    // Create a task specifically for AC12 (Invalid Status Transition)
    taskIdForStatusTransitionTest = await createTaskAsManager(managerAccessToken, {
        title: 'Task for AC12 Status Transition',
        description: 'This task will be set to Completed for AC12.',
        priority: 'Low',
        dueDate: tomorrow,
        assignedTo: employeeId,
        status: 'Pending'
    });

    // Set taskIdForStatusTransitionTest to 'Completed' for AC12
    await request(app)
        .patch(`/api/tasks/${taskIdForStatusTransitionTest}/status`)
        .set('Authorization', `Bearer ${employeeAccessToken}`)
        .send({ status: 'In Progress' });
    
    await request(app)
        .patch(`/api/tasks/${taskIdForStatusTransitionTest}/status`)
        .set('Authorization', `Bearer ${employeeAccessToken}`)
        .send({ status: 'Completed' });

    console.log('--- Test Environment Initialized ---');
});

afterAll(async () => {
    // In a real setup, you'd clean up your test database here.
    console.log('--- Cleaning up Test Environment ---');
    // Example: await db.clearAllTables();
});

// --- Test Suites for Acceptance Criteria ---

describe('Authentication & Authorization', () => {

    // AC1: Manager Login Success
    it('AC1: should allow a Manager to log in and receive JWTs', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send(managerCredentials);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        // In a real app, you might decode the token to verify the role,
        // or have a /me endpoint that returns user details including role.
        // const decodedToken = jwt.decode(res.body.accessToken);
        // expect(decodedToken.role).toBe('Manager'); 
    });

    // AC2: Employee Login Success
    it('AC2: should allow an Employee to log in and receive JWTs', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send(employeeCredentials);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        // const decodedToken = jwt.decode(res.body.accessToken);
        // expect(decodedToken.role).toBe('Employee');
    });

    // AC3: Unauthorized Access (No Token)
    it('AC3: should return 401 Unauthorized when accessing a protected endpoint without a token', async () => {
        const res = await request(app)
            .get('/api/tasks'); // A protected endpoint

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'Unauthorized');
    });

    // AC4: Forbidden Access (Role Mismatch)
    it('AC4: should return 403 Forbidden when an Employee attempts a Manager-only action', async () => {
        const res = await request(app)
            .post('/api/tasks') // Manager-only action: create task
            .set('Authorization', `Bearer ${employeeAccessToken}`)
            .send({
                title: 'Forbidden Task by Employee',
                description: 'Employee trying to create task',
                priority: 'Low',
                dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                assignedTo: employeeId,
                status: 'Pending'
            });

        expect(res.statusCode).toBe(403);
        expect(res.body).toHaveProperty('message', 'Forbidden');
    });

    // AC5: JWT Validation (Explicitly testing malformed/invalid tokens)
    it('AC5: should return 401 Unauthorized for a malformed JWT', async () => {
        const res = await request(app)
            .get('/api/tasks')
            .set('Authorization', `Bearer malformed.jwt.token`);

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'Unauthorized'); // Or 'Invalid token' depending on implementation
    });

    it('AC5: should return 401 Unauthorized for an invalid signature JWT', async () => {
        // This would require creating a JWT with a valid structure but wrong signature
        // For simplicity, we'll use a placeholder. In a real test, you'd generate one
        // using a different secret than the app's.
        const invalidSignatureToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsInJvbGUiOiJFbXBsb3llZSIsImlhdCI6MTY3ODkwNTYwMCwiZXhwIjoxNjc4OTA5MjAwfQ.invalid_signature_here_instead_of_valid_one";
        const res = await request(app)
            .get('/api/tasks')
            .set('Authorization', `Bearer ${invalidSignatureToken}`);

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'Unauthorized'); // Or 'Invalid token'
    });
});

describe('Task Management', () => {

    // AC6: Manager Creates Task
    it('AC6: should allow a Manager to create a new task', async () => {
        const newTaskDetails = {
            title: 'New Task by Manager for AC6',
            description: 'This is a task created by the manager for an employee.',
            priority: 'High',
            dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], // 3 days from now
            assignedTo: employeeId,
            status: 'Pending'
        };

        const res = await request(app)
            .post('/api/tasks')
            .set('Authorization', `Bearer ${managerAccessToken}`)
            .send(newTaskDetails);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.title).toBe(newTaskDetails.title);
        expect(res.body.assignedTo).toBe(newTaskDetails.assignedTo);
        expect(res.body.status).toBe('Pending'); 
    });

    // AC7: Employee Views Assigned Tasks Only
    it('AC7: should allow an Employee to view only tasks assigned to them', async () => {
        const res = await request(app)
            .get('/api/tasks')
            .set('Authorization', `Bearer ${employeeAccessToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1); // Should have at least the task created for them

        // Verify all tasks returned are assigned to this employee
        const allAssignedToCurrentEmployee = res.body.every(task => task.assignedTo === employeeId);
        expect(allAssignedToCurrentEmployee).toBe(true);

        // Verify that the task assigned to 'otherEmployeeId' is NOT present
        const otherEmployeeTaskPresent = res.body.some(task => task.assignedTo === otherEmployeeId);
        expect(otherEmployeeTaskPresent).toBe(false);
    });

    // AC8: Employee Updates Task Status
    it('AC8: should allow an Employee to update the status of their assigned task', async () => {
        // Ensure the task is in 'Pending' for a valid transition to 'In Progress'
        await request(app)
            .patch(`/api/tasks/${taskIdAssignedToEmployee}/status`)
            .set('Authorization', `Bearer ${employeeAccessToken}`)
            .send({ status: 'Pending' }); 

        const res = await request(app)
            .patch(`/api/tasks/${taskIdAssignedToEmployee}/status`)
            .set('Authorization', `Bearer ${employeeAccessToken}`)
            .send({ status: 'In Progress' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id', taskIdAssignedToEmployee);
        expect(res.body).toHaveProperty('status', 'In Progress');

        // Verify status in DB (optional, but good for full coverage)
        const getRes = await request(app)
            .get(`/api/tasks/${taskIdAssignedToEmployee}`)
            .set('Authorization', `Bearer ${managerAccessToken}`); // Manager can view any task
        expect(getRes.statusCode).toBe(200);
        expect(getRes.body).toHaveProperty('status', 'In Progress');
    });

    // AC9: Employee Cannot Edit Other Task Details
    it('AC9: should prevent an Employee from modifying other task details (Title, Description, Due Date)', async () => {
        const res = await request(app)
            .patch(`/api/tasks/${taskIdAssignedToEmployee}`) // Assuming a generic PATCH endpoint for tasks
            .set('Authorization', `Bearer ${employeeAccessToken}`)
            .send({
                title: 'Attempted New Title by Employee',
                description: 'Attempted new description by Employee',
                dueDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0]
            });

        // Expect 403 Forbidden if the route is entirely protected for employees for these fields
        // Or 400 Bad Request if the route is accessible but the payload is invalid for their role
        expect(res.statusCode).toBe(403); 
        expect(res.body).toHaveProperty('message', 'Forbidden');
    });

    // AC10: Manager Sees Updated Status
    it('AC10: should show the updated task status to the Manager', async () => {
        // First, ensure the employee updates a task status
        await request(app)
            .patch(`/api/tasks/${taskIdAssignedToEmployee}/status`)
            .set('Authorization', `Bearer ${employeeAccessToken}`)
            .send({ status: 'Completed' });

        // Then, the manager views the task
        const res = await request(app)
            .get(`/api/tasks/${taskIdAssignedToEmployee}`)
            .set('Authorization', `Bearer ${managerAccessToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id', taskIdAssignedToEmployee);
        expect(res.body).toHaveProperty('status', 'Completed');
    });
});

describe('Validation', () => {

    // AC11: Invalid Due Date
    it('AC11: should reject task creation if Due Date is in the past', async () => {
        const pastDate = new Date(Date.now() - 86400000).toISOString().split('T')[0]; // Yesterday
        const newTaskDetails = {
            title: 'Task with Past Due Date for AC11',
            description: 'This task has an invalid due date.',
            priority: 'Low',
            dueDate: pastDate,
            assignedTo: employeeId,
            status: 'Pending'
        };

        const res = await request(app)
            .post('/api/tasks')
            .set('Authorization', `Bearer ${managerAccessToken}`)
            .send(newTaskDetails);

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toContain('Due date cannot be in the past');
    });

    // AC12: Invalid Status Transition
    it('AC12: should reject an invalid task status transition (e.g., Completed to Pending)', async () => {
        // taskIdForStatusTransitionTest was set to 'Completed' in beforeAll
        const res = await request(app)
            .patch(`/api/tasks/${taskIdForStatusTransitionTest}/status`)
            .set('Authorization', `Bearer ${employeeAccessToken}`)
            .send({ status: 'Pending' }); // Attempt to revert from Completed to Pending

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toContain('Invalid status transition');
    });
});

// --- Edge Cases (Based on PRD Section 5) ---
describe('Edge Cases - Authentication & Authorization', () => {
    it('should return 401 for invalid login credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send(nonExistentCredentials); // Using non-existent user or wrong password

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });

    // Further edge cases like Expired Access/Refresh Tokens would require
    // mocking JWT expiration times or specific token generation logic.
    // For example, using `jsonwebtoken.sign` with `expiresIn: '1ms'` for an expired token.
});

describe('Edge Cases - Task Management', () => {
    it('should return 404 when trying to update a non-existent task', async () => {
        const nonExistentTaskId = 'non-existent-task-id-123';
        const res = await request(app)
            .patch(`/api/tasks/${nonExistentTaskId}/status`)
            .set('Authorization', `Bearer ${employeeAccessToken}`)
            .send({ status: 'In Progress' });

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('message', 'Task not found');
    });

    it('should return 400 for missing required fields when creating a task', async () => {
        const res = await request(app)
            .post('/api/tasks')
            .set('Authorization', `Bearer ${managerAccessToken}`)
            .send({
                description: 'Missing title',
                priority: 'Low',
                dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                assignedTo: employeeId
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toContain('Title is required');
    });

    it('should return 400 for invalid assigned employee ID when creating a task', async () => {
        const res = await request(app)
            .post('/api/tasks')
            .set('Authorization', `Bearer ${managerAccessToken}`)
            .send({
                title: 'Task for invalid employee',
                description: 'This task has an invalid assigned employee.',
                priority: 'Low',
                dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                assignedTo: 'invalid-employee-id-xyz' // Non-existent employee
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toContain('Assigned employee not found');
    });

    it('should return 400 for task title exceeding max character limits', async () => {
        const longTitle = 'a'.repeat(256); // Assuming max 255 chars
        const res = await request(app)
            .post('/api/tasks')
            .set('Authorization', `Bearer ${managerAccessToken}`)
            .send({
                title: longTitle,
                description: 'Description',
                priority: 'Low',
                dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                assignedTo: employeeId
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toContain('Title exceeds maximum length');
    });
});
