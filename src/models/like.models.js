/**
 * likes [icon: heart, color: blue]{
  _id string pk
  likedBy string fk
  commentId string fk
  videoId string fk
  tweetId string fk
  createdAt Date
  updatedAt Date
}
 */

import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({
    //either of 'video' , 'comment', or 'tweet' will be assigned others are null
    video:
    {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    comment:
    {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    tweet:
    {
        type: Schema.Types.ObjectId,
        ref: "Tweet"
    },
    likedBy:
    {
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

export const Like = mongoose.model("Like", likeSchema);