const router = require("express").Router();
const { User } = require("../models/user");
const { Song, validate } = require("../models/song");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const cloudinary = require("../middleware/cloudinary");
const validateObjectId = require("../middleware/validateObjectId");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/"); // Specify the directory where files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Rename the uploaded file to avoid overwriting
  },
});

const upload = multer({
  storage: storage,
});

router.post("/upload", admin, upload.single("songFile"), async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send({ message: error.details[0].message });

  if (!req.file) {
    return res.status(400).send({ message: "Song file is required" });
  }

  const uploader = async (path) => await cloudinary.uploads(path, "Songs");

  const path = req.file.path;
  const newPath = await uploader(path);

  const song = new Song({
    name: req.body.name,
    artist: req.body.artist,
    songFile: newPath.url,
    img: req.body.img,
    duration: req.body.duration,
    song: req.body.song,
  });

  try {
    await song.save();
    res.status(201).send({
      data: song,
      message: "Song uploaded successfully",
    });
  } catch (err) {
    console.error("Error uploading song:", err);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

router.get("/songs/:id", async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).send({ message: "Song not found" });
    }

    res.status(200).send({ data: song });
  } catch (err) {
    console.error("Error retrieving song by ID:", err);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Create song
router.post("/", admin, async (req, res) => {
  const { error } = validate(req.body);
  if (error) res.status(400).send({ message: error.details[0].message });

  const song = await Song(req.body).save();
  res.status(201).send({ data: song, message: "Song created successfully" });
});

// Get all songs
router.get("/", async (req, res) => {
  const songs = await Song.find();
  res.status(200).send({ data: songs });
});

// Update song
router.put("/:id", [validateObjectId, admin], async (req, res) => {
  const song = await Song.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.send({ data: song, message: "Updated song successfully" });
});

// Delete song by ID
router.delete("/:id", [validateObjectId, admin], async (req, res) => {
  await Song.findByIdAndDelete(req.params.id);
  res.status(200).send({ message: "Song deleted sucessfully" });
});

// Like song
router.put("/like/:id", [validateObjectId, auth], async (req, res) => {
  let resMessage = "";
  const song = await Song.findById(req.params.id);
  if (!song) return res.status(400).send({ message: "song does not exist" });

  const user = await User.findById(req.user._id);
  const index = user.likedSongs.indexOf(song._id);
  if (index === -1) {
    user.likedSongs.push(song._id);
    resMessage = "Added to your liked songs";
  } else {
    user.likedSongs.splice(index, 1);
    resMessage = "Removed from your liked songs";
  }

  await user.save();
  res.status(200).send({ message: resMessage });
});

// Get liked songs
router.get("/like", auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  const songs = await Song.find({ _id: user.likedSongs });
  res.status(200).send({ data: songs });
});

module.exports = router;
