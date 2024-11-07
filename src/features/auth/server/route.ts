import { Hono } from "hono";
import {zValidator} from '@hono/zod-validator'
import { loginSchema, signupSchema } from "../schemas";
import { createAdminClient } from "@/lib/appwrite";
import { ID } from "node-appwrite";
import {deleteCookie, setCookie} from "hono/cookie";
import { AUTH_COOKIE } from "../constants";
import { sessionMiddleWare } from "@/lib/session-middleware";

const app = new Hono()
    .get("/current",
    sessionMiddleWare,
    (c) => {
        const user = c.get("user");

        return c.json({data:user});
    } // Don't add comma at the end of your controller, Hono will think it's a middleware
    )
    .post("/login", 
    zValidator("json",loginSchema),
    async (c) => {
        const {email,password} = c.req.valid("json");

        console.log({email,password});

        const {account} = await createAdminClient();

        const sesion = await account.createEmailPasswordSession(
            email,
            password
        );

        setCookie(c,AUTH_COOKIE,sesion.secret,{
            path:"/",
            httpOnly:true,
            secure:true,
            sameSite:"strict",
            maxAge: 60 * 60 * 24 * 30
        })

        return c.json({
            success:true,
            msg:"Logged in successfully"
        })
})
    .post("/signup",
    zValidator("json",signupSchema), 
    async (c) => {
        const {email,password,name} = c.req.valid("json");

        console.log({email,password,name});

        const {account} = await createAdminClient();
        const user = await account.create(
            ID.unique(),
            email,
            password,
            name
            )

        const sesion = await account.createEmailPasswordSession(
            email,
            password
        );

        setCookie(c,AUTH_COOKIE,sesion.secret,{
            path:"/",
            httpOnly:true,
            secure:true,
            sameSite:"strict",
            maxAge: 60 * 60 * 24 * 30
        })

        return c.json({
            success:true,
            data:user
        })
    })
    .post("/logout", sessionMiddleWare, async(c) => {

        const account = c.get("account");

        deleteCookie(c,AUTH_COOKIE);
        await account.deleteSession("current");

        return c.json({success:true});
    })
;

export default app;