const mongoose = require('mongoose');

const dbUri2 = "mongodb+srv://fantasma:Ehloqtedigo023@fantasma.4ks3l.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

// Database Account
// hc5166425@gmail.com
// Ehloqtedigo...

const dbUri = process.env.MONGODB_URI || "mongodb://localhost/numberdb";

const connectDB = async () => {
    try {
      await mongoose.connect(dbUri2, {
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