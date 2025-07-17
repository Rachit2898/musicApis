const router = require("express").Router();
const { Song } = require("../models/song");
const { PlayList } = require("../models/playList");
const auth = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Search songs and playlists
 */

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search for songs and playlists
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: true
 *         description: Search keyword
 *     responses:
 *       200:
 *         description: Songs and playlists matching the search
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 songs:
 *                   type: array
 *                   items:
 *                     type: object
 *                 playlists:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/", auth, async (req, res) => {
  const search = req.query.search;
  if (search !== "") {
    const songs = await Song.find({
      name: { $regex: search, $options: "i" },
    }).limit(10);
    const playlists = await PlayList.find({
      name: { $regex: search, $options: "i" },
    }).limit(10);
    const result = { songs, playlists };
    res.status(200).send(result);
  } else {
    res.status(200).send({});
  }
});

module.exports = router;
