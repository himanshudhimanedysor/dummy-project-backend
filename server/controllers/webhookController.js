const { getDatabase } = require('../database/db');

const getAllWebhooks = async (req, res) => {
  try {
    const db = getDatabase();
    
    const [webhooks] = await db.query(`
      SELECT * FROM webhooks ORDER BY createdAt DESC
    `);
    
    res.json(webhooks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createWebhook = async (req, res) => {
  try {
    const db = getDatabase();
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
    
    const [result] = await db.query(`
      INSERT INTO webhooks (url, isActive)
      VALUES (?, 1)
    `, [url]);
    
    const [webhooks] = await db.query(`
      SELECT * FROM webhooks WHERE id = ?
    `, [result.insertId]);
    
    res.status(201).json(webhooks[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateWebhook = async (req, res) => {
  try {
    const db = getDatabase();
    const webhookId = req.params.id;
    const { isActive, url } = req.body;
    
    const updates = [];
    const params = [];
    
    if (url !== undefined) {
      try {
        new URL(url);
        updates.push('url = ?');
        params.push(url);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid URL format' });
      }
    }
    
    if (isActive !== undefined) {
      updates.push('isActive = ?');
      params.push(isActive ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(webhookId);
    
    const [result] = await db.query(`
      UPDATE webhooks SET ${updates.join(', ')} WHERE id = ?
    `, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    const [webhooks] = await db.query(`
      SELECT * FROM webhooks WHERE id = ?
    `, [webhookId]);
    
    res.json(webhooks[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteWebhook = async (req, res) => {
  try {
    const db = getDatabase();
    const webhookId = req.params.id;
    
    const [result] = await db.query(`
      DELETE FROM webhooks WHERE id = ?
    `, [webhookId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    res.json({ message: 'Webhook deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook
};


