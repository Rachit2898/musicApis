const router = require("express").Router();
const { PlayList, validate } = require("../models/playList");
const { Song } = require("../models/song");
const { User } = require("../models/user");
const auth = require("../middleware/auth");
const validateObjectId = require("../middleware/validateObjectId");
const Joi = require("joi");

/**
 * @swagger
 * tags:
 *   name: Playlists
 *   description: Playlist management APIs
 */

/**
 * @swagger
 * /playlists:
 *   post:
 *     summary: Create a new playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               desc:
 *                 type: string
 *               img:
 *                 type: string
 *     responses:
 *       201:
 *         description: Playlist created
 *       400:
 *         description: Invalid input
 */
router.post("/", auth, async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send({ message: error.details[0].message });

  const user = await User.findById(req.user._id);
  const playList = await PlayList({ ...req.body, user: user._id }).save();
  user.playlists.push(playList._id);
  await user.save();

  res.status(201).send({ data: playList });
});

/**
 * @swagger
 * /playlists:
 *   get:
 *     summary: Get all playlists
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of playlists
 */
router.get("/", auth, async (req, res) => {
  const playlists = await PlayList.find();
  res.status(200).send({ data: playlists });
});

/**
 * @swagger
 * /playlists/favourite:
 *   get:
 *     summary: Get playlists created by current user
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's playlists
 */
router.get("/favourite", auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  const playlists = await PlayList.find({ _id: user.playlists });
  res.status(200).send({ data: playlists });
});

/**
 * @swagger
 * /playlists/{id}:
 *   get:
 *     summary: Get playlist by ID
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Playlist details
 *       404:
 *         description: Not found
 */
router.get("/:id", [validateObjectId, auth], async (req, res) => {
  const playlist = await PlayList.findById(req.params.id);
  if (!playlist) return res.status(404).send("not found");

  const songs = await Song.find({ _id: playlist.songs });
  res.status(200).send({ data: { playlist, songs } });
});

/**
 * @swagger
 * /playlists/edit/{id}:
 *   put:
 *     summary: Edit a playlist by ID
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               desc:
 *                 type: string
 *               img:
 *                 type: string
 *     responses:
 *       200:
 *         description: Playlist updated
 *       403:
 *         description: Not allowed
 */
router.put("/edit/:id", [validateObjectId, auth], async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    desc: Joi.string().allow(""),
    img: Joi.string().allow(""),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send({ message: error.details[0].message });

  const playlist = await PlayList.findById(req.params.id);
  if (!playlist) return res.status(404).send({ message: "Playlist not found" });

  const user = await User.findById(req.user._id);
  if (!user._id.equals(playlist.user))
    return res.status(403).send({ message: "User don't have access to edit!" });

  playlist.name = req.body.name;
  playlist.desc = req.body.desc;
  playlist.img = req.body.img;
  await playlist.save();

  res.status(200).send({ message: "Updated successfully" });
});

/**
 * @swagger
 * /playlists/add-song:
 *   put:
 *     summary: Add a song to a playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - playlistId
 *               - songId
 *             properties:
 *               playlistId:
 *                 type: string
 *               songId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Song added to playlist
 */
router.put("/add-song", auth, async (req, res) => {
  const schema = Joi.object({
    playlistId: Joi.string().required(),
    songId: Joi.string().required(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send({ message: error.details[0].message });

  const user = await User.findById(req.user._id);
  const playlist = await PlayList.findById(req.body.playlistId);
  if (!user._id.equals(playlist.user))
    return res.status(403).send({ message: "User don't have access to add!" });

  if (playlist.songs.indexOf(req.body.songId) === -1) {
    playlist.songs.push(req.body.songId);
  }
  await playlist.save();
  res.status(200).send({ data: playlist, message: "Added to playlist" });
});

/**
 * @swagger
 * /playlists/remove-song:
 *   put:
 *     summary: Remove a song from a playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - playlistId
 *               - songId
 *             properties:
 *               playlistId:
 *                 type: string
 *               songId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Song removed from playlist
 */
router.put("/remove-song", auth, async (req, res) => {
  const schema = Joi.object({
    playlistId: Joi.string().required(),
    songId: Joi.string().required(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send({ message: error.details[0].message });

  const user = await User.findById(req.user._id);
  const playlist = await PlayList.findById(req.body.playlistId);
  if (!user._id.equals(playlist.user))
    return res
      .status(403)
      .send({ message: "User don't have access to Remove!" });

  const index = playlist.songs.indexOf(req.body.songId);
  playlist.songs.splice(index, 1);
  await playlist.save();
  res.status(200).send({ data: playlist, message: "Removed from playlist" });
});

/**
 * @swagger
 * /playlists/{id}:
 *   delete:
 *     summary: Delete a playlist
 *     tags: [Playlists]
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
 *         description: Playlist deleted
 *       403:
 *         description: Not allowed
 */
router.delete("/:id", [validateObjectId, auth], async (req, res) => {
  const user = await User.findById(req.user._id);
  const playlist = await PlayList.findById(req.params.id);
  if (!user._id.equals(playlist.user))
    return res
      .status(403)
      .send({ message: "User don't have access to delete!" });

  const index = user.playlists.indexOf(req.params.id);
  user.playlists.splice(index, 1);
  await user.save();
  await playlist.remove();
  res.status(200).send({ message: "Removed from library" });
});

module.exports = router;
