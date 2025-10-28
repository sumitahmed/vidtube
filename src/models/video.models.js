/**
 * _id string pk
  videoFile string
  thumbnail string
  owner string fk
  title string
  description string
  duration string
  views number
  isPublished boolean 
  createdAt Date
  updatedAt Date
 */

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";

const videoSchema = new Schema({
    videoFile:
    {
        type: String,
        required: true
    },
    thumbnail:
    {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    views: {
        type: Number,
        default: 0
    },
    duration: {
        type: Number,
        required: true
    },
    isPublished: {
        type: Boolean,
        default: true
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

    })

videoSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model("Video", videoSchema)
