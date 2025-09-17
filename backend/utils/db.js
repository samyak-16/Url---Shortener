import mongoose from 'mongoose';

const db = async () => {
  try {
    await mongoose.connect(process.env.MONGOOSE_URL);
    console.log('SuccessFully Connected to Database');
  } catch (error) {
    console.log('Error Connecting to database', error);
  }
};

export default db;
