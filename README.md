# Student Management Portal

A full-stack student management system with webhook support for real-time data synchronization.

## Features

- ✅ **Student Management**: Create, read, update, and delete student records
- ✅ **Personal Information**: Store name, email, phone, address, and date of birth
- ✅ **Subject Marks**: Manage multiple subject marks for each student
- ✅ **Webhook Integration**: Automatically trigger webhooks when student data changes
- ✅ **Modern UI**: Beautiful, responsive user interface
- ✅ **Single Repository**: Frontend and backend in one codebase

## Tech Stack

- **Backend**: Node.js, Express.js, SQLite
- **Frontend**: React.js
- **Database**: SQLite (file-based, no setup required)

## Installation

1. **Install dependencies for both backend and frontend:**
   ```bash
   npm run install-all
   ```

   Or install separately:
   ```bash
   # Install backend dependencies
   npm install

   # Install frontend dependencies
   cd client
   npm install
   cd ..
   ```

2. **Set up environment variables (optional):**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   ```
   
   Edit `.env` file to customize configuration. See [Environment Variables](#environment-variables) section below.

## Running the Application

### Development Mode

1. **Start the backend server:**
   ```bash
   npm start
   ```
   The server will run on `http://localhost:5000`

2. **Start the frontend (in a new terminal):**
   ```bash
   cd client
   npm start
   ```
   The frontend will run on `http://localhost:3000`

### Production Mode

1. **Build the frontend:**
   ```bash
   cd client
   npm run build
   cd ..
   ```

2. **Start the server (serves both API and frontend):**
   ```bash
   npm start
   ```

## API Endpoints

### Students

- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get a specific student
- `POST /api/students` - Create a new student
- `PUT /api/students/:id` - Update a student
- `DELETE /api/students/:id` - Delete a student

### Webhooks

- `GET /api/webhooks` - Get all webhooks
- `POST /api/webhooks` - Create a new webhook
- `PUT /api/webhooks/:id` - Update a webhook (activate/deactivate)
- `DELETE /api/webhooks/:id` - Delete a webhook

## Webhook System

The webhook system automatically sends HTTP POST requests to configured URLs whenever student data changes.

### Webhook Payload Format

```json
{
  "event": "CREATE | UPDATE | DELETE",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "address": "123 Main St",
    "dateOfBirth": "2000-01-01",
    "marks": [
      {
        "subject": "Mathematics",
        "marks": 85,
        "maxMarks": 100
      }
    ]
  }
}
```

### Setting Up Webhooks

1. Open the application in your browser
2. Click "Manage Webhooks" button
3. Enter your webhook URL (e.g., `https://your-server.com/webhook`)
4. Click "Add Webhook"

The webhook will be triggered automatically on:
- Student creation
- Student update
- Student deletion

## Project Structure

```
.
├── server/
│   ├── index.js              # Main server file
│   ├── database/
│   │   └── db.js             # Database configuration
│   ├── routes/
│   │   ├── students.js       # Student routes
│   │   └── webhooks.js       # Webhook routes
│   └── services/
│       └── webhookService.js  # Webhook trigger service
├── client/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js            # Main app component
│       ├── components/
│       │   ├── StudentList.js
│       │   ├── StudentForm.js
│       │   └── WebhookManager.js
│       └── index.js
├── package.json
└── README.md
```

## Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the root directory (you can copy from `.env.example`):

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port number | `5000` |
| `NODE_ENV` | Environment mode (development/production) | `development` |
| `DB_PATH` | Path to SQLite database file | `server/database/students.db` |
| `WEBHOOK_TIMEOUT` | Webhook request timeout in milliseconds | `5000` |
| `CORS_ORIGIN` | CORS allowed origins (comma-separated or `*` for all) | `*` |

Example `.env` file:
```env
PORT=5000
NODE_ENV=development
DB_PATH=server/database/students.db
WEBHOOK_TIMEOUT=5000
CORS_ORIGIN=*
```

## Database Schema

### Students Table
- `id` (Primary Key)
- `name`
- `email` (Unique)
- `phone`
- `address`
- `dateOfBirth`
- `createdAt`
- `updatedAt`

### Marks Table
- `id` (Primary Key)
- `studentId` (Foreign Key)
- `subject`
- `marks`
- `maxMarks`
- `createdAt`
- `updatedAt`

### Webhooks Table
- `id` (Primary Key)
- `url`
- `isActive`
- `createdAt`

## License

ISC

