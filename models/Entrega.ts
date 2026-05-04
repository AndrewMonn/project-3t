// Modelo de Entrega
// Representa la entrega de ayuda a una familia en una jornada específica
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEntrega extends Document {
  familiaId: Types.ObjectId; // Referencia a Familia
  jornadaId: Types.ObjectId; // Referencia a Jornada
  estadoPago: 'pendiente' | 'pagado' | 'verificado'; // Estado del pago
  montoPagado: number; // Monto pagado por la familia
  fechaPago?: Date; // Fecha del pago
  confirmacionEntrega: boolean; // ¿Se confirmó la entrega?
  fechaConfirmacion?: Date; // Fecha de confirmación
  observaciones?: string; // Observaciones adicionales
}

// Esquema de entrega
const EntregaSchema = new Schema<IEntrega>(
  {
    familiaId: { type: Schema.Types.ObjectId, ref: 'Familia', required: true, index: true }, // Familia beneficiaria
    jornadaId: { type: Schema.Types.ObjectId, ref: 'Jornada', required: true, index: true }, // Jornada
    estadoPago: { type: String, enum: ['pendiente', 'pagado', 'verificado'], default: 'pendiente' }, // Estado del pago
    montoPagado: { type: Number, default: 0, min: 0 }, // Monto pagado
    fechaPago: { type: Date }, // Fecha de pago
    confirmacionEntrega: { type: Boolean, default: false }, // ¿Se confirmó la entrega?
    fechaConfirmacion: { type: Date }, // Fecha de confirmación
    observaciones: { type: String, trim: true }, // Observaciones
  },
  {
    timestamps: true,
    toJSON: {
      // Elimina __v al serializar
      transform: (_doc, ret) => { delete ret.__v; return ret; }
    }
  }
);

// Índice único para evitar duplicados por familia y jornada
EntregaSchema.index({ familiaId: 1, jornadaId: 1 }, { unique: true });

// Exporta el modelo Entrega
export default mongoose.models.Entrega || mongoose.model<IEntrega>('Entrega', EntregaSchema);
