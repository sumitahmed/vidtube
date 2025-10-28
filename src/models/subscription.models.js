/**
 * subscriptions [icon: users, color: orange]{
  _id string pk
  subscriber string fk // The user who is subscribing
  channel string fk // The user who is being subscribed to
  createdAt Date
  updatedAt Date
}
 */

import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, //one who is SUBSRIBING
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, //one to whom 'subsriber' is SUBSCRIBING
        ref: "User",
    },

},
    //createdAt Date
    //updatedAt Date
    {
        timestamps: true


    }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);