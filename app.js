const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const multer = require('multer')
const path = require('path');
const app = express();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
      cb(null,file.orginalname);
  }
});

const upload = multer({storgage:storage});

// Configure middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Set views directory
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Create MySQL connection
const connection = mysql.createConnection({
  host: 'sql.freedb.tech',
  user: 'freedb_santosh',
  password: 'UqgKAyjW#3tBY$k',
  port: 3306,
  database: 'freedb_C237Lesson12'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Routes for CRUD operations

// Route to retrieve and display the first three concerts
app.get('/', (req, res) => {
  const sql = 'SELECT * FROM concerts LIMIT 3';
  connection.query(sql, (err, results) => {
    if (err) throw err;
    res.render('index', { concerts: results });
  });
});

// Route to retrieve and display all concerts (for View All Concerts tab)
app.get('/viewAllConcerts', (req, res) => {
  const sql = 'SELECT * FROM concerts';
  connection.query(sql, (err, results) => {
    if (err) throw err;
    res.render('viewAllConcerts', { concerts: results });
  });
});


// Route to get a specific concert by ID
app.get('/concert/:id', (req, res) => {
  const concertId = parseInt(req.params.id);
  const sql = 'SELECT * FROM concerts WHERE id = ?';
  connection.query(sql, [concertId], (err, result) => {
    if (err) throw err;
    res.render('concertInfo', { concert: result[0] });
  });
});

// Add a new concert form
app.get('/addConcert', (req, res) => {
  res.render('addconcert');
});

// Add a new concert
app.post('/concertInfo',(req, res) => {
  const { event_name, price,} = req.body;

  const sql = 'INSERT INTO concerts (event_name, price) VALUES (?, ?)';
  connection.query(sql, [event_name, price], (err, result) => {
    if (err) throw err;
    res.redirect('/');
  });
});

// Update a concert by ID - First find the concert
app.get('/concert/:id/update', (req, res) => {
  const concertId = parseInt(req.params.id);
  const sql = 'SELECT * FROM concerts WHERE id = ?';
  connection.query(sql, [concertId], (err, result) => {
    if (err) throw err;
    res.render('updateConcert', { concert: result[0] });
  });
});

// Update a concert by ID - Update the concert information
app.post('/concert/:id/update',(req, res) => {
  const concertId = parseInt(req.params.id);
  const { event_name, price } = req.body;
  
  const sql = 'UPDATE concerts SET event_name = ?, price = ?, image_path = ?, WHERE id = ?';
  connection.query(sql, [event_name, price, concertId], (err, result) => {
    if (err) throw err;
    res.redirect('/');
  });
});

// Delete a concert by ID
app.get('/concert/:id/delete', (req, res) => {
  const concertId = parseInt(req.params.id);
  const sql = 'DELETE FROM concerts WHERE id = ?';
  connection.query(sql, [concertId], (err, result) => {
    if (err) throw err;
    res.redirect('/');
  });
});

app.get('/contact', (req, res) => {
  res.render('contact');
});


// Add to cart
app.post('/cart/add', (req, res) => {
  const { concert_id, quantity } = req.body;
  const sql = 'INSERT INTO tickets (concert_id, quantity) VALUES (?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)';
  connection.query(sql, [concert_id, quantity], (err, result) => {
      if (err) throw err;
      res.redirect('/cart');
  });
});

// View cart
app.get('/cart', (req, res) => {
  const sql = `
      SELECT t.id, t.quantity, c.event_name, c.price 
      FROM tickets t
      JOIN concerts c ON t.concert_id = c.id
  `;
  connection.query(sql, (err, results) => {
      if (err) throw err;
      res.render('cart', { cart: results });
  });
});

// Update cart item
app.post('/cart/update', (req, res) => {
  const { id, quantity } = req.body;
  const sql = 'UPDATE tickets SET quantity = ? WHERE id = ?';
  connection.query(sql, [quantity, id], (err, result) => {
      if (err) throw err;
      res.redirect('/cart');
  });
});

// Remove from cart
app.post('/cart/delete', (req, res) => {
  const { id } = req.body;
  const sql = 'DELETE FROM tickets WHERE id = ?';
  connection.query(sql, [id], (err, result) => {
      if (err) throw err;
      res.redirect('/cart');
  });
});


// Pay and save cart items to orders
app.post('/cart/pay', (req, res) => {
  const sqlSelect = 'SELECT concert_id, quantity FROM tickets';
  const sqlInsert = 'INSERT INTO orders (concert_id, quantity) VALUES ?';
  connection.query(sqlSelect, (err, cartItems) => {
      if (err) throw err;

      if (cartItems.length === 0) {
          return res.redirect('/cart');
      }

      const orderData = cartItems.map(item => [item.concert_id, item.quantity]);

      connection.query(sqlInsert, [orderData], (err, result) => {
          if (err) throw err;

          // Clear the cart
          const sqlDelete = 'DELETE FROM tickets';
          connection.query(sqlDelete, (err, result) => {
              if (err) throw err;
              res.redirect('/cart');
          });
      });
  });
});


// Start the server and listen on the specified port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});