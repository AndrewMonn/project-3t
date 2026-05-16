import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IComprobantePago extends Document {
  familiaId: Types.ObjectId;
  jornadaId: Types.ObjectId;
  fechaPago: Date;
  referencia: string;
  imagen: string;
  estadoVerificacion: 'pendiente' | 'aprobado' | 'rechazado';
  comentarioAdmin?: string;
  verificadoPor?: Types.ObjectId;
  fechaVerificacion?: Date;
}

const ComprobantePagoSchema = new Schema<IComprobantePago>(
  {
    familiaId: { type: Schema.Types.ObjectId, ref: 'Familia', required: true, index: true },
    jornadaId: { type: Schema.Types.ObjectId, ref: 'Jornada', required: true, index: true },
    fechaPago: { type: Date, required: true },
    referencia: { type: String, required: true, trim: true },
    imagen: { type: String, required: true },
    estadoVerificacion: { type: String, enum: ['pendiente', 'aprobado', 'rechazado'], default: 'pendiente', index: true },
    comentarioAdmin: { type: String, trim: true },
    verificadoPor: { type: Schema.Types.ObjectId, ref: 'User' },
    fechaVerificacion: { type: Date },
  },
  { timestamps: true, toJSON: { transform: (_doc, ret) => { delete (ret as any).__v; return ret; } } }
);

export default mongoose.models.ComprobantePago || mongoose.model<IComprobantePago>('ComprobantePago', ComprobantePagoSchema);
