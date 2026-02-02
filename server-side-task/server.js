const express = require('express');
const app = express();
const port = 3000;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', './views');

// GET route to display the form
app.get('/', (req, res) => {
  res.render('index', { title: 'User Form' });
});

// POST route to handle form submission
app.post('/submit', (req, res) => {
  const { name, email, message } = req.body;
  
  // Validate that all fields are provided
  if (!name || !email || !message) {
    return res.status(400).render('index', {
      title: 'User Form',
      error: 'All fields are required!'
    });
  }
  
  // Pass the form data to the success template
  res.render('success', {
    title: 'Form Submission Success',
    userData: {
      name,
      email,
      message
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Press Ctrl+C to stop the server');
});
