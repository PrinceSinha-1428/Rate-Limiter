import { NextFunction, Request, Response } from "express";
import { RateLimiterOptions } from "./types";

export const rateLimiter  = (options: RateLimiterOptions) => {
   // map to track user requests
   const requests = new Map<string, { count: number, startTime: number}>();

   return (req: Request, res: Response, next: NextFunction) => {
      const ip = req.ip || req.socket.remoteAddress || "unknown";

      const user = requests.get(ip);
      // first request
      if(!user){
         requests.set(ip, {
            count: 1,
            startTime: Date.now()
         });
         return next();
      };
      
      const elapsed = Date.now() - user.startTime;

      if(elapsed > options.windowSize){
         requests.set(ip, {
            count: 1,
            startTime: Date.now(),
        });

        return next();
      }
      if(user.count >= options.maxRequests){
         res.setHeader("Retry-After",  Math.ceil((options.windowSize - elapsed) / 1000));
         console.log(res.getHeader("Retry-After"));
         return res.status(429).json({
            message: "Too many requests"
         })
      }
      user.count++;
      return next();
   };
}