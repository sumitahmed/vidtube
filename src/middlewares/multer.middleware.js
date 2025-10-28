import multer from "multer";
//The disk storage engine gives you full control on storing files to disk.

//saved this on our server,
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

export const upload = multer({ storage });
