const multer = require('multer');
const db = require('../db');

// ตั้งค่าที่เก็บไฟล์ที่อัปโหลด
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const filename = `${timestamp}-${file.originalname}`;  
        cb(null, filename);
    }
});

const upload = multer({ storage });

// API สำหรับการอัปโหลดไฟล์
exports.uploadFile = (req, res) => {
    const file = req.file; 
    const username = req.body.username; 

    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!username) {
        return res.status(400).json({ message: 'No username provided' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;

    db.query('INSERT INTO files (username, filename) VALUES (?, ?)', [username, file.filename], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        res.status(200).json({
            message: 'File uploaded successfully',
            filename: file.filename,
            fileUrl: fileUrl 
        });
    });
};

// Middleware สำหรับการอัปโหลดไฟล์
exports.upload = upload.single('file');

const getLatestImages = async (req, res) => {
    const username = req.query.username;
    
    try {
        // Query 1: ดึงข้อมูลจาก table files สำหรับ user-specific image ล่าสุด
        const [userFile] = await db.query(
            `SELECT filename FROM files WHERE username = ? ORDER BY upload_time DESC LIMIT 1`, 
            [username]
        );

        // Query 2: ดึงข้อมูลจาก table fileup สำหรับค่า name และ prob ล่าสุด
        const [latestFileup] = await db.query(
            `SELECT name, prob FROM fileup ORDER BY created_at DESC LIMIT 1`
        );

        // ตรวจสอบว่ามีข้อมูลหรือไม่
        console.log('userFile:', userFile); // แสดงข้อมูล userFile ในคอนโซล
        console.log('latestFileup:', latestFileup); // แสดงข้อมูล latestFileup ในคอนโซล

        if (userFile.length && latestFileup.length) {
            res.json({
                image_url: `/uploads/${userFile[0].filename}`,
                name: latestFileup[0].name,
                prob: latestFileup[0].prob
            });
        } else {
            res.status(404).json({ message: "No upload data found for the user." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error." });
    }
};


exports.getLatestImages = getLatestImages; // ส่งออกฟังก์ชันนี้ด้วย
