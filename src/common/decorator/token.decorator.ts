import { SetMetadata } from "@nestjs/common"
import { TokenEnum } from "../enum/security.enum.js";



export const tokenTypeName = "tokenType"
export const Token =(tokenType:TokenEnum = TokenEnum.ACCESS)=>{
    return SetMetadata(tokenTypeName, tokenType)
}