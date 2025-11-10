import { Elysia } from "elysia";
import { cors } from '@elysiajs/cors'
import { group } from "./group/controller";
import { auth } from './auth/controller'
import { dispatch } from "./rooms/dispatch/controller";
import { rooms } from "./rooms/controller";
import { schedule } from "./schedule/controller";
import openapi from "@elysiajs/openapi";
import { users } from "./users/controller";
import { ranks } from "./group/rank/controller";
import { route } from "./group/routes/controller";

const app = new Elysia()
  .get('/', () => {return { message : "Welcome to the TrP Tools API! You can view documentation at https://apis.trptools.com/docs" } }, { detail : {hide : true}})
  .use(auth)
  .use(group)
  .use(ranks)
  .use(route)
  .use(dispatch)
  .use(rooms)
  .use(schedule)
  .use(users)
  .use(
    cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    })
  )
  .use(openapi({
    path : "/docs",
    documentation : {
      info : {
        title : "TrP Tools API Documentation",
        version : "0.0.1"
      }
    }
  }))
  .listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
