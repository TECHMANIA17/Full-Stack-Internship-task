// Advanced Form Validation & DOM Manipulation with Client-Side Routing

// Data Management
class DataManager {
    static getUsers() {
        try {
            return JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        } catch (e) {
            console.error('Error loading users from localStorage:', e);
            return [];
        }
    }

    static saveUsers(users) {
        try {
            localStorage.setItem('registeredUsers', JSON.stringify(users));
        } catch (e) {
            console.error('Error saving users to localStorage:', e);
            showNotification('Error saving data. Please try again.', 'error');
        }
    }

    static addUser(user) {
        const users = this.getUsers();
        user.id = Date.now().toString();
        user.registrationDate = new Date().toISOString();
        users.push(user);
        this.saveUsers(users);
        return user;
    }

    static deleteUser(id) {
        const users = this.getUsers().filter(user => user.id !== id);
        this.saveUsers(users);
    }

    static updateUser(id, updatedUser) {
        const users = this.getUsers();
        const index = users.findIndex(user => user.id === id);
        if (index !== -1) {
            users[index] = { ...users[index], ...updatedUser };
            this.saveUsers(users);
            return true;
        }
        return false;
    }

    static getUserById(id) {
        const users = this.getUsers();
        return users.find(user => user.id === id);
    }
}

// Simple Client-Side Router
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = '';
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    addRoute(path, handler) {
        this.routes[path] = handler;
    }

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        if (this.routes[hash]) {
            this.routes[hash]();
            this.currentRoute = hash;
        }
    }

    navigate(path) {
        window.location.hash = path;
    }
}

