// Modelo de Usuario del sistema
// Roles: 'administrador' (gestiona todo), 'vocero' (gestión limitada)
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interfaz TypeScript para usuarios
export interface IUser extends Document {
  name: string; // Nombre completo
  email: string; // Email único
  password: string; // Hash de contraseña
  role: 'administrador' | 'vocero'; // Rol del usuario
  comparePassword(candidatePassword: string): Promise<boolean>; // Método para comparar contraseña
}

// Esquema de usuario
const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true }, // Nombre
    email: { type: String, required: true, unique: true, lowercase: true, trim: true }, // Email único
    password: { type: String, required: true, minlength: 6, select: false }, // Contraseña (hash)
    role: { type: String, enum: ['administrador', 'vocero'], default: 'vocero' }, // Rol
  },
  {
    timestamps: true,
    toJSON: {
      // Elimina password y __v al serializar
      transform: (_doc, ret) => { delete (ret as any).password; delete (ret as any).__v; return ret; }
    }
  }
);

// Antes de guardar, hashea la contraseña si fue modificada
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método para comparar contraseña en login
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Exporta el modelo User
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
