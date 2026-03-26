const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/notes', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, title, content, created_at FROM notes ORDER BY id DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('GET /notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

app.post('/notes', async (req, res) => {
  const { title, content } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING *',
      [title, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /notes error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/notes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM notes WHERE id = $1', [id]);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    console.error('DELETE /notes error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));