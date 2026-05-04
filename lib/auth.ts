import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import connectDB from "./mongodb";

const JWT_SECRET =
    process.env.JWT_SECRET || "tu-secreto-super-seguro-cambia-esto";

export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
}

export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
}

export async function comparePassword(
    password: string,
    hash: string,
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function extractToken(req: NextRequest): string | null {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    return authHeader.substring(7);
}

export async function withAuth(
    req: NextRequest,
): Promise<
    | { success: true; user: JWTPayload }
    | { success: false; response: NextResponse }
> {
    try {
        const token = extractToken(req);
        if (!token) {
            return {
                success: false,
                response: NextResponse.json(
                    {
                        success: false,
                        data: null,
                        message: "Token no proporcionado",
                    },
                    { status: 401 },
                ),
            };
        }
        const decoded = verifyToken(token);
        await connectDB();
        const userExists = await User.exists({ _id: decoded.userId });
        if (!userExists) {
            return {
                success: false,
                response: NextResponse.json(
                    {
                        success: false,
                        data: null,
                        message: "Usuario no encontrado",
                    },
                    { status: 401 },
                ),
            };
        }
        return { success: true, user: decoded };
    } catch (error) {
        return {
            success: false,
            response: NextResponse.json(
                {
                    success: false,
                    data: null,
                    message: `Token inválido o expirado ${error}`,
                },
                { status: 401 },
            ),
        };
    }
}

export async function withRole(
    req: NextRequest,
    allowedRoles: string[],
): Promise<
    | { success: true; user: JWTPayload }
    | { success: false; response: NextResponse }
> {
    const authResult = await withAuth(req);
    if (!authResult.success) return authResult;
    if (!allowedRoles.includes(authResult.user.role)) {
        return {
            success: false,
            response: NextResponse.json(
                {
                    success: false,
                    data: null,
                    message: "No tienes permisos para realizar esta acción",
                },
                { status: 403 },
            ),
        };
    }
    return { success: true, user: authResult.user };
}

export function jsonResponse<T>(
    success: boolean,
    data: T,
    message: string,
    status: number = 200,
): NextResponse {
    return NextResponse.json({ success, data, message }, { status });
}
