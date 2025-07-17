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
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   name: Songs
 *   description: Song management APIs
 */

/**
 * @swagger
 * /songs/upload:
 *   post:
 *     summary: Upload a song file
 *     tags: [Songs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - songFile
 *               - name
 *               - artist
 *               - duration
 *             properties:
 *               songFile:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *               artist:
 *                 type: string
 *               duration:
 *                 type: string
 *               img:
 *                 type: string
 *               song:
 *                 type: string
 *     responses:
 *       201:
 *         description: Song uploaded successfully
 */
router.post("/upload", admin, upload.single("songFile"), async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send({ message: error.details[0].message });

  if (!req.file)
    return res.status(400).send({ message: "Song file is required" });

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
    res.status(201).send({ data: song, message: "Song uploaded successfully" });
  } catch (err) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /songs:
 *   get:
 *     summary: Get all songs
 *     tags: [Songs]
 *     responses:
 *       200:
 *         description: List of all songs
 */
router.get("/", async (req, res) => {
  const songs = await Song.find();
  res.status(200).send({ data: songs });
});

/**
 * @swagger
 * /songs:
 *   post:
 *     summary: Create a new song (no file upload)
 *     tags: [Songs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, artist]
 *             properties:
 *               name:
 *                 type: string
 *               artist:
 *                 type: string
 *               songFile:
 *                 type: string
 *               img:
 *                 type: string
 *               duration:
 *                 type: string
 *               song:
 *                 type: string
 *     responses:
 *       201:
 *         description: Song created successfully
 */
router.post("/", admin, async (req, res) => {
  const { error } = validate(req.body);
  if (error) res.status(400).send({ message: error.details[0].message });

  const song = await Song(req.body).save();
  res.status(201).send({ data: song, message: "Song created successfully" });
});

/**
 * @swagger
 * /songs/{id}:
 *   get:
 *     summary: Get a song by ID
 *     tags: [Songs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Song data
 *       404:
 *         description: Song not found
 */
router.get("/songs/:id", async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).send({ message: "Song not found" });
    res.status(200).send({ data: song });
  } catch (err) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /songs/{id}:
 *   put:
 *     summary: Update a song
 *     tags: [Songs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               artist:
 *                 type: string
 *               duration:
 *                 type: string
 *     responses:
 *       200:
 *         description: Song updated
 */
router.put("/:id", [validateObjectId, admin], async (req, res) => {
  const song = await Song.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.send({ data: song, message: "Updated song successfully" });
});

/**
 * @swagger
 * /songs/{id}:
 *   delete:
 *     summary: Delete a song
 *     tags: [Songs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Song deleted
 */
router.delete("/:id", [validateObjectId, admin], async (req, res) => {
  await Song.findByIdAndDelete(req.params.id);
  res.status(200).send({ message: "Song deleted sucessfully" });
});

/**
 * @swagger
 * /songs/like/{id}:
 *   put:
 *     summary: Like or unlike a song
 *     tags: [Songs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Like toggled
 */
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

/**
 * @swagger
 * /songs/like:
 *   get:
 *     summary: Get liked songs of a user
 *     tags: [Songs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of liked songs
 */
router.get("/like", auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  const songs = await Song.find({ _id: user.likedSongs });
  res.status(200).send({ data: songs });
});

module.exports = router;
