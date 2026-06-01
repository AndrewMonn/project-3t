import mongoose, { Schema, Document } from 'mongoose';

export interface ISector extends Document {
  name: string;
  calles: string[];
}

const SectorSchema = new Schema<ISector>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    calles: { type: [String], default: [] },
  },
  { timestamps: true, toJSON: { transform: (_doc, ret) => { delete (ret as any).__v; return ret; } } }
);

export default mongoose.models.Sector || mongoose.model<ISector>('Sector', SectorSchema);
