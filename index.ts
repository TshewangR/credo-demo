import { CREDENTIALS_CONTEXT_V1_URL, KeyType } from "@credo-ts/core";
import { holder } from "./holder";
import { issuer } from "./issuer"
import { resolve } from "path";
import { BasicMessageRole } from "@credo-ts/didcomm";

const app = async () => {
    //Init issuer agent & wallet.
    await issuer.initialize();

    //Init holder agent & wallet.
    await holder.initialize();


    //Create issuer DID
    const issuerDIDResult = await issuer.dids.create({
        method: 'key',
        options: {
            keyType: KeyType.Ed25519
        }
    })
    const issuerDID = issuerDIDResult.didState.did
    console.log('Issuer DID = ', issuerDID)

    //Create hodler DID
    const holderDIDResult = await holder.dids.create({
        method: 'key',
        options: {
            keyType: KeyType.Ed25519
        }
    })
    const holderDID = holderDIDResult.didState.did
    console.log('Holder DID = ', holderDID)

    //console.log('\n\n\n\n IssuerDIDResult = ', JSON.stringify(issuerDIDResult, null, 2))

    //Create offer
    const credentialOffer = await issuer.modules.credentials.createOffer({
        credentialFormats: {
            jsonld: {
                credential: {
                    "@context": [
                        CREDENTIALS_CONTEXT_V1_URL,
                        "https://www.w3.org/2018/credentials/examples/v1",
                    ],
                    type: ["VerifiableCredential", "UniversityDegreeCredential"],
                    issuer: issuerDID ?? "",
                    issuanceDate: new Date().toISOString(),
                    credentialSubject: {
                        id: holderDID ?? "",
                        degree: {
                            type: "BachelorDegree",
                            name: "Bachelor of Science and Arts",
                        },
                    },
                },
                options: {
                    proofType: 'Ed25519Signature2018',
                    proofPurpose: 'assertionMethod'
                }
            }
        },
        protocolVersion: 'v2'
    });

    //console.log('\ncredentialOffer = ', credentialOffer);

    //Create invitation: Issuer
    const invitation = await issuer.modules.oob.createInvitation({
        messages: [credentialOffer.message]
    })

    //receive invitation: Holder
    const { connectionRecord } = await holder.modules.oob.receiveInvitation(invitation.outOfBandInvitation)
    //console.log('\n\n\n\n 111111 connectionRecord = ', JSON.stringify(connectionRecord, null, 2));

    if (connectionRecord === undefined) {
        throw new Error("Connection not found...")
    }
    await holder.modules.connections.returnWhenIsConnected(connectionRecord.id)
    await new Promise((resolve) => setTimeout(resolve, 5000))

    const credentialRecords = await holder.modules.credentials.getAll()
    console.log('\n\n\n CRED records = ', JSON.stringify(credentialRecords, null, 2))
    await holder.modules.credentials.acceptOffer({
        credentialRecordId: credentialRecords[0].id
    })

    await new Promise((resolve) => setTimeout(resolve, 10000))

    const updatedCredRecord = await holder.modules.credentials.getAll()
    console.log('\n\n\n\n UPDATED CRED records = ', JSON.stringify(updatedCredRecord, null, 2))


    //Sending message from the issuer to the holder.
    const issuerConnection = await issuer.modules.connections.getAll()
    await issuer.modules.basicMessages.sendMessage(issuerConnection[0].id, "Hello Holder, i will come tomorrow.")
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const holderrecords = await holder.modules.basicMessages.findAllByQuery({
        role: BasicMessageRole.Receiver
    })
    console.log("\n\n\n\nMessage sent from issuer, checking holder's records: ", holderrecords);

    //Sending message from the holder to the issuer.
    await holder.modules.basicMessages.sendMessage(connectionRecord.id, "hello issuer!! I hope you are doing well? Come to my house.")
    await new Promise((resolve) => setTimeout(resolve, 3000))
    const issuerrecords = await issuer.modules.basicMessages.findAllByQuery({})
    console.log("\n\n\n\nMessage sent from holder, checking issuer's records: ", issuerrecords);
};

app();