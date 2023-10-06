const mongoose = require("mongoose");
const Joi = require("joi");

const songSchema = new mongoose.Schema({
  name: { type: String },
  artist: { type: String },
  song: { type: String },
  img: { type: String },
  duration: { type: String },
  songFile: { type: String },
});

const validate = (song) => {
  const schema = Joi.object({
    name: Joi.string(),
    artist: Joi.string(),
    song: Joi.string(),
    img: Joi.string(),
    duration: Joi.number(),
  });
  return schema.validate(song);
};

const Song = mongoose.model("song", songSchema);

module.exports = { Song, validate };
