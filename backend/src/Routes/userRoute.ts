import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { signupInput, signinInput } from "@mairaz457/medium-common";

export const userRoute = new Hono<{
  Bindings: {
    DATABASE_URL: string,
    JWT_SECRET: string,
  }
}>();

userRoute.post('/signup', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());
  const body = await c.req.json();
  try {
    const {success} = signupInput.safeParse(body);
    if(!success) {
      c.status(411);
      return c.json({
        message:"Inputs are not correct"
      })
    }
    let user;
    user = await prisma.user.findUnique({
      where: {
        email: body.email
      }
    })
    if (user) {
      c.status(409);
      return c.json({ error: "User already exists" })
    } else {
      user = await prisma.user.create({
        data: {
          email: body.email,
          password: body.password,
        }
      })
      const token = await sign({ id: user.id }, c.env.JWT_SECRET);
      return c.json({
        jwt: token
      })
    }
  } catch (e) {
    console.log(e);
    c.status(411);
    return c.text("Invalid")
  }
})
userRoute.post('/signin', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL
  }).$extends(withAccelerate());

  const body = await c.req.json();
  try {
    const {success} = signinInput.safeParse(body);
    if(!success) {
      c.status(411);
      return c.json({
        message:"Inputs are not correct"
      })
    }
    const user = await prisma.user.findUnique({
      where: {
        email: body.email
      }
    })
    if (!user) {
      c.status(403);
      return c.json({ error: "User not found" })
    }

    const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
    return c.json({ jwt });
  } catch (e) {
    console.log(e);
    c.status(403);
    return c.text("Invalid")
  }
})