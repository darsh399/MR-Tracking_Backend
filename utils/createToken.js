import jwt from "jsonwebtoken";

const createToken = async (user) => {
    try{
     const jsonSecretKey = process.env.JWT_SECRET;
     const token = await jwt.sign({
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        name: user.userName,
        mobileNo: user.mobileNo,
        role: user.role
     }, jsonSecretKey
     , {expiresIn: '1d'});
     return token;
    }catch(error){
        throw error;
    }
}

export default createToken;