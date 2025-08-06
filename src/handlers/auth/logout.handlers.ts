import type { Context } from "hono";
import * as httpStatusCodes from '@/openapi/http-status-codes'
import type { AppBindings } from "@/lib/types/app-types";

//when a user logs out, we simply return a success message so that the client can clear the session or token    
export const LogoutHandler = async (c: Context<AppBindings>) => {
    return c.json({ message: 'Logged out successfully' }, httpStatusCodes.OK);
}