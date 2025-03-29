import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import * as fs from 'fs';
import * as path from 'path';

export class FileUploadService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'merchant-logos');
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, this.uploadDir);
    },
    filename: (req, file, cb) => {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      cb(null, fileName);
    }
  });

  public upload = multer({
    storage: this.storage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpg|jpeg|png|gif)$/)) {
        cb(new Error('Only image files are allowed!'));
        return;
      }
      cb(null, true);
    },
  });

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const fileName = path.basename(fileUrl);
      const filePath = path.join(this.uploadDir, fileName);

      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      } else {
        throw new Error('File not found');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  getFileUrl(fileName: string): string {
    return path.join('/merchant-logos', fileName);
  }
}