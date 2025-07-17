const router = require("express").Router();
const { User } = require("../models/user");
const bcrypt = require("bcrypt");

/**
 * @swagger
 * /auth:
 *   post:
 *     summary: Sign in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: string
 *                   description: JWT token
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid email or password
 */
router.post("/", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return res.status(400).send({ message: "invalid email or password!" });

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword)
    return res.status(400).send({ message: "Invalid email or password!" });

  const token = user.generateAuthToken();
  res.status(200).send({ data: token, message: "Signing in please wait..." });
});

module.exports = router;
