const cloudinary = require("cloudinary");

const dotenv = require("dotenv");

dotenv.config();

cloudinary.config({
  cloud_name: "dqc1x6xjp",
  api_key: "664969992894949",
  api_secret: "Zin3liv_BcOTX59yrOAB0m1b59E",
});

exports.uploads = (file, folder) => {
  return new Promise((resolve) => {
    cloudinary.uploader.upload(
      file,
      (result) => {
        resolve({
          url: result.url,
          id: result.public_id,
        });
      },
      { resource_type: "auto", folder: folder }
    );
  });
};
