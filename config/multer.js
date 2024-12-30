import multer from 'multer';


const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
        cb(null, true)
    }
    else{
        cb(new Error('Unsupported file format', false))
    }
}

export const upload = multer({
    storage,
    fileFilter, 
    });