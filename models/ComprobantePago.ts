// models/ComprobantePago.ts
// MODIFICADO: el campo `imagen` ahora almacena el Data URL Base64 directamente en MongoDB.
// Se eliminó la dependencia de archivos en disco (public/uploads/comprobantes/).
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IComprobantePago extends Document {
  familiaId: Types.ObjectId;
  jornadaId: Types.ObjectId;
  fechaPago: Date;
  referencia: string;
  /** Data URL Base64: "data:image/png;base64,iVBOR..."
   *  Se guarda directamente en MongoDB, sin archivos en disco.
   */
  imagen: string;
  /** MIME type de la imagen original (ej: "image/png") */
  imagenMimeType?: string;
  /** Tamaño original del archivo en bytes (antes de convertir a Base64) */
  imagenTamanio?: number;
  estadoVerificacion: 'pendiente' | 'aprobado' | 'rechazado';
  comentarioAdmin?: string;
  verificadoPor?: Types.ObjectId;
  fechaVerificacion?: Date;
}

const ComprobantePagoSchema = new Schema<IComprobantePago>(
  {
    familiaId:  { type: Schema.Types.ObjectId, ref: 'Familia', required: true, index: true },
    jornadaId:  { type: Schema.Types.ObjectId, ref: 'Jornada', required: true, index: true },
    fechaPago:  { type: Date, required: true },
    referencia: { type: String, required: true, trim: true },

    // Imagen como Base64 Data URL (ej: "data:image/png;base64,...")
    imagen:          { type: String, required: true },
    imagenMimeType:  { type: String },   // "image/png" | "image/jpeg" | "image/webp"
    imagenTamanio:   { type: Number },   // tamaño original en bytes

    estadoVerificacion: {
      type: String,
      enum: ['pendiente', 'aprobado', 'rechazado'],
      default: 'pendiente',
      index: true,
    },
    comentarioAdmin: { type: String, trim: true },
    verificadoPor:   { type: Schema.Types.ObjectId, ref: 'User' },
    fechaVerificacion: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

export default mongoose.models.ComprobantePago ||
  mongoose.model<IComprobantePago>('ComprobantePago', ComprobantePagoSchema);
