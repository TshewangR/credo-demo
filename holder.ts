import { AskarModule } from "@credo-ts/askar";
import { Agent } from "@credo-ts/core";
import { AutoAcceptCredential, ConnectionsModule, CredentialsModule, getDefaultDidcommModules, HttpOutboundTransport, JsonLdCredentialFormatService, TrustPingEventTypes, V2CredentialProtocol } from "@credo-ts/didcomm";
import { agentDependencies, HttpInboundTransport } from "@credo-ts/node";
import { askar } from '@openwallet-foundation/askar-nodejs';

export const holder = new Agent ({
    config: {
        label: 'Tshewang Rigzin',
        walletConfig: {
            id: 'rigzinWallet',
            key: '123456'
        }
    },
    modules: {
        ...getDefaultDidcommModules({
            endpoints: ['http://localhost:9000/didcomm']
        }),
        connections: new ConnectionsModule({
            autoAcceptConnections: true
        }),
        credentials: new CredentialsModule({
            autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
            credentialProtocols: [
                new V2CredentialProtocol({
                    credentialFormats: [new JsonLdCredentialFormatService()]
                }),
            ]
        }),
        askar: new AskarModule({
            askar
        }),
    },
    dependencies: agentDependencies
})

holder.modules.didcomm.registerInboundTransport(new HttpInboundTransport({ port: 9000, path: '/didcomm' }))
holder.modules.didcomm.registerOutboundTransport(new HttpOutboundTransport())
