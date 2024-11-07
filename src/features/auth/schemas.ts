import {z} from 'zod';

export const loginSchema = z.object({
    email:z.string().email(),
    password: z.string().min(1,"Required"),
})

export const signupSchema = z.object({
    email:z.string().email(),
    password: z.string().min(8,"Minimum 8 characters"),
    name: z.string().trim().min(1,"Required")
})