import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPost extends Document {
  titulo: string;
  contenido: string;
  autor: Types.ObjectId;
  imagenPortada?: string;
  fechaPublicacion: Date;
  tags: string[];
  slug: string;
}

const PostSchema = new Schema<IPost>(
  {
    titulo: { type: String, required: true, trim: true, maxlength: 200 },
    contenido: { type: String, required: true },
    autor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    imagenPortada: { type: String },
    fechaPublicacion: { type: Date, default: Date.now, index: true },
    tags: { type: [String], default: [] },
    slug: { type: String, unique: true, index: true },
  },
  { timestamps: true, toJSON: { transform: (_doc, ret) => { delete ret.__v; return ret; } } }
);

PostSchema.pre('save', function (next) {
  if (this.isModified('titulo') || !this.slug) {
    this.slug = this.titulo.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 100);
  }
  next();
});

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
