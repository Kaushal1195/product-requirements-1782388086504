## Product Requirements Document (PRD)

## Project Name
Task Management System with Role-Based Access Control (RBAC)

---

### 1. Executive Summary

The Task Management System with RBAC is designed to streamline task delegation, tracking, and management within an organization. It provides a secure and efficient platform where managers can create, assign, and monitor tasks for their teams, while employees can effectively manage their assigned workload. The system emphasizes robust security through JSON Web Token (JWT) authentication and granular Role-Based Access Control (RBAC), ensuring that users only access functionalities and data relevant to their roles. Key objectives include secure login, efficient task assignment and tracking, role-specific dashboards, and a responsive user interface, ultimately enhancing team productivity and accountability.

---

### 2. User Personas

#### 2.1. Sarah, The Team Lead (Manager)
*   **About**: Sarah is a project manager responsible for a team of 5-7 employees. She juggles multiple projects and needs to ensure tasks are completed on time and within scope.
*   **Goals**:
    *   Efficiently delegate tasks to team members.
    *   Gain a clear overview of team workload and individual task progress.
    *   Identify bottlenecks and reallocate resources as needed.
    *   Generate reports on team performance and task completion rates.
    *   Maintain control over task details and assignments.
*   **Pain Points**:
    *   Manual tracking of tasks leads to errors and missed deadlines.
    *   Lack of real-time visibility into employee progress.
    *   Difficulty in quickly assigning or reassigning tasks.
    *   Ensuring data security and preventing unauthorized access to sensitive project information.
*   **Needs from the System**:
    *   Intuitive interface for creating and assigning tasks.
    *   Comprehensive dashboard with team-level statistics and activity logs.
    *   Ability to edit, delete, and reassign any task.
    *   Secure login and robust access control.

#### 2.2. John, The Developer (Employee)
*   **About**: John is a software developer focused on completing his assigned coding tasks. He needs a clear understanding of his priorities and an easy way to update his progress.
*   **Goals**:
    *   Clearly see all tasks assigned to him.
    *   Easily update the status of his tasks.
    *   Understand task priorities and due dates.
    *   Focus on his work without distractions from other team members' tasks.
*   **Pain Points**:
    *   Unclear task descriptions or priorities.
    *   Difficulty in communicating task progress efficiently.
    *   Being overwhelmed by irrelevant information or tasks not assigned to him.
    *   Security concerns about his personal task list being visible to others.
*   **Needs from the System**:
    *   Personalized dashboard showing only his assigned tasks.
    *   Simple mechanism to change task status (e.g., Pending, In Progress, Completed).
    *   Secure login and assurance that his tasks are private to him and his manager.

---

### 3. Core Features

#### 3.1. Authentication & Authorization
*   **Secure Login**: Users can log in using email and password, receiving a JWT for subsequent API access.
*   **Logout**: Users can securely log out, invalidating their session.
*   **Refresh Token Management**: System handles the renewal of access tokens using refresh tokens.
*   **Password Hashing**: Passwords are securely stored using strong hashing algorithms.
*   **Session Validation**: Server-side validation of refresh tokens for logout and revocation.
*   **Role-Based Access Control (RBAC)**: Granular permissions enforced based on user roles (Manager, Employee) for all actions and resources.

#### 3.2. Task Management
*   **Task Creation (Manager)**: Managers can create new tasks with Title, Description, Priority, Status (default Pending), Due Date, and assign to an Employee.
*   **Task Editing (Manager)**: Managers can modify any detail of any task.
*   **Task Deletion (Manager)**: Managers can delete existing tasks.
*   **Task Assignment (Manager)**: Managers can assign tasks to existing employees.
*   **View All Tasks (Manager)**: Managers can view a comprehensive list of all tasks in the system.
*   **Search & Filter Tasks (Manager)**: Managers can search and filter tasks by various criteria (e.g., employee, status, priority, due date).
*   **View Assigned Tasks (Employee)**: Employees can only view tasks explicitly assigned to them.
*   **Update Task Status (Employee)**: Employees can update the status of their assigned tasks (Pending -> In Progress -> Completed). Employees cannot modify other task details.

