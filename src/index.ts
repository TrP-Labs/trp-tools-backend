import { Elysia } from "elysia";
import { group } from "./group/controller";
import { auth } from './auth/controller'
import { dispatch } from "./rooms/dispatch/controller";
import { rooms } from "./rooms/controller";
import openapi from "@elysiajs/openapi";

const app = new Elysia()
  .get('/', () => {return { message : "Welcome to the TrP Tools API! You can view documentation at https://apis.trptools.com/docs" } }, { detail : {hide : true}})
  .use(group)
  .use(auth)
  .use(dispatch)
  .use(rooms)
  .use(openapi({
    path : "/docs",
    documentation : {
      info : {
        title : "TrP Tools API Documentation",
        version : "0.0.1"
      }
    }
  }))
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
