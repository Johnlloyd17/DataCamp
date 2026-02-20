import { MongoClient } from 'mongodb';

const uri = "mongodb://johnjohnnabac_db_user:XSRm9qzYvKfJjsRT@cluster0-shard-00-00.xk6wibh.mongodb.net:27017,cluster0-shard-00-01.xk6wibh.mongodb.net:27017,cluster0-shard-00-02.xk6wibh.mongodb.net:27017/?ssl=true&authSource=admin&retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function test() {
  try {
    await client.connect();
    const result = await client.db("admin").command({ ping: 1 });
    console.log("Connected!", result);
  } catch(e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
test();