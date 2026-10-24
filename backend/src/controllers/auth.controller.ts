import type{Request, Response} from "express";
import bcrypt from "bcrypt";
import {pool} from "../config/database";
import jwt  from "jsonwebtoken";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware";

const register = async (req:Request , res:Response): Promise<void>=>{

    try{
   const {email,password,name}=req.body;

 const existingUser= await pool.query(
    "SELECT id FROM  users WHERE email= $1",
    [email]);

    if (existingUser.rows.length>0){
       res.status(409).json({
            message:"An Account  with this email Already Exists"
        });
        return
        
    };
    
    const hashPassword =  await bcrypt.hash(password,10);

    const result =  await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'USER')
       RETURNING id, name, email, role, created_at`,
       [name,email,hashPassword]
    );

    console.log(result.rows[0]);
    
    res.status(201).json({
      success:true,
      message: "Registration successful",
      user: result.rows[0],
    });


    }catch(error){
       console.error("Registration failed:", error);
       res.status(500).json({
      message: "Internal server error",
    });
}

};


const  login =  async (req:Request , res:Response): Promise<void>=>{

 try{
      const { email, password } = req.body;
     const result = await pool.query(
      `SELECT id,name, email, password_hash, role
       FROM users
       WHERE email = $1`,
      [email]
    );

     const user = result.rows[0];
      if (!user) {
      res.status(401).json({
        success: false,
        message: " Invalid Email or password ",
      });
      return;
    }
     const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    );
     if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or  password",
      });
      return;
    }

     const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );
    const isProduction = process.env.NODE_ENV === "production";
     res.cookie("token", token, {
      httpOnly: true,
      secure:  isProduction, 
      sameSite: isProduction ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });
     res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });



 }catch(error){
      console.error("Login failed:", error);
       res.status(500).json({
        success: false, 
      message: "Internal server error",
    });
 }
}



 const getuser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const result = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Get user failed:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


const logout =  async (req:Request, res:Response):Promise<void>=>{

  const isProduction = process.env.NODE_ENV === "production";
   res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });

  res.status(200).json({
    success: true,
    message: "Logout successful",
  }); 
}

export {register,login,getuser,logout};

