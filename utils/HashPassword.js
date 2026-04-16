import bcrypt from 'bcrypt';


const hashPassword = async (password) => {
    try{
        const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    }catch(error){
        console.error('Error hashing password:', error.message || error);
        throw error;
    }
}

export default hashPassword;