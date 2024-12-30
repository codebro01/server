import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g., "create_user"
    description: { type: String }, // e.g., "Allows creation of new users"
});



export const Permissions = mongoose.model("Permissions", permissionSchema);