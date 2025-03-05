const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// เชื่อมต่อ TiDB Cloud โดยใช้ SSL option แบบง่ายขึ้น
const db = mysql.createConnection({
  host: 'gateway01.us-west-2.prod.aws.tidbcloud.com', 
  user: '3cofk25L3pkaBhY.root',
  password: 'pBlFWmsKFjD7hlpZ',
  database: 'image_db',
  port: 4000,
  ssl: {
    rejectUnauthorized: true 
  }
});

// เชื่อมต่อฐานข้อมูล
db.connect((err) => {
  if (err) {
    console.error('Error connecting to TiDB Cloud:', err);
    process.exit(1); // ออกจากกระบวนการถ้าเชื่อมต่อฐานข้อมูลไม่สำเร็จ
  }
  console.log('Connected to TiDB Cloud');
});

// Route สำหรับ path "/"
app.get('/', (req, res) => {
  res.send('Welcome to the Image Gallery Backend!');
});

// API เพื่อดึงข้อมูลทั้งหมด
app.get('/images', (req, res) => {
  const sql = 'SELECT * FROM images';
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error querying images:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(result);
  });
});

// API เพื่อเพิ่มข้อมูล
app.post('/images', (req, res) => {
  const { title, description, image_url } = req.body;

  // ตรวจสอบข้อมูลที่ส่งมา
  if (!title || !description || !image_url) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sql = 'INSERT INTO images (title, description, image_url) VALUES (?, ?, ?)';
  db.query(sql, [title, description, image_url], (err, result) => {
    if (err) {
      console.error('Error adding image:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Image added', id: result.insertId });
  });
});

// API เพื่อแก้ไขข้อมูล
app.put('/images/:id', (req, res) => {
  const { title, description, image_url } = req.body;
  const { id } = req.params;

  // ตรวจสอบข้อมูลที่ส่งมา
  if (!title || !description || !image_url) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sql = 'UPDATE images SET title = ?, description = ?, image_url = ? WHERE id = ?';
  db.query(sql, [title, description, image_url, id], (err, result) => {
    if (err) {
      console.error('Error updating image:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.json({ message: 'Image updated' });
  });
});

// API เพื่อลบข้อมูล
app.delete('/images/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM images WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting image:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.json({ message: 'Image deleted' });
  });
});

// รันเซิร์ฟเวอร์
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});