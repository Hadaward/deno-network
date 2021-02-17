import {isPortAvailableSync} from "https://deno.land/x/port@1.0.0/mod.ts";

export class Client {
	transport:Deno.Conn;
	address:Deno.NetAddr;
	
	constructor(connection:Deno.Conn, address:Deno.NetAddr) {
		this.transport=connection;
		this.address=address;
	}
}

export interface IServer {
	connected:Function,
	ready:Function,
	protocol:any
}

export interface ServerHandler {
	socket:Deno.Listener;
	clients:any[];
	server:IServer;
}

export const Network:any = {
	__:{
		handlers:[],
		running:false,
		timeout:false,
		
		async handle_promise(promise:Promise<any>, resolve:Function, reject:Function){			
			let result;
			try {
				result = await promise;
				if (resolve) resolve(result);
			} catch(e:any) {
				if (String(e).substr(0,4)!=="Busy" && reject) reject(String(e));
			}
		},
		
		TextDecoder: new TextDecoder("utf-8"),
		TextEncoder: new TextEncoder()
	},
	
	Client:Client,
	
	checkPort:function(port:number=80,hostname:string="127.0.0.1"){
		return isPortAvailableSync({
			port:port,
			hostname:hostname
		});
	},
	
	listen:function(server:IServer,port:number=80,hostname:string="127.0.0.1"){
		if (this.checkPort(port, hostname)) {
			const handler:ServerHandler = {
				socket: Deno.listen({
					port:port,
					transport:"tcp",
					hostname:hostname
				}),
				server:server,
				clients:[]
			}
			this.__.handlers.push(handler);
		}
	},
	
	stop:function(){
		this.__.running=false;
	},
	
	run:function(){
		this.__.running=true;
		const Network=this;
		
		for (let k=0;k<this.__.handlers.length;k++) this.__.handlers[k].server.ready();
		
		const mainloop=async()=>{
			if (!Network.__.running) return;
			
			for (let k=0;k<this.__.handlers.length;k++) {
				const handler:ServerHandler = this.__.handlers[k];
				
				this.__.handle_promise(handler.socket.accept(), (conn:Deno.Conn)=>{					
					const client = new handler.server.protocol(conn, conn.localAddr, handler.server);
					handler.clients.push(client);
					handler.server.connected(client);
				});
				
				for (const client of handler.clients) {
					const buffer = new Uint8Array(2048);
					
					this.__.handle_promise(client.transport.read(buffer), (count:number)=>{
						if (count > 0 && client.recv) client.recv(this.__.TextDecoder.decode(buffer));
					}, (message:string)=>{
						const index = handler.clients.indexOf(client);
						
						if (index > -1) {
							handler.clients.splice(index, 1);
							client.disconnected(message);
						}
					});
				}
			}
			
			setTimeout(mainloop, 50);
		}
		
		mainloop();
	}
};
export default Network;