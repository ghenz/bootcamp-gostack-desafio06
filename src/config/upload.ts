import multer from 'multer';
import path from 'path';
import { randomBytes } from 'crypto';

export default {
  storage: multer.diskStorage({
    destination: path.resolve(__dirname, '..', '..', 'tmp'),
    filename(request, file, callback) {
      const fileHash = randomBytes(10).toString('hex');
      const fileName = `${fileHash} - ${file.originalname}`;

      return callback(null, fileName);
    },
  }),
};
