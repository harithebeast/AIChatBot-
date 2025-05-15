const express = require('express');
const router = express.Router();
const { processQuestion } = require('../services/aiService');
const db = require('../config/database');

router.post('/ask-question', async (req, res) => {
    try {
        const { question } = req.body;
        
        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        // Process the question with AI
        const aiResponse = await processQuestion(question);
        
        if (!aiResponse.sql) {
            return res.status(400).json({ error: 'Could not generate SQL query' });
        }

        // Execute the SQL query
        const queryResult = await db.query(aiResponse.sql);
        
        // Format the response
        const response = {
            data: queryResult.rows,
            visualizationType: aiResponse.visualizationType,
            summary: aiResponse.summary,
            sql: aiResponse.sql,
            query: question
        };

        res.json(response);
    } catch (error) {
        console.error('Error processing question:', error);
        res.status(500).json({ error: 'Failed to process question' });
    }
});

module.exports = router; 