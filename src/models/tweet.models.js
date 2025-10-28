/**
 * tweets [icon: message, color: cyan]{
  _id string pk
  owner string fk
  content string
  createdAt Date
  updatedAt Date
}
 */

import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema({
    content: {
        type: String,
        required: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},
    //createdAt Date
    //updatedAt Date
    {
        timestamps: true
    }
);

export const Tweet = mongoose.model("Tweet", tweetSchema);