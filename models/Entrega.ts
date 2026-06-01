// @docs: Removed unique index { familiaId, jornadaId } to allow duplicate-benefit requests
// @docs: Added tipoSolicitud ('beneficio'|'otra') + asunto for custom "Otras Solicitudes"
// @docs: jornadaId now optional (not required for 'otra' tipo)
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IHistorialEntry {
  fecha: Date;
  usuario: string;
  usuarioId: Types.ObjectId;
  accion: 'comentario' | 'cambio_estado';
  contenido: string;
}

export interface IEntrega extends Document {
  familiaId: Types.ObjectId;
  jornadaId?: Types.ObjectId;
  tipoSolicitud: 'beneficio' | 'otra';
  asunto?: string;
  estadoPago: 'pendiente' | 'pagado' | 'verificado';
  montoPagado: number;
  fechaPago?: Date;
  confirmacionEntrega: boolean;
  fechaConfirmacion?: Date;
  observaciones?: string;
  historial: IHistorialEntry[];
}

const EntregaSchema = new Schema<IEntrega>(
  {
    familiaId: { type: Schema.Types.ObjectId, ref: 'Familia', required: true, index: true },
    jornadaId: { type: Schema.Types.ObjectId, ref: 'Jornada', index: true },
    tipoSolicitud: { type: String, enum: ['beneficio', 'otra'], default: 'beneficio' },
    asunto: { type: String, trim: true },
    estadoPago: { type: String, enum: ['pendiente', 'pagado', 'verificado'], default: 'pendiente' },
    montoPagado: { type: Number, default: 0, min: 0 },
    fechaPago: { type: Date },
    confirmacionEntrega: { type: Boolean, default: false },
    fechaConfirmacion: { type: Date },
    observaciones: { type: String, trim: true },
    historial: {
      type: [{
        fecha: { type: Date, required: true },
        usuario: { type: String, required: true },
        usuarioId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        accion: { type: String, enum: ['comentario', 'cambio_estado'], required: true },
        contenido: { type: String, required: true },
      }],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => { delete (ret as any).__v; return ret; }
    }
  }
);

export default mongoose.models.Entrega || mongoose.model<IEntrega>('Entrega', EntregaSchema);
