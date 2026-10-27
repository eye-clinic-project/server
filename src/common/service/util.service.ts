import { Injectable } from '@nestjs/common';
import { Types } from "mongoose";
import { Socket } from "socket.io";
@Injectable()
export class UtilService {
    constructor() { }
    public toObjectId = (id: string) => {
        return Types.ObjectId.createFromHexString(id);
    };
    public createNumberOtp = (): number => {
        return Math.floor(Math.random() * 900000 + 100000);
    };
    public generateSlug = (value: string) => {
        return value.replaceAll(/\s+/g, "-")
    }
    public getAuthSocket = (client: Socket) => {
        return client.handshake.auth.authorization || client.handshake.headers.authorization;
    }
}
