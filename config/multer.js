import multer from 'multer';


const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('image/')) {
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


const xlsxFileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel'
    ) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file format'), false);
    }
};

export const uploadXLSX = multer({
    storage: multer.memoryStorage(),
    fileFilter: xlsxFileFilter,
});