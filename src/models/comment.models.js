/**
 * comments [icon: chat, color: gray]{
  _id string pk
  content string
  videoId string fk
  owner string fk
  createdAt Date
  updatedAt Date
}
 */

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";

const commentSchema = new Schema({
    content: {
        type: String,
        required: true,
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
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
commentSchema.plugin(mongooseAggregatePaginate);
export const Comment = mongoose.model("Comment", commentSchema);