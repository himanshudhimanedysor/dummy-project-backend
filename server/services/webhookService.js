const axios = require('axios');
const { getDatabase } = require('../database/db');

async function triggerWebhooks(event, studentData) {
  try {
    const db = getDatabase();
    
    const [webhooks] = await db.query(`
      SELECT url FROM webhooks WHERE isActive = 1
    `);
    
    if (webhooks.length === 0) {
      console.log('No active webhooks to trigger');
      return;
    }
    
   
    const payload = {
      event: event,
      timestamp: new Date().toISOString(),
      data: studentData
    };
    // console.log("payload",payload)
    const webhookTimeout = parseInt(process.env.WEBHOOK_TIMEOUT) || 5000;
    
    const promises = webhooks.map(webhook => {
      return axios.post(webhook.url, payload, {
        timeout: webhookTimeout,
       headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiZjI3OTVhY2ItMzkzYy00ZjlkLTk3ZGItYzkzODI5NDUyZDEyIiwiZW1haWwiOiJhdGlzaGF5YUBlZHlzb3IuYWkiLCJyb2xlIjoiY29tcGFueSJ9LCJleHBpcmVzIjoxNzY0OTc4MDQzLCJpYXQiOjE3NjQ5NDIwNDN9._rf_1WJC5FsCzsFHL55NlUibPPhgIRoleRYvOGLkJzg`,
        "Content-Type": "application/json"
}

      }).catch(error => {
        console.error(`Webhook failed for ${webhook.url}:`, error.message);
      });
    });

    // console.log("payload",promises)

    
    await Promise.allSettled(promises);
    console.log(`Triggered ${webhooks.length} webhook(s) for event: ${event}`);
  } catch (error) {
    console.error('Error triggering webhooks:', error);
  }
}

module.exports = {
  triggerWebhooks
};
