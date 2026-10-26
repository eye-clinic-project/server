// import { TokenService } from "@nestjs/authentication";
// import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";

// @WebSocketGateway({cors : { origin:"*" }})

// export class RealtimeGateway implements OnGatewayInit , OnGatewayConnection , OnGatewayDisconnect {
//     constructor(private readonly tokenService: TokenService,
//         private readonly redisService: CacheService
//     ){}
//     @WebSocketServer()
//     private server!: Server; //io
//     afterInit(server: Server) {
//         console.log("Gateway is running 🚀");
//     }
//     async handleConnection(client: Socket) {
//         try {
//             console.log(`Connected ${client.id}`);

//         const { user, decoded } = await this.tokenService.decodeToken({token: getAuthSocket(client)})
//             client.data = { user, decoded }
//             await this.redisService.addSocket(user._id, client.id)
//             throw new BadRequestException("Fail")
//         } catch (error:any) {
//             client.emit("custom_error" , error.message )

//         }
        
//     }
//     async handleDisconnect(client: Socket) {
//         try {
//             console.log(`Disconnected ${client.id}`);

//             await this.redisService.removeSocket(client.data.user._id, client.id);
//                 const connections = await this.redisService.getSockets(client.data.user._id) || []
//                 if (connections.length < 1) {
//                     this.server.emit("offline_user", { userId: client.data.user._id })
//                 }
//         } catch (error) {
//             client.emit("custom_error" , error)
//         }
//     }

//     @Auth([RoleEnum.ADMIN])
//     @SubscribeMessage("sayHi")
//     sayHi(
//         @User() user:HUserDocument,
//         @MessageBody() body:any,
//         @Ack() ack: (response: { status: string; data: string }) => void,
//         @ConnectedSocket() client:Socket
//     ){
//         try {
//             console.log({body , client ,user});
//             ack({ status: 'received', data :"Hi"});

//             this.server.emit("sayHi","LOLOL" )
//         } catch (error) {
//             client.emit("custom_error" , error)
//         }
//     }

//     changeStock(products:{productId:Types.ObjectId , stock:number}[]){
//         this.server.emit("stock" ,products)
//     }
// }