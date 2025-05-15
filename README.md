# AI-Powered Data Analysis Application

This application allows users to ask natural language questions about their business data and get AI-generated insights, visualizations, and SQL queries.

## Features

- Natural language query processing
- AI-generated SQL queries
- Dynamic data visualization
- Natural language summaries
- Raw data display
- Support for complex business questions

## Tech Stack

- Frontend: React with TypeScript, TailwindCSS, Recharts
- Backend: Node.js, Express
- Database: PostgreSQL
- AI: Google Gemini Pro

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- Google Gemini API key

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-data-agent
```

2. Install dependencies:
```bash
npm run install-all
```

3. Set up environment variables:
Create a `.env` file in the server directory with:
```
PORT=3001
DB_USER=postgres
DB_HOST=localhost
DB_NAME=ai_data_agent
DB_PASSWORD=your_password
DB_PORT=5432
GEMINI_API_KEY=your_gemini_api_key
```

4. Set up the database:
```bash
psql -U postgres
CREATE DATABASE ai_data_agent;
\c ai_data_agent
\i server/src/db/schema.sql
```

5. Start the development servers:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Usage

1. Open the application in your browser
2. Type your question in natural language (e.g., "Why did revenue dip last quarter?")
3. The AI will:
   - Generate and execute an appropriate SQL query
   - Create a visualization
   - Provide a natural language summary
   - Show the raw data

## Example Questions

- "What were our top 5 products by revenue last month?"
- "Show me sales trends by region over the past year"
- "Which customers have the highest lifetime value?"
- "What's the average order value by product category?"
- "Why did sales decrease in the North region last quarter?"

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT 