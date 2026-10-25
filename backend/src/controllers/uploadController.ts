import { error } from "console";
import cloudinary from "../config/cloudinary";
import { Readable } from "stream";


export const uploadImageToCloudinaty = async (fileBuffer:Buffer): Promise<{secure_url: string, public_id:string}>=>{

    return new Promise((resolve,reject)=>{
      const stream= cloudinary.uploader.upload_stream({
        folder:"Home/eventBooking/eventsPic",
        resource_type:"image",
      },
        (error,result)=>{
            if(error || !result){
                reject(error || new Error("Image upload failed"));
            }else{
               resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          }); 
            } 
      });
      Readable.from(fileBuffer).pipe(stream);
    })
    
}