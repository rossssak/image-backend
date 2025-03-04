const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
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
    // ใช้ค่า default ของ Node.js TLS แทนการใช้ custom CA cert
    rejectUnauthorized: true 
  }
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to TiDB Cloud:', err);
    // ถ้าเกิด error ให้ลองแบบไม่ใช้ SSL ก็ได้ (ใช้เฉพาะสำหรับ development)
    // หรืออาจจะไม่ควรเปิดใช้ตัวเลือกนี้หากต้องการความปลอดภัย
    /*
    console.log('Trying to connect without SSL...');
    db = mysql.createConnection({
      host: 'gateway01.us-west-2.prod.aws.tidbcloud.com', 
      user: '3cofk25L3pkaBhY.root',
      password: 'pBlFWmsKFjD7hlpZ',
      database: 'image_db',
      port: 4000
    });
    db.connect((err) => {
      if (err) {
        console.error('Error connecting without SSL:', err);
      } else {
        console.log('Connected to TiDB Cloud without SSL');
      }
    });
    */
  } else {
    console.log('Connected to TiDB Cloud');
  }
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
  const sql = 'UPDATE images SET title = ?, description = ?, image_url = ? WHERE id = ?';
  db.query(sql, [title, description, image_url, req.params.id], (err, result) => {
    if (err) {
      console.error('Error updating image:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Image updated' });
  });
});

// API เพื่อลบข้อมูล
app.delete('/images/:id', (req, res) => {
  const sql = 'DELETE FROM images WHERE id = ?';
  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error('Error deleting image:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Image deleted' });
  });
});

// รันเซิร์ฟเวอร์
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});