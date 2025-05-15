const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const OpenAI = require('openai');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Routes
app.post('/api/ask-question', async (req, res) => {
  try {
    const { question } = req.body;

    // 1. Generate SQL query using GPT-4
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a SQL expert. Generate SQL queries based on natural language questions. Return only the SQL query without any explanation."
        },
        {
          role: "user",
          content: question
        }
      ]
    });

    const generatedSQL = completion.choices[0].message.content;

    // 2. Execute the SQL query
    const queryResult = await pool.query(generatedSQL);

    // 3. Generate explanation and visualization suggestion
    const analysisCompletion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a data analyst. Analyze the query results and suggest appropriate visualizations. Return JSON in the format: {explanation: string, chartType: 'bar'|'line'|'pie', chartConfig: object}"
        },
        {
          role: "user",
          content: `Question: ${question}\nData: ${JSON.stringify(queryResult.rows)}`
        }
      ]
    });

    const analysis = JSON.parse(analysisCompletion.choices[0].message.content);

    res.json({
      data: queryResult.rows,
      sql: generatedSQL,
      ...analysis
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 