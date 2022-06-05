const mongoose = require('mongoose');

const dbUri = "mongodb+srv://fantasma:Ehloqtedigo023@fantasma.4ks3l.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

// Database Account
// hc5166425@gmail.com
// Ehloqtedigo...


const connectDB = async () => {
    try {
      await mongoose.connect(dbUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // useCreateIndex: true,
        // useFindAndModify: false
      });
  
      console.log('MongoDB Connected...');
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
};
  
module.exports = connectDB