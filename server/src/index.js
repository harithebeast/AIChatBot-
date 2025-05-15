const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: 'ai_data_agent',  // Using the existing database
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test database connection
pool.connect()
  .then(() => console.log('Successfully connected to the database'))
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

// Gemini configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Initialize database tables
async function initializeDatabase() {
  try {
    // Create customers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        customer_id VARCHAR(5) PRIMARY KEY,
        company_name VARCHAR(40) NOT NULL,
        contact_name VARCHAR(30),
        contact_title VARCHAR(30),
        address VARCHAR(60),
        city VARCHAR(15),
        region VARCHAR(15),
        postal_code VARCHAR(10),
        country VARCHAR(15),
        phone VARCHAR(24),
        fax VARCHAR(24)
      );
    `);

    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        product_id SMALLINT PRIMARY KEY,
        product_name VARCHAR(40) NOT NULL,
        supplier_id SMALLINT,
        category_id SMALLINT,
        quantity_per_unit VARCHAR(20),
        unit_price REAL,
        units_in_stock SMALLINT,
        units_on_order SMALLINT,
        reorder_level SMALLINT,
        discontinued INTEGER NOT NULL
      );
    `);

    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id SMALLINT PRIMARY KEY,
        customer_id VARCHAR(5) REFERENCES customers(customer_id),
        employee_id SMALLINT,
        order_date DATE,
        required_date DATE,
        shipped_date DATE,
        ship_via SMALLINT,
        freight REAL,
        ship_name VARCHAR(40),
        ship_address VARCHAR(60),
        ship_city VARCHAR(15),
        ship_region VARCHAR(15),
        ship_postal_code VARCHAR(10),
        ship_country VARCHAR(15)
      );
    `);

    // Create order_details table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_details (
        order_id SMALLINT REFERENCES orders(order_id),
        product_id SMALLINT REFERENCES products(product_id),
        unit_price REAL NOT NULL,
        quantity SMALLINT NOT NULL,
        discount REAL NOT NULL,
        PRIMARY KEY (order_id, product_id)
      );
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Helper function to generate SQL from natural language
async function generateSQL(question) {
  const prompt = `
Given the following Northwind database schema in PostgreSQL:
- customers (customer_id VARCHAR(5), company_name VARCHAR(40), contact_name VARCHAR(30), contact_title VARCHAR(30), address VARCHAR(60), city VARCHAR(15), region VARCHAR(15), postal_code VARCHAR(10), country VARCHAR(15), phone VARCHAR(24), fax VARCHAR(24))
- products (product_id SMALLINT, product_name VARCHAR(40), supplier_id SMALLINT, category_id SMALLINT, quantity_per_unit VARCHAR(20), unit_price REAL, units_in_stock SMALLINT, units_on_order SMALLINT, reorder_level SMALLINT, discontinued INTEGER)
- categories (category_id SMALLINT, category_name VARCHAR(15), description TEXT, picture BYTEA)
- suppliers (supplier_id SMALLINT, company_name VARCHAR(40), contact_name VARCHAR(30), contact_title VARCHAR(30), address VARCHAR(60), city VARCHAR(15), region VARCHAR(15), postal_code VARCHAR(10), country VARCHAR(15), phone VARCHAR(24), fax VARCHAR(24), homepage TEXT)
- orders (order_id SMALLINT, customer_id VARCHAR(5), employee_id SMALLINT, order_date DATE, required_date DATE, shipped_date DATE, ship_via SMALLINT, freight REAL, ship_name VARCHAR(40), ship_address VARCHAR(60), ship_city VARCHAR(15), ship_region VARCHAR(15), ship_postal_code VARCHAR(10), ship_country VARCHAR(15))
- order_details (order_id SMALLINT, product_id SMALLINT, unit_price REAL, quantity SMALLINT, discount REAL)
- employees (employee_id SMALLINT, last_name VARCHAR(20), first_name VARCHAR(10), title VARCHAR(30), title_of_courtesy VARCHAR(25), birth_date DATE, hire_date DATE, address VARCHAR(60), city VARCHAR(15), region VARCHAR(15), postal_code VARCHAR(10), country VARCHAR(15), home_phone VARCHAR(24), extension VARCHAR(4), photo BYTEA, notes TEXT, reports_to SMALLINT, photo_path VARCHAR(255))
- shippers (shipper_id SMALLINT, company_name VARCHAR(40), phone VARCHAR(24))

Generate a PostgreSQL SQL query to answer this question: "${question}"
Important notes:
1. Use PostgreSQL date functions (TO_CHAR, DATE_TRUNC, etc.) instead of strftime
2. Use proper PostgreSQL data types
3. Return ONLY the raw SQL query without any markdown formatting, code blocks, or additional text
4. The response should be a single valid PostgreSQL statement that can be executed directly
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const sqlQuery = response.text().trim();

  // Remove any markdown formatting if present
  return sqlQuery.replace(/```sql|```/g, '').trim();
}

// Helper function to generate chart configuration
async function generateChartConfig(question, data) {
  const prompt = `
Given this question: "${question}"
And this data: ${JSON.stringify(data)}

Suggest the best chart type and configuration to visualize this data.
Return a JSON object with:
- chartType: "bar", "line", "pie", or "area"
- title: string
- xAxis: string (if applicable)
- yAxis: string (if applicable)
- dataKey: string (for the main data series)

Return ONLY the raw JSON object without any markdown formatting or additional text.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const jsonStr = response.text().trim();

  // Remove any markdown formatting if present
  const cleanJson = jsonStr.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Error parsing chart config:', error);
    // Return a default configuration if parsing fails
    return {
      chartType: "bar",
      title: "Data Visualization",
      xAxis: "Category",
      yAxis: "Value",
      dataKey: "value"
    };
  }
}

// Helper function to generate natural language summary
async function generateSummary(question, data) {
  const prompt = `
Given this question: "${question}"
And this data: ${JSON.stringify(data)}

Provide a natural language summary of the insights from this data.
Focus on key trends, patterns, and actionable insights.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

// Format summary to handle bold text (** **)
function parseSummary(summary) {
  const sections = summary.split('**');
  const points = [];

  for (let i = 1; i < sections.length; i += 2) {
    const title = sections[i].trim();
    const text = sections[i + 1]?.split('\n')[0].replace(/^\s*[:\-–]\s*/, '').trim(); // Remove ":" or "-" if any
    if (title && text) {
      points.push({ title, text });
    }
  }

  return points;
}

// Main endpoint to handle questions
app.post('/api/ask-question', async (req, res) => {
  try {
    const { question } = req.body;

    // Generate SQL query
    const sqlQuery = await generateSQL(question);

    // Execute query
    const result = await pool.query(sqlQuery);

    // Generate chart configuration
    const chartConfig = await generateChartConfig(question, result.rows);

    // Generate summary
    const summary = await generateSummary(question, result.rows);
    const summ = parseSummary(summary);
    
    res.json({
      data: result.rows,
      chartConfig,
      summary,
      sql: sqlQuery,
      query: question
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize database before starting the server
initializeDatabase().then(() => {
  // Start server
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Environment variables loaded:', {
      DB_USER: process.env.DB_USER ? 'Set' : 'Not set',
      DB_HOST: process.env.DB_HOST ? 'Set' : 'Not set',
      DB_PORT: process.env.DB_PORT ? 'Set' : 'Not set',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Set' : 'Not set'
    });
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});