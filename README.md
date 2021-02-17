# deno-network
An auxiliary library for TCP servers that need multiple open ports or need to deal with clients simultaneously. You can also connect to servers.

# Server Example
```TypeScript
import {Client, IServer, Network} from "./library/Network.ts";

// First, we need a class to instantiate with each new connection, this helps to deal with the received data.
class LiveClient extends Client {
	// By default, Deno.write receives Uint8Array so we need this if we want to send a string message.
	TextEncoder: TextEncoder;
	
	constructor(connection:Deno.Conn, address:Deno.NetAddr) {
		super(connection, address);
		this.TextEncoder = new TextEncoder();
	}
	
	recv(data:string) {
		console.log(data);
		this.write('pong!');
	}
	
	write(data:string) {
		this.transport.write(this.TextEncoder.encode(data));
	}
	
	disconnected(reason:string) {
		console.log(reason);
	}
}

// The second thing we need is an instance for the IServer interface to be able to manage your server.
const LiveServer = new (class implements IServer {
	protocol:any;
	
	// It is important to define which class we will instantiate for each new connection, so that each server can manage a different type of client.
	constructor() {
		this.protocol=LiveClient;
	}
	
	connected(client:LiveClient) {
		console.log(`New client <${client.address.hostname}:${client.address.port}>`);
	}
	
	ready() {
		console.log('Listening!');
	}
});

Network.listen(LiveServer, 5555);
Network.run();
```

# Client Example
- Network.connect is not yet available.

# Tree
```TypeScript
class Client
    transport:Deno.Conn
    address:Deno.NetAddr
```

```TypeScript
interface IServer
    connected:Function
    ready:Function
    protocol:any
```

```TypeScript
interface ServerHandler
    socket:Deno.Listener
    server:IServer
    clients:any[]
```

```TypeScript
const Network:any
    __:any
        handlers:any[]
        running:boolean
        handle_promise:AsyncFunction (promise:Promise<any>, resolve:Function, reject:Function)
        TextDecoder:TextDecoder
        TextEncoder:TextEncoder
    Client:Client
    checkPort:Function (port:number=80, hostname:string="127.0.0.1")
    listen:Function (server:IServer, port:number=80, hostname:string="127.0.0.1")
    stop:Function
    run:Function
    
default Network
```
