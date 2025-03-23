# AI Legal Drafts

A full-stack web application for AI-generated legal drafts and contracts. The application allows users to input clauses, select a document type, and receive AI-powered clause recommendations. The system dynamically configures legal documents using pre-saved templates and provides multilingual support.

## Features

- **User Input Form**: Enter specific clauses and select document types (NDA, Lease Agreement, etc.)
- **AI Clause Recommendations**: AI-generated suggestions for relevant clauses
- **Direct AI Contract Generation**: Generate complete contracts directly from clauses without templates
- **Pre-Saved Templates**: Pre-stored legal templates for different document types
- **Multilingual Support**: Support for multiple languages when generating contracts
- **Preview & Download**: Review and export the final contract as a PDF
- **Save & Manage**: Save contracts to database and manage them in a list view

## Technology Stack

### Frontend
- React.js
- Material UI for styling
- React Router for navigation
- Axios for API calls

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- PDF-lib for PDF generation

### AI Integration
- Mock AI integration (can be replaced with actual AI model API)

## Project Structure

```
root/
├── frontend/               # React.js frontend
│   ├── public/
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Page components
│       ├── services/       # API services
│       ├── utils/          # Utility functions
│       └── context/        # React context
├── backend/                # Node.js backend
│   ├── controllers/        # Request handlers
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── scripts/            # Utility scripts
│   └── utils/              # Utility functions
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd ai-legal-drafts
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```
   cd ../frontend
   npm install
   ```

4. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ai-legal-drafts
   AI_API_URL=http://localhost:8000/generate
   NODE_ENV=development
   ```

5. Seed the database with initial templates:
   ```
   cd ../backend
   npm run seed
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## API Endpoints

- **GET /api/contracts** - Get all contracts
- **GET /api/contracts/:id** - Get a specific contract
- **POST /api/contracts** - Create a new contract
- **PUT /api/contracts/:id** - Update a contract
- **DELETE /api/contracts/:id** - Delete a contract
- **GET /api/contracts/:id/pdf** - Download contract as PDF
- **GET /api/templates** - Get all templates
- **GET /api/templates/type/:type** - Get templates by document type
- **POST /api/ai/suggest** - Get AI suggestions for clauses
- **POST /api/ai/generate** - Generate document from template and clauses
- **POST /api/ai/generate-contract** - Generate complete contract directly from clauses

## Deployment

- **Frontend**: Deploy to Vercel or Netlify
- **Backend**: Deploy to Render or Heroku
- **Database**: Use MongoDB Atlas
- **AI Model**: Host separately and access via API

## License

This project is licensed under the MIT License. 