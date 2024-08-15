import { PrismaClient } from ".prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono"
import { verify } from "hono/jwt";
import {createBlogInput, updateBlogInput} from "@mairaz457/medium-common";

export const blogRoute = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    },
    Variables: {
        userId: string;
    }
}>()

blogRoute.use('/*', async (c, next) => {
    const header = c.req.header("authorization") || "";
    const token = header.split(" ")[1]
    try {
        const response = await verify(token, c.env.JWT_SECRET);
        if (response.id) {
            c.set("userId", "response.id");
            await next()
        } else {
            c.status(403);
            return c.json({ error: "unauthorized" })
        }
    } catch (e) {
        c.status(403);
        return c.json({ error: "unauthorized" })
    }
})

blogRoute.post('/', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
    const body = await c.req.json();
    const authorId = c.get("userId");
    try {
        const {success} = createBlogInput.safeParse(body);
        if(!success) {
          c.status(411);
          return c.json({
            message:"Inputs are not correct"
          })
        }
        const blog = await prisma.post.create({
            data: {
                title: body.title,
                content: body.content,
                authorId: authorId
            }
        })
        c.status(200);
        return c.json({
            id: blog.id
        })
    } catch (e) {
        console.log(e);
        c.status(400);
        return c.text("Error while creating blog")
    }
})

blogRoute.put('/:id', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
    const id = c.req.param("id");
    const body = await c.req.json();
    try {
        const {success} = updateBlogInput.safeParse(body);
        if(!success) {
          c.status(411);
          return c.json({
            message:"Inputs are not correct"
          })
        }
        const blog = await prisma.post.update({
            where: {
                id: id
            },
            data: {
                title: body.title,
                content: body.content,
            }
        })
        c.status(200);
        return c.json({
            id: blog.id
        })
    } catch (e) {
        console.log(e);
        c.status(400);
        return c.text("Error while updating blog")
    }
})

blogRoute.get("/", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
    try {
        const blogs = await prisma.post.findMany()
        c.status(200);
        return c.json({
            blogs
        })
    } catch (e) {
        console.log(e);
        c.status(400);
        return c.text("Error fetching while blogs")
    }
})

blogRoute.get('/:id', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
    const id = c.req.param("id");
    try {
        const blog = await prisma.post.findFirst({
            where: {
                id: id
            }
        })
        c.status(200);
        return c.json({
            blog
        })
    } catch (e) {
        console.log(e);
        c.status(400);
        return c.text("Error while fetching particular blog")
    }
})