// Form Validation Class
class FormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.errors = {};
        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            this.form.addEventListener('input', (e) => this.validateField(e.target));
        }
    }

    validateField(field) {
        const value = field.value.trim();
        const name = field.name;
        let error = '';

        switch (name) {
            case 'email':
                if (!this.isValidEmail(value)) {
                    error = 'Please enter a valid email address.';
                }
                break;
            case 'password':
                error = this.validatePassword(value);
                this.updatePasswordStrength(value);
                break;
            case 'confirmPassword':
                if (value !== document.getElementById('password').value) {
                    error = 'Passwords do not match.';
                }
                break;
            case 'name':
                if (value.length < 2) {
                    error = 'Name must be at least 2 characters long.';
                }
                break;
            case 'phone':
                if (!this.isValidPhone(value)) {
                    error = 'Please enter a valid phone number (10-15 digits).';
                }
                break;
        }

        this.errors[name] = error;
        this.displayFieldError(field, error);
        return !error;
    }

    validatePassword(password) {
        if (password.length < 8) {
            return 'Password must be at least 8 characters long.';
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
            return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.';
        }
        return '';
    }

    updatePasswordStrength(password) {
        const strengthBar = document.querySelector('.strength-fill');
        if (!strengthBar) return;

        let strength = 'weak';
        if (password.length >= 8) {
            if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
                strength = 'medium';
                if (/(?=.*[@$!%*?&])/.test(password)) {
                    strength = 'strong';
                }
            }
        }

        strengthBar.className = `strength-fill strength-${strength}`;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        // More flexible phone validation - accepts various formats
        const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,15}$/;
        const digitsOnly = phone.replace(/[\s\-\(\)]/g, '');
        return phoneRegex.test(phone) && digitsOnly.length >= 10 && digitsOnly.length <= 15;
    }

    displayFieldError(field, error) {
        const errorElement = field.parentElement.querySelector('.error');
        if (errorElement) {
            errorElement.textContent = error;
            errorElement.style.display = error ? 'block' : 'none';
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        const fields = this.form.querySelectorAll('input, select, textarea');
        let isValid = true;

        fields.forEach(field => {
            if (field.hasAttribute('required') && !field.value.trim()) {
                this.displayFieldError(field, `${field.name.charAt(0).toUpperCase() + field.name.slice(1)} is required.`);
                isValid = false;
            } else if (!this.validateField(field)) {
                isValid = false;
            }
        });

        if (isValid) {
            this.submitForm();
        }
    }

    submitForm() {
        try {
            const formData = new FormData(this.form);
            const user = Object.fromEntries(formData);
            const editId = this.form.dataset.editId;

            if (editId) {
                // Update existing user
                const success = DataManager.updateUser(editId, user);
                if (success) {
                    showNotification('User updated successfully!', 'success');
                    delete this.form.dataset.editId;
                } else {
                    showNotification('Error updating user.', 'error');
                    return;
                }
            } else {
                // Add new user
                DataManager.addUser(user);
                showNotification('User registered successfully!', 'success');
            }

            this.form.reset();
            document.querySelector('.strength-fill').className = 'strength-fill';
            updateUserCount();

            // Refresh current page data
            const currentHash = window.location.hash.slice(1) || 'home';
            if (currentHash === 'home') {
                loadUserList();
            } else if (currentHash === 'dashboard') {
                loadDashboard();
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            showNotification('Error saving user data.', 'error');
        }
    }
}

// DOM Manipulation Functions
function addUserToList(user) {
    // This function is now handled by DataManager
    // The list will be updated when pages load
}

function updateUserCount() {
    const users = DataManager.getUsers();
    const countElements = document.querySelectorAll('#user-count, #dashboard-user-count');
    countElements.forEach(element => {
        if (element) {
            element.textContent = users.length;
        }
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        background: ${type === 'success' ? '#38a169' : type === 'error' ? '#e53e3e' : '#667eea'};
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function loadUserList() {
    const userList = document.getElementById('user-list');
    if (!userList) return;

    const users = DataManager.getUsers();
    userList.innerHTML = '';

    if (users.length === 0) {
        userList.innerHTML = '<li>No users registered yet.</li>';
        return;
    }

    users.slice(-5).reverse().forEach(user => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="user-info">
                <strong>${user.name}</strong> (${user.email}) - Age: ${user.age}
                <br><small>Registered: ${new Date(user.registrationDate).toLocaleDateString()}</small>
            </div>
        `;
        userList.appendChild(li);
    });
}

function loadDashboard() {
    const users = DataManager.getUsers();
    const dashboardContent = document.getElementById('dashboard-content');
    if (!dashboardContent) return;

    // Stats
    const totalUsers = users.length;
    const avgAge = users.length > 0 ? Math.round(users.reduce((sum, user) => sum + parseInt(user.age), 0) / users.length) : 0;
    const recentUsers = users.filter(user => {
        const regDate = new Date(user.registrationDate);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return regDate > weekAgo;
    }).length;

    dashboardContent.innerHTML = `
        <div class="dashboard-grid">
            <div class="stat-card">
                <h3>${totalUsers}</h3>
                <p>Total Users</p>
            </div>
            <div class="stat-card">
                <h3>${avgAge}</h3>
                <p>Average Age</p>
            </div>
            <div class="stat-card">
                <h3>${recentUsers}</h3>
                <p>Users This Week</p>
            </div>
        </div>
        <h2>User Management</h2>
        <table class="user-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Age</th>
                    <th>Country</th>
                    <th>Registration Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="user-table-body">
            </tbody>
        </table>
    `;

    const tableBody = document.getElementById('user-table-body');
    if (!tableBody) return;

    users.forEach(user => {
        try {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name || 'N/A'}</td>
                <td>${user.email || 'N/A'}</td>
                <td>${user.phone || 'N/A'}</td>
                <td>${user.age || 'N/A'}</td>
                <td>${user.country || 'N/A'}</td>
                <td>${new Date(user.registrationDate).toLocaleDateString()}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editUser('${user.id}')">Edit</button>
                    <button class="action-btn delete-btn" onclick="deleteUser('${user.id}')">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        } catch (error) {
            console.error('Error creating table row for user:', user, error);
        }
    });
}

function editUser(id) {
    const user = DataManager.getUserById(id);
    if (!user) {
        showNotification('User not found.', 'error');
        return;
    }

    // Navigate to form first
    router.navigate('form');

    // Wait for form to load, then populate it
    const populateForm = () => {
        const form = document.getElementById('registration-form');
        if (form) {
            form.name.value = user.name || '';
            form.email.value = user.email || '';
            form.phone.value = user.phone || '';
            form.age.value = user.age || '';
            form.country.value = user.country || '';
            form.dataset.editId = id;

            // Update form title
            const title = form.parentElement.querySelector('h1');
            if (title) {
                title.textContent = 'Edit User Information';
            }

            // Change submit button text
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Update User';
            }
        } else {
            // If form not ready, try again
            setTimeout(populateForm, 50);
        }
    };

    setTimeout(populateForm, 100);
}

function deleteUser(id) {
    if (confirm('Are you sure you want to delete this user?')) {
        DataManager.deleteUser(id);
        loadDashboard();
        updateUserCount();
        showNotification('User deleted successfully!', 'success');
    }
}

// Page Content
const pages = {
    home: `
        <h1>Welcome to Advanced User Management System</h1>
        <p>Experience cutting-edge form validation, dynamic DOM manipulation, and seamless client-side routing.</p>
        <div id="dynamic-content">
            <h2>Recent Registrations</h2>
            <p>Total Users: <span id="user-count">0</span></p>
            <ul id="user-list"></ul>
            <a href="#dashboard" class="view-all-link">View All Users →</a>
        </div>
    `,
    form: `
        <h1>User Registration Form</h1>
        <form id="registration-form">
            <div class="form-group">
                <label for="name">Full Name:</label>
                <input type="text" id="name" name="name" required>
                <div class="error"></div>
            </div>
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" required>
                <div class="error"></div>
            </div>
            <div class="form-group">
                <label for="phone">Phone Number:</label>
                <input type="tel" id="phone" name="phone" placeholder="+1 (555) 123-4567" required>
                <div class="error"></div>
            </div>
            <div class="form-group">
                <label for="age">Age:</label>
                <input type="number" id="age" name="age" min="18" max="120" required>
                <div class="error"></div>
            </div>
            <div class="form-group">
                <label for="country">Country:</label>
                <select id="country" name="country" required>
                    <option value="">Select Country</option>
                    <option value="Afghanistan">Afghanistan</option>
                    <option value="Albania">Albania</option>
                    <option value="Algeria">Algeria</option>
                    <option value="Andorra">Andorra</option>
                    <option value="Angola">Angola</option>
                    <option value="Antigua and Barbuda">Antigua and Barbuda</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Armenia">Armenia</option>
                    <option value="Australia">Australia</option>
                    <option value="Austria">Austria</option>
                    <option value="Azerbaijan">Azerbaijan</option>
                    <option value="Bahamas">Bahamas</option>
                    <option value="Bahrain">Bahrain</option>
                    <option value="Bangladesh">Bangladesh</option>
                    <option value="Barbados">Barbados</option>
                    <option value="Belarus">Belarus</option>
                    <option value="Belgium">Belgium</option>
                    <option value="Belize">Belize</option>
                    <option value="Benin">Benin</option>
                    <option value="Bhutan">Bhutan</option>
                    <option value="Bolivia">Bolivia</option>
                    <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
                    <option value="Botswana">Botswana</option>
                    <option value="Brazil">Brazil</option>
                    <option value="Brunei">Brunei</option>
                    <option value="Bulgaria">Bulgaria</option>
                    <option value="Burkina Faso">Burkina Faso</option>
                    <option value="Burundi">Burundi</option>
                    <option value="Cabo Verde">Cabo Verde</option>
                    <option value="Cambodia">Cambodia</option>
                    <option value="Cameroon">Cameroon</option>
                    <option value="Canada">Canada</option>
                    <option value="Central African Republic">Central African Republic</option>
                    <option value="Chad">Chad</option>
                    <option value="Chile">Chile</option>
                    <option value="China">China</option>
                    <option value="Colombia">Colombia</option>
                    <option value="Comoros">Comoros</option>
                    <option value="Congo">Congo</option>
                    <option value="Costa Rica">Costa Rica</option>
                    <option value="Croatia">Croatia</option>
                    <option value="Cuba">Cuba</option>
                    <option value="Cyprus">Cyprus</option>
                    <option value="Czech Republic">Czech Republic</option>
                    <option value="Denmark">Denmark</option>
                    <option value="Djibouti">Djibouti</option>
                    <option value="Dominica">Dominica</option>
                    <option value="Dominican Republic">Dominican Republic</option>
                    <option value="East Timor">East Timor</option>
                    <option value="Ecuador">Ecuador</option>
                    <option value="Egypt">Egypt</option>
                    <option value="El Salvador">El Salvador</option>
                    <option value="Equatorial Guinea">Equatorial Guinea</option>
                    <option value="Eritrea">Eritrea</option>
                    <option value="Estonia">Estonia</option>
                    <option value="Eswatini">Eswatini</option>
                    <option value="Ethiopia">Ethiopia</option>
                    <option value="Fiji">Fiji</option>
                    <option value="Finland">Finland</option>
                    <option value="France">France</option>
                    <option value="Gabon">Gabon</option>
                    <option value="Gambia">Gambia</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Germany">Germany</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Greece">Greece</option>
                    <option value="Grenada">Grenada</option>
                    <option value="Guatemala">Guatemala</option>
                    <option value="Guinea">Guinea</option>
                    <option value="Guinea-Bissau">Guinea-Bissau</option>
                    <option value="Guyana">Guyana</option>
                    <option value="Haiti">Haiti</option>
                    <option value="Honduras">Honduras</option>
                    <option value="Hungary">Hungary</option>
                    <option value="Iceland">Iceland</option>
                    <option value="India">India</option>
                    <option value="Indonesia">Indonesia</option>
                    <option value="Iran">Iran</option>
                    <option value="Iraq">Iraq</option>
                    <option value="Ireland">Ireland</option>
                    <option value="Israel">Israel</option>
                    <option value="Italy">Italy</option>
                    <option value="Jamaica">Jamaica</option>
                    <option value="Japan">Japan</option>
                    <option value="Jordan">Jordan</option>
                    <option value="Kazakhstan">Kazakhstan</option>
                    <option value="Kenya">Kenya</option>
                    <option value="Kiribati">Kiribati</option>
                    <option value="Korea North">Korea North</option>
                    <option value="Korea South">Korea South</option>
                    <option value="Kosovo">Kosovo</option>
                    <option value="Kuwait">Kuwait</option>
                    <option value="Kyrgyzstan">Kyrgyzstan</option>
                    <option value="Laos">Laos</option>
                    <option value="Latvia">Latvia</option>
                    <option value="Lebanon">Lebanon</option>
                    <option value="Lesotho">Lesotho</option>
                    <option value="Liberia">Liberia</option>
                    <option value="Libya">Libya</option>
                    <option value="Liechtenstein">Liechtenstein</option>
                    <option value="Lithuania">Lithuania</option>
                    <option value="Luxembourg">Luxembourg</option>
                    <option value="Madagascar">Madagascar</option>
                    <option value="Malawi">Malawi</option>
                    <option value="Malaysia">Malaysia</option>
                    <option value="Maldives">Maldives</option>
                    <option value="Mali">Mali</option>
                    <option value="Malta">Malta</option>
                    <option value="Marshall Islands">Marshall Islands</option>
                    <option value="Mauritania">Mauritania</option>
                    <option value="Mauritius">Mauritius</option>
                    <option value="Mexico">Mexico</option>
                    <option value="Micronesia">Micronesia</option>
                    <option value="Moldova">Moldova</option>
                    <option value="Monaco">Monaco</option>
                    <option value="Mongolia">Mongolia</option>
                    <option value="Montenegro">Montenegro</option>
                    <option value="Morocco">Morocco</option>
                    <option value="Mozambique">Mozambique</option>
                    <option value="Myanmar">Myanmar</option>
                    <option value="Namibia">Namibia</option>
                    <option value="Nauru">Nauru</option>
                    <option value="Nepal">Nepal</option>
                    <option value="Netherlands">Netherlands</option>
                    <option value="New Zealand">New Zealand</option>
                    <option value="Nicaragua">Nicaragua</option>
                    <option value="Niger">Niger</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="North Macedonia">North Macedonia</option>
                    <option value="Norway">Norway</option>
                    <option value="Oman">Oman</option>
                    <option value="Pakistan">Pakistan</option>
                    <option value="Palau">Palau</option>
                    <option value="Palestine">Palestine</option>
                    <option value="Panama">Panama</option>
                    <option value="Papua New Guinea">Papua New Guinea</option>
                    <option value="Paraguay">Paraguay</option>
                    <option value="Peru">Peru</option>
                    <option value="Philippines">Philippines</option>
                    <option value="Poland">Poland</option>
                    <option value="Portugal">Portugal</option>
                    <option value="Qatar">Qatar</option>
                    <option value="Romania">Romania</option>
                    <option value="Russia">Russia</option>
                    <option value="Rwanda">Rwanda</option>
                    <option value="Saint Kitts and Nevis">Saint Kitts and Nevis</option>
                    <option value="Saint Lucia">Saint Lucia</option>
                    <option value="Saint Vincent and the Grenadines">Saint Vincent and the Grenadines</option>
                    <option value="Samoa">Samoa</option>
                    <option value="San Marino">San Marino</option>
                    <option value="Sao Tome and Principe">Sao Tome and Principe</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="Senegal">Senegal</option>
                    <option value="Serbia">Serbia</option>
                    <option value="Seychelles">Seychelles</option>
                    <option value="Sierra Leone">Sierra Leone</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Slovakia">Slovakia</option>
                    <option value="Slovenia">Slovenia</option>
                    <option value="Solomon Islands">Solomon Islands</option>
                    <option value="Somalia">Somalia</option>
                    <option value="South Africa">South Africa</option>
                    <option value="South Sudan">South Sudan</option>
                    <option value="Spain">Spain</option>
                    <option value="Sri Lanka">Sri Lanka</option>
                    <option value="Sudan">Sudan</option>
                    <option value="Suriname">Suriname</option>
                    <option value="Sweden">Sweden</option>
                    <option value="Switzerland">Switzerland</option>
                    <option value="Syria">Syria</option>
                    <option value="Taiwan">Taiwan</option>
                    <option value="Tajikistan">Tajikistan</option>
                    <option value="Tanzania">Tanzania</option>
                    <option value="Thailand">Thailand</option>
                    <option value="Togo">Togo</option>
                    <option value="Tonga">Tonga</option>
                    <option value="Trinidad and Tobago">Trinidad and Tobago</option>
                    <option value="Tunisia">Tunisia</option>
                    <option value="Turkey">Turkey</option>
                    <option value="Turkmenistan">Turkmenistan</option>
                    <option value="Tuvalu">Tuvalu</option>
                    <option value="Uganda">Uganda</option>
                    <option value="Ukraine">Ukraine</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="Uruguay">Uruguay</option>
                    <option value="Uzbekistan">Uzbekistan</option>
                    <option value="Vanuatu">Vanuatu</option>
                    <option value="Vatican City">Vatican City</option>
                    <option value="Venezuela">Venezuela</option>
                    <option value="Vietnam">Vietnam</option>
                    <option value="Yemen">Yemen</option>
                    <option value="Zambia">Zambia</option>
                    <option value="Zimbabwe">Zimbabwe</option>
                </select>
                <div class="error"></div>
            </div>
            <div class="form-group full-width">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
                <div class="password-strength">
                    <div class="strength-bar">
                        <div class="strength-fill"></div>
                    </div>
                </div>
                <div class="error"></div>
            </div>
            <div class="form-group full-width">
                <label for="confirmPassword">Confirm Password:</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required>
                <div class="error"></div>
            </div>
            <div class="form-group full-width">
                <button type="submit">Register</button>
            </div>
        </form>
    `,
    dashboard: `
        <h1>User Dashboard</h1>
        <div id="dashboard-content">
            <!-- Dashboard content will be loaded here -->
        </div>
    `,
    about: `
        <h1>About This Project</h1>
        <p>This advanced user management system showcases modern JavaScript techniques for form validation, DOM manipulation, data persistence, and client-side routing.</p>
        <div class="feature-grid">
            <div class="feature-card">
                <h3>🔐 Advanced Validation</h3>
                <p>Real-time form validation with complex password requirements and instant feedback.</p>
            </div>
            <div class="feature-card">
                <h3>💾 Data Persistence</h3>
                <p>User data is stored locally and persists across browser sessions.</p>
            </div>
            <div class="feature-card">
                <h3>📊 Interactive Dashboard</h3>
                <p>Comprehensive user management with statistics, editing, and deletion capabilities.</p>
            </div>
            <div class="feature-card">
                <h3>🚀 Smooth Routing</h3>
                <p>Client-side routing for seamless navigation without page reloads.</p>
            </div>
            <div class="feature-card">
                <h3>🎨 Modern UI</h3>
                <p>Professional design with animations, gradients, and responsive layout.</p>
            </div>
            <div class="feature-card">
                <h3>📱 Mobile Friendly</h3>
                <p>Fully responsive design that works perfectly on all devices.</p>
            </div>
        </div>
    `
};

// Initialize Router and Validator
const router = new Router();

router.addRoute('home', () => loadPage('home'));
router.addRoute('form', () => {
    loadPage('form');
    // Reset form title and button when navigating to form for new registration
    setTimeout(() => {
        const title = document.querySelector('#registration-form').parentElement.querySelector('h1');
        const submitBtn = document.querySelector('#registration-form button[type="submit"]');
        if (title) title.textContent = 'User Registration Form';
        if (submitBtn) submitBtn.textContent = 'Register';
        delete document.querySelector('#registration-form').dataset.editId;
    }, 50);
});
router.addRoute('dashboard', () => loadPage('dashboard'));
router.addRoute('about', () => loadPage('about'));

function loadPage(page) {
    try {
        const content = document.getElementById('content');
        if (!content) {
            console.error('Content element not found');
            return;
        }

        content.innerHTML = pages[page];

        // Initialize form validator if on form page
        if (page === 'form') {
            new FormValidator('registration-form');
        }

        // Load user list on home page
        if (page === 'home') {
            loadUserList();
            updateUserCount();
        }

        // Load dashboard
        if (page === 'dashboard') {
            loadDashboard();
        }
    } catch (error) {
        console.error('Error loading page:', page, error);
        showNotification('Error loading page. Please refresh.', 'error');
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Set initial route
        if (!window.location.hash) {
            window.location.hash = '#home';
        }

        // Initialize user count on load
        updateUserCount();
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});

// Add global error handler for unhandled errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showNotification('An unexpected error occurred. Please refresh the page.', 'error');
});

// Add handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showNotification('An unexpected error occurred. Please refresh the page.', 'error');
});