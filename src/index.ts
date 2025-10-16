import { Elysia } from "elysia";
import { group } from "./group/controller";
import { auth } from './auth/controller'
import openapi from "@elysiajs/openapi";

const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .use(group)
  .use(auth)
  .use(openapi({
    path : "/docs"
  }))
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
