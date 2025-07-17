const mongoose = require("mongoose");

module.exports = async () => {
  const connectionParams = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };
  try {
    await mongoose.connect(
      "mongodb+srv://merachitt2898:177k8dBr2gnKTqgc@cluster0.buyr7.mongodb.net/musicApp",
      connectionParams
    );
    console.log("connected to database successfully");
  } catch (error) {
    console.log("could not connect to database.", error);
  }
};
