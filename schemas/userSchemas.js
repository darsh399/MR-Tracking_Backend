import {z} from 'zod';

const UserSchema = z.object({
    userName : z.string().min(3).max(20),
    email :  z.string().email(),
    mobileNo: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
    password : z.string().min(6),
    isAdmin : z.boolean()
})

export default UserSchema; 