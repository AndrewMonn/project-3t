// models/LoginAudit.ts
// Registro de auditoría de inicios de sesión.
// Guarda IP, user-agent, resultado (éxito/fallo) y metadata de cada intento.
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILoginAudit extends Document {
  /** null si el login falló y no se pudo identificar el usuario */
  userId:     Types.ObjectId | null;
  email:      string;
  ip:         string;
  userAgent:  string;
  /** País/región inferido del IP (opcional, puede estar vacío) */
  geo:        string;
  exitoso:    boolean;
  /** Razón del fallo: 'credenciales' | 'captcha' | 'cuenta_bloqueada' */
  motivoFallo?: string;
  /** true si es la primera vez que este userId inicia sesión desde esta IP */
  esPrimeraIpParaUsuario: boolean;
  createdAt: Date;
}

const LoginAuditSchema = new Schema<ILoginAudit>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    email:     { type: String, required: true, lowercase: true, trim: true, index: true },
    ip:        { type: String, required: true, index: true },
    userAgent: { type: String, default: '' },
    geo:       { type: String, default: '' },
    exitoso:   { type: Boolean, required: true, index: true },
    motivoFallo: { type: String },
    esPrimeraIpParaUsuario: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { transform: (_doc, ret) => { delete (ret as any).__v; return ret; } }
  }
);

// TTL opcional: borrar registros de más de 1 año automáticamente
LoginAuditSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });

export default mongoose.models.LoginAudit ||
  mongoose.model<ILoginAudit>('LoginAudit', LoginAuditSchema);
