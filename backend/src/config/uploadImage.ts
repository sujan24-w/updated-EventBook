import multer, { FileFilterCallback } from "multer";

const storage =  multer.memoryStorage();

export const uploadImage=  multer({
storage,
limits:{fileSize:2 * 1024 * 1024, files:1},

fileFilter:(req,file,callBack:FileFilterCallback):void=>{
    if(file.mimetype.startsWith("image/")){
        callBack(null,true);
        console.log("upload in clodinary");
        
    }else{
        callBack(new Error("Only  image   files  are allowed"));
        console.log("error");
        
    }
}

})