const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// อ่านไฟล์ CA Certificate
const caCert = fs.readFileSync('C:\\Users\\Lenovo\\Downloads\\isrgrootx1.pem');

// เชื่อมต่อ TiDB Cloud ด้วย SSL
const db = mysql.createConnection({
  host: 'gateway01.us-west-2.prod.aws.tidbcloud.com', // หรือ host ของ TiDB Cloud
  user: '3cofk25L3pkaBhY.root', // หรือ user ของคุณ
  password: 'pBlFWmsKFjD7hlpZ', // ใส่ password ที่ตั้งไว้ใน TiDB Cloud
  database: 'image_db',
  port: 4000, // หรือ port ที่กำหนดใน TiDB Cloud
  ssl: {
    ca: caCert, // ใช้ CA Certificate ที่ดาวน์โหลดมา
    rejectUnauthorized: true // ยืนยันการเชื่อมต่อที่ปลอดภัย
  }
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to TiDB Cloud');
});

// API เพื่อดึงข้อมูลทั้งหมด
app.get('/images', (req, res) => {
  const sql = 'SELECT * FROM images';
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

// API เพื่อเพิ่มข้อมูล
app.post('/images', (req, res) => {
  const { title, description, image_url } = req.body;
  const sql = 'INSERT INTO images (title, description, image_url) VALUES (?, ?, ?)';
  db.query(sql, [title, description, image_url], (err, result) => {
    if (err) throw err;
    res.json({ message: 'Image added', id: result.insertId });
  });
});

// API เพื่อแก้ไขข้อมูล
app.put('/images/:id', (req, res) => {
  const { title, description, image_url } = req.body;
  const sql = 'UPDATE images SET title = ?, description = ?, image_url = ? WHERE id = ?';
  db.query(sql, [title, description, image_url, req.params.id], (err, result) => {
    if (err) throw err;
    res.json({ message: 'Image updated' });
  });
});

// API เพื่อลบข้อมูล
app.delete('/images/:id', (req, res) => {
  const sql = 'DELETE FROM images WHERE id = ?';
  db.query(sql, [req.params.id], (err, result) => {
    if (err) throw err;
    res.json({ message: 'Image deleted' });
  });
});

// รันเซิร์ฟเวอร์
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});