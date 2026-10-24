import  {rateLimit} from "express-rate-limit";



export  const  rateLimitRegLog= rateLimit({
    windowMs: 2 * 60 *1000 ,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message:{
        success:false,
        message:"Too many requests try again after 2 minutes "
    }

})