#### 3.3. User Management
*   **View Employees (Manager)**: Managers can view a list of all employees.

#### 3.4. Dashboards
*   **Manager Dashboard**:
    *   **Cards**: Display key metrics like Total Tasks, Completed Tasks, Pending Tasks, and number of Employees.
    *   **Recent Activity**: Show a log of recent task creations, updates, and assignments.
    *   **Charts**: Visualize Task Status distribution and Employee Performance (e.g., tasks completed per employee).
*   **Employee Dashboard**:
    *   **Cards**: Display personal metrics like Total Assigned Tasks, Completed Tasks, Pending Tasks, and Tasks Due Today.
    *   **Recent Tasks**: Show a list of recently assigned or updated tasks relevant to the employee.

#### 3.5. Data Integrity & Validation
*   **Server-Side Validation**: All input fields and business rules (e.g., task title required, due date not in past, valid status transitions, employee existence) are strictly enforced on the backend.
*   **Database Schema**: Adherence to defined `Users` and `Tasks` schema with appropriate foreign keys and cascade rules (`ON DELETE RESTRICT`).

#### 3.6. Security
*   **API Authorization**: Every API endpoint is protected by RBAC middleware.
*   **Input Sanitization**: Protection against SQL Injection and Cross-Site Scripting (XSS).
*   **Rate Limiting**: Implemented on authentication endpoints to prevent brute-force attacks.
*   **HTTPS Enforcement**: All communication encrypted via HTTPS.
*   **Secure Configuration**: Sensitive data stored in environment variables.
*   **Secure Cookies**: Use of `HttpOnly`, `Secure`, `SameSite` flags for cookies storing refresh tokens.

#### 3.7. Non-Functional Requirements
*   **Response Time**: API responses within 2 seconds.
*   **Availability**: 99.9% system uptime.
*   **Responsive Design**: User interface adapts seamlessly across various devices (desktop, tablet, mobile).
*   **Scalability**: Architecture designed to handle increasing user load and data volume.
*   **Audit Logging**: Comprehensive logging of significant user actions and system events.

---

### 4. Acceptance Criteria (Given/When/Then format)

#### 4.1. Authentication & Authorization
*   **AC1: Manager Login Success**
    *   **Given** a Manager user exists with valid credentials.
    *   **When** the Manager attempts to log in via `POST /login` with correct email and password.
    *   **Then** the system authenticates the user, issues a valid JWT (Access and Refresh Tokens), and grants access to Manager functionalities.
*   **AC2: Employee Login Success**
    *   **Given** an Employee user exists with valid credentials.
    *   **When** the Employee attempts to log in via `POST /login` with correct email and password.
    *   **Then** the system authenticates the user, issues a valid JWT (Access and Refresh Tokens), and grants access to Employee functionalities.
*   **AC3: Unauthorized Access (No Token)**
    *   **Given** a user attempts to access a protected API endpoint (e.g., `GET /tasks`).
    *   **When** the request is made without a valid `Authorization: Bearer <token>` header.
    *   **Then** the system returns a `401 Unauthorized` response.
*   **AC4: Forbidden Access (Role Mismatch)**
    *   **Given** an Employee is logged in with a valid JWT.
    *   **When** the Employee attempts to perform a Manager-only action (e.g., `POST /tasks` to create a task).
    *   **Then** the system returns a `403 Forbidden` response.
*   **AC5: JWT Validation**
    *   **Given** a user sends an API request with an `Authorization: Bearer <token>` header.
    *   **When** the request reaches a protected endpoint.
    *   **Then** the system validates the JWT's signature, expiration, and associated permissions before processing the request.

#### 4.2. Task Management
*   **AC6: Manager Creates Task**
    *   **Given** a Manager is logged in.
    *   **When** the Manager sends a `POST /tasks` request with valid task details (Title, Description, Priority, Due Date, Assigned Employee ID).
    *   **Then** a new task is created in the database, assigned to the specified employee, and the system returns a `201 Created` response with the new task details.
