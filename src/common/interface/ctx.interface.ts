import { JwtPayload } from "jsonwebtoken";
import { Socket } from "socket.io";
import { HUserDocument } from "../../core/database/model/user.model.js";
import { Request } from "express";

export interface IAuthReq extends Request{
    credentials:{ user:HUserDocument, decoded:JwtPayload}
}

export interface IAuthSocket extends Socket{
    credentials:{ user:HUserDocument, decoded:JwtPayload}
}

export type CtxType = "http" | "ws" | "rpc" | "graphql" ;