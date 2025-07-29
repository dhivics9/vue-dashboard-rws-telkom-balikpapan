import express from 'express';
import { 
    getAllDocuments, getDocumentById, uploadDocument, 
    deleteDocument, previewDocument, downloadDocument 
} from '../controllers/documentController.js';
import multer from 'multer';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });
const router = express.Router();

router.get('/', getAllDocuments);
router.post('/', upload.single('documentFile'), uploadDocument);
router.get('/:id', getDocumentById);
router.delete('/:id', deleteDocument);
router.get('/:id/preview', previewDocument);
router.get('/:id/download', downloadDocument);

export default router;