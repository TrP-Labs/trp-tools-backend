import { connect, credsAuthenticator } from "nats";

const credsText = await Bun.file("./NATS.creds").text();

export const nats = await connect({
  servers: "tls://connect.ngs.global:4222",
  authenticator: credsAuthenticator(new TextEncoder().encode(credsText)),
});
