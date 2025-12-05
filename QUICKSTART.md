# Quick Start Guide

## Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation & Setup

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Start the backend server (Terminal 1):**
   ```bash
   npm start
   ```
   Server will run on `http://localhost:5000`

3. **Start the frontend (Terminal 2):**
   ```bash
   cd client
   npm start
   ```
   Frontend will open automatically at `http://localhost:3000`

## Using the Application

### Adding a Student
1. Click the **"+ Add Student"** button
2. Fill in the student's personal information (Name and Email are required)
3. Add subject marks by clicking **"+ Add Subject"**
4. Click **"Save"** to create the student

### Editing a Student
1. Click the **"Edit"** button on any student card
2. Modify the information
3. Click **"Update"** to save changes

### Managing Webhooks
1. Click **"Manage Webhooks"** button
2. Enter a webhook URL (e.g., `https://your-server.com/webhook`)
3. Click **"Add Webhook"**
4. Webhooks will automatically trigger when students are created, updated, or deleted

## Testing Webhooks

You can test webhooks using a service like:
- **Webhook.site**: https://webhook.site (provides a unique URL to test webhooks)
- **RequestBin**: https://requestbin.com (similar service)

Just copy the provided URL and add it as a webhook in the application.

## Production Deployment

1. **Build the frontend:**
   ```bash
   cd client
   npm run build
   cd ..
   ```

2. **Start the server:**
   ```bash
   npm start
   ```
   The server will serve both the API and the React app on port 5000.

## Troubleshooting

- **Port already in use**: Change the PORT in `server/index.js` or set `PORT=5001 npm start`
- **Database errors**: Delete `server/database/students.db` and restart the server
- **Module not found**: Run `npm install` in both root and `client` directories

