import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto } from "./dto";
import * as argon from "argon2";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable({})
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
    ) { }

    async signIn(dto: AuthDto) {
        //find the user by email
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            }
        })

        // if user not exists then throw error
        if (!user) throw new ForbiddenException("User doesn't exists")

        // compare the password with hash in DB
        const verifyPassword = await argon.verify(user.password, dto.password)

        // if password is incorrect, throw exception
        if (!verifyPassword) throw new ForbiddenException("Incorrect password")

        // return the user
        return this.signToken(user.id, user.email)
    }

    async signUp(dto: AuthDto) {
        // Generate the password hash
        const hashedPassword = await argon.hash(dto.password)
        try {
            //save the new user
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    password: hashedPassword,
                },
            })
            delete user.password
            //return saved user
            return this.signToken(user.id, user.email)
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === "P2002") {
                    throw new ForbiddenException("Email is already exists")
                }
            }
            throw error
        }
    }

    async signToken(userId: number, email: string): Promise<{ access_token: string }> {
        const payload = {
            sub: userId,
            email,
        }
        const secret = this.config.get("JWT_SECRET")
        const token = await this.jwt.signAsync(payload, {
            expiresIn: '5m',
            secret,
        })
        return {
            access_token: token,
        }
    }
}