*   **AC7: Employee Views Assigned Tasks Only**
    *   **Given** an Employee is logged in and has tasks assigned to them, and other tasks assigned to different employees.
    *   **When** the Employee sends a `GET /tasks` request.
    *   **Then** the system returns a list containing only the tasks where the Employee is listed as `assigned_to`, with a `200 OK` response.
*   **AC8: Employee Updates Task Status**
    *   **Given** an Employee is logged in and has an assigned task with a status of 'Pending'.
    *   **When** the Employee sends a `PATCH /tasks/{id}/status` request to change the status to 'In Progress'.
    *   **Then** the task's status is updated to 'In Progress' in the database, and the system returns a `200 OK` response.
*   **AC9: Employee Cannot Edit Other Task Details**
    *   **Given** an Employee is logged in and has an assigned task.
    *   **When** the Employee attempts to send a `PUT /tasks/{id}` or `PATCH /tasks/{id}` request to modify the task's Title, Description, or Due Date.
    *   **Then** the system rejects the request with a `403 Forbidden` or `400 Bad Request` response.
*   **AC10: Manager Sees Updated Status**
    *   **Given** a Manager is logged in and an Employee has updated the status of an assigned task.
    *   **When** the Manager views the specific task or their dashboard.
    *   **Then** the Manager sees the task's updated status reflected accurately.

#### 4.3. Validation
*   **AC11: Invalid Due Date**
    *   **Given** a Manager is logged in.
    *   **When** the Manager attempts to create a task with a `Due Date` that is in the past.
    *   **Then** the system rejects the request with a `400 Bad Request` and an error message indicating the invalid date.
*   **AC12: Invalid Status Transition**
    *   **Given** an Employee is logged in and has an assigned task with a status of 'Completed'.
    *   **When** the Employee attempts to change the task status to 'Pending'.
    *   **Then** the system rejects the request with a `400 Bad Request` and an error message indicating an invalid status transition.

---

### 5. Edge Cases

#### 5.1. Authentication & Authorization
*   **Invalid Credentials**: User attempts to log in with incorrect email or password.
*   **Expired Access Token**: A user's access token expires mid-session, requiring a refresh.
*   **Expired Refresh Token**: A user's refresh token expires, forcing a full re-login.
*   **Revoked Refresh Token**: A user attempts to use a refresh token that has been blacklisted (e.g., after logout).
*   **Non-existent User**: An attempt to log in with an email that does not correspond to any registered user.
*   **Manager Role Restriction**: A Manager attempts to mark an employee's task as 'Completed' directly without following the 'Pending -> In Progress -> Completed' transition logic.

#### 5.2. Task Management
*   **Non-existent Task**: A user attempts to update or delete a task ID that does not exist.
*   **Invalid Assigned Employee**: A Manager attempts to assign a task to a non-existent employee ID.
*   **Missing Required Fields**: A user attempts to create a task without a required field (e.g., `title`).
*   **Concurrent Task Updates**: Two users (e.g., a Manager and an Employee) attempt to update the same task simultaneously.
*   **Task Deletion with Dependencies**: A Manager attempts to delete a user who has active tasks assigned to them (should be prevented by `ON DELETE RESTRICT`).
*   **Max Character Limits**: Task title or description exceeds defined character limits.

#### 5.3. System & Security
*   **Network Interruption**: Client loses network connectivity during an API request.
*   **Server Downtime**: The backend API or database becomes unavailable.
*   **Database Connection Failure**: The application fails to connect to the database.
*   **XSS Attack**: Malicious script injected into task description or other user input fields.
*   **SQL Injection**: Malicious SQL queries attempted via user input.
*   **Rate Limit Exceeded**: A user makes too many requests to an endpoint within a short period.
*   **CORS Misconfiguration**: Frontend requests are blocked due to incorrect Cross-Origin Resource Sharing settings.
*   **Sensitive Data in Logs**: Personally identifiable information (PII) or sensitive system details are inadvertently logged.