const mongoose = require("mongoose");

module.exports = async () => {
  const connectionParams = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };
  try {
    await mongoose.connect(
      "mongodb+srv://rachit:1234@cluster0.qkhsycr.mongodb.net/musicApp",
      connectionParams
    );
    console.log("connected to database successfully");
  } catch (error) {
    console.log("could not connect to database.", error);
  }
};
