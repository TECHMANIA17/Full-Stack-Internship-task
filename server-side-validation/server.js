const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Temporary storage for submitted data
const submittedData = [];

// ============================================
// SERVER-SIDE VALIDATION FUNCTIONS
// ============================================

/**
 * Validate full name
 * - Minimum 3 characters
 * - Only letters and spaces
 */
function validateFullName(fullName) {
    if (!fullName || typeof fullName !== 'string') {
        return 'Full name is required';
    }
    const trimmed = fullName.trim();
    if (trimmed.length < 3) {
        return 'Full name must be at least 3 characters';
    }
    if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
        return 'Full name can only contain letters and spaces';
    }
    return null;
}

/**
 * Validate email
 * - Valid email format
 * - Not already used (in demo)
 */
function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return 'Invalid email format';
    }
    // Check for duplicates in temporary storage
    if (submittedData.some(record => record.email.toLowerCase() === email.toLowerCase())) {
        return 'This email has already been registered';
    }
    return null;
}

/**
 * Validate phone number
 * - Format: 10 digits
 */
function validatePhone(phone) {
    if (!phone || typeof phone !== 'string') {
        return 'Phone number is required';
    }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.trim())) {
        return 'Invalid phone format. Use: 10 digits only (e.g., 1234567890)';
    }
    return null;
}

/**
 * Validate age
 * - Must be a number
 * - Between 18 and 120
 */
function validateAge(age) {
    if (age === null || age === undefined || age === '') {
        return 'Age is required';
    }
    const ageNum = parseInt(age);
    if (isNaN(ageNum)) {
        return 'Age must be a valid number';
    }
    if (ageNum < 18 || ageNum > 120) {
        return 'Age must be between 18 and 120';
    }
    return null;
}

/**
 * Validate country
 * - Must be selected from predefined list
 */
function validateCountry(country) {
    const validCountries = ['USA', 'UK', 'Canada', 'Australia', 'Other'];
    if (!country) {
        return 'Country is required';
    }
    if (!validCountries.includes(country)) {
        return 'Invalid country selection';
    }
    return null;
}

/**
 * Validate website (optional field)
 * - Must start with http:// or https://
 */
function validateWebsite(website) {
    if (!website) {
        return null; // Optional field
    }
    if (typeof website !== 'string') {
        return 'Website must be a valid string';
    }
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(website.trim())) {
        return 'URL must start with http:// or https://';
    }
    return null;
}

/**
 * Validate message
 * - Minimum 10 characters
 * - Maximum 500 characters
 */
function validateMessage(message) {
    if (!message || typeof message !== 'string') {
        return 'Message is required';
    }
    const trimmed = message.trim();
    if (trimmed.length < 10) {
        return 'Message must be at least 10 characters';
    }
    if (trimmed.length > 500) {
        return 'Message cannot exceed 500 characters';
    }
    return null;
}

/**
 * Validate agreement checkbox
 * - Must be true
 */
function validateAgreement(agreement) {
    if (agreement !== true) {
        return 'You must agree to the terms and conditions';
    }
    return null;
}

/**
 * Main validation function - validates all fields
 */
function validateFormData(data) {
    const errors = {};

    const fullNameError = validateFullName(data.fullName);
    if (fullNameError) errors.fullName = fullNameError;

    const emailError = validateEmail(data.email);
    if (emailError) errors.email = emailError;

    const phoneError = validatePhone(data.phone);
    if (phoneError) errors.phone = phoneError;

    const ageError = validateAge(data.age);
    if (ageError) errors.age = ageError;

    const countryError = validateCountry(data.country);
    if (countryError) errors.country = countryError;

    const websiteError = validateWebsite(data.website);
    if (websiteError) errors.website = websiteError;

    const messageError = validateMessage(data.message);
    if (messageError) errors.message = messageError;

    const agreementError = validateAgreement(data.agreement);
    if (agreementError) errors.agreement = agreementError;

    return Object.keys(errors).length === 0 ? null : errors;
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * POST /api/submit
 * Submit and validate form data
 */
app.post('/api/submit', (req, res) => {
    const data = req.body;

    // Validate form data
    const validationErrors = validateFormData(data);

    if (validationErrors) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validationErrors
        });
    }

    // Store the data temporarily with timestamp
    const storedData = {
        id: submittedData.length + 1,
        timestamp: new Date().toISOString(),
        ...data
    };

    submittedData.push(storedData);

    // Return success with the stored data
    res.status(200).json({
        success: true,
        message: 'Form submitted successfully',
        data: {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            age: data.age,
            country: data.country,
            website: data.website || '(Not provided)',
            message: data.message,
            agreement: data.agreement ? 'Yes' : 'No'
        },
        recordId: storedData.id
    });
});

/**
 * GET /api/data
 * Retrieve all submitted data (for admin purposes)
 */
app.get('/api/data', (req, res) => {
    res.json({
        count: submittedData.length,
        data: submittedData
    });
});

/**
 * GET /api/data/:id
 * Retrieve specific record
 */
app.get('/api/data/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const record = submittedData.find(r => r.id === id);

    if (!record) {
        return res.status(404).json({
            success: false,
            message: 'Record not found'
        });
    }

    res.json({
        success: true,
        data: record
    });
});

/**
 * DELETE /api/data/:id
 * Delete a record
 */
app.delete('/api/data/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = submittedData.findIndex(r => r.id === id);

    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: 'Record not found'
        });
    }

    const deleted = submittedData.splice(index, 1);
    res.json({
        success: true,
        message: 'Record deleted',
        data: deleted[0]
    });
});

/**
 * DELETE /api/data
 * Clear all data
 */
app.delete('/api/data', (req, res) => {
    const count = submittedData.length;
    submittedData.length = 0;

    res.json({
        success: true,
        message: `Cleared ${count} records`,
        count
    });
});

// ============================================
// SERVE HTML
// ============================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================
// ERROR HANDLING
// ============================================

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ✓ Server Running on http://localhost:${PORT}`);
    console.log(`  ✓ Form Page: http://localhost:${PORT}`);
    console.log(`  ✓ View Data: http://localhost:${PORT}/api/data`);
    console.log(`  ✓ Node.js Server-Side Validation Active`);
    console.log(`${'='.repeat(60)}\n`);
}).on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
});
