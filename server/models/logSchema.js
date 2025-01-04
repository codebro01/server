import {Schema} from 'mongoose';

export const logSchema = new Schema({
  timestamp: { type: Date, default: Date.now },
  action: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
});