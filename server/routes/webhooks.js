const express = require('express');
const router = express.Router();
const {
  getAllWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook
} = require('../controllers/webhookController');


router.get('/', getAllWebhooks);
router.post('/', createWebhook);
router.put('/:id', updateWebhook);
router.delete('/:id', deleteWebhook);

module.exports = router;
