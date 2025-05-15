const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `You are an expert data analyst and SQL developer. Your task is to:
1. Interpret natural language questions about business data
2. Generate appropriate SQL queries
3. Suggest the best visualization type for the data
4. Provide a natural language summary of the insights

The database schema includes:
- customers (customer_id, name, email, phone, created_at, last_purchase_date, segment, status)
- products (id, product_name, category, subcategory, price, cost, created_at, is_active, inventory_count)
- regions (region_id, name, country, state, city, population, is_active)
- sales (sale_id, customer_id, product_id, region_id, sale_date, quantity, unit_price, total_amount, payment_method, status, notes)

Handle data quality issues like NULLs, inconsistent types, and messy data.`;

async function processQuestion(question) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: question }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        const response = completion.choices[0].message.content;
        
        // Parse the response to extract SQL, visualization type, and summary
        const sqlMatch = response.match(/```sql\n([\s\S]*?)\n```/);
        const sql = sqlMatch ? sqlMatch[1].trim() : null;
        
        const visualizationMatch = response.match(/Visualization: (.*?)(?:\n|$)/);
        const visualizationType = visualizationMatch ? visualizationMatch[1].trim() : 'bar';
        
        // Extract summary (everything after the SQL block)
        const summary = response.split('```').pop().trim();

        // Generate a processed query description
        const processedQuery = `Processing question: "${question}"\n\n` +
            `Generated SQL query to analyze the data and provide insights.`;

        return {
            sql,
            visualizationType,
            summary,
            query: processedQuery,
            rawResponse: response
        };
    } catch (error) {
        console.error('Error processing question with AI:', error);
        throw new Error('Failed to process question with AI');
    }
}

module.exports = {
    processQuestion
}; 