import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { connect } from "mongoose";
import bcrypt from "bcrypt";

export default __dirname;

export async function connectMongo() {
  try {
    await connect(
      "mongodb+srv://lautaroSettembriniBackend:4815162342@backend2023coder.mvmxir8.mongodb.net/?retryWrites=true&w=majority"
    );
    console.log("plug mongo");
  } catch (e) {
    console.log(e);
    throw new Error("Error de conexión");
  }
}

export const createHash = (password) =>
  bcrypt.hashSync(password, bcrypt.genSaltSync(10));

export const isValidPassword = (password, hashPassword) =>
  bcrypt.compareSync(password, hashPassword);
