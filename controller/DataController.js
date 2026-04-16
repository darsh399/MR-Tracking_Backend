import bcrypt from 'bcrypt';
import User from '../model/DataModel.js';
import hashPassword from '../utils/HashPassword.js';
import createToken from '../utils/createToken.js';



export const createUser = async (req, res) => {
    try{
        const {userName, email, mobileNo, password, isAdmin} = req.body;
        if(!userName || !email || !mobileNo || !password){
            return res.status(400).json({message: 'All fields are required'});
        }
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message: 'User with this email already exists'});
        }
        const hashedPassword = await hashPassword(password);
        const newUser = new User({
            userName,
            email,
            mobileNo,
            password: hashedPassword,
            isAdmin
        });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    }catch(error){
        console.error('Error creating user:', error.message || error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


export const getCurrentUser = async (req, res) => {
    try{
        const userId = req.user?.id || req.params.id;
        const user = await User.findById(userId).select('-password');

        if(!user){
            return res.status(404).json({message: 'User not found'});
        }
        res.status(200).json(user);
    }catch(error){
        console.error('Error fetching user:', error.message || error);
        res.status(500).json({ message: 'Internal server error' });
    }
} 


export const loginUser = async (req, res) => {
    try{
        const {email, password} = req.body;
        console.log('Login attempt with email:', email, 'and password:', password ? password : 'No password provided');
        if(!email || !password){
            return res.status(400).json({message: 'Email and password are required'});
        }
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({message: 'Invalid email or password'});
        }
        const passwordMatches = await bcrypt.compare(password, user.password);
        if(!passwordMatches){
            return res.status(400).json({message: 'Invalid email or password'});
        }
        const token = await createToken(user);
        console.log('Generated token for user:', user.email, 'Token:', token);
        res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',   
    secure: false,    
        });
        res.status(200).json({ message: 'Login successful', user });

    }catch(error){
        console.error('Error logging in user:', error.message || error);
        res.status(500).json({ message: 'Internal server error' });
    }
}



export const updateUser = async (req, res) => {
    try{
        const userId = req.params.id;
        const {userName, email, mobileNo, password, isAdmin} = req.body;
        const updateData = {};
        if(userName) updateData.userName = userName;
        if(email) updateData.email = email;
        if(mobileNo) updateData.mobileNo = mobileNo;
        if(password) updateData.password = await hashPassword(password);
        if(isAdmin !== undefined) updateData.isAdmin = isAdmin;
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
        if(!updatedUser){
            return res.status(404).json({message: 'User not found'});
        }
        res.status(200).json(updatedUser);
    }catch(error){
        console.error('Error updating user:', error.message || error);
        res.status(500).json({ message: 'Internal server error' }); 
    }
}


export const getAllUsers = async (req, res) => {
    try{
        const users = await User.find();
        if(!users){
            return res.status(404).json({message: 'No users found'});
        }
        res.status(200).json(users);
    }catch(error){
        console.error('Error fetching users:', error.message || error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


export const logoutUser = async (req, res) => {
    try{
        res.clearCookie('token', {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
        });
        res.status(200).json({ message: 'Logout successful' });
    }catch(error){
        console.error('Error logging out user:', error.message || error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


export const getUserById = async (req, res) => {
    try{
        const userId = req.params.id;
        const user = await User.findById(userId).select('-password');
        if(!user){
            return res.status(404).json({message: 'User not found'});
        }
        res.status(200).json(user);

    }catch(error){
        console.error('Error fetching user by ID:', error.message || error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


export const deleteUser = async (req, res) => {
    try{
        const userId = req.params.id || req.user?.id || req.params.userId;
        const deletedUser = await User.findByIdAndDelete(userId);
        if(!deletedUser){
            return res.status(404).json({message: 'User not found'});
        }   
        res.status(200).json({ message: 'User deleted successfully' });
    }catch(error){
        console.error('Error deleting user:', error.message || error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const userStatusUpdate = async (req, res) => {
    try{
        const userId = req.params.id;
        const updatedUser = await User.findById(userId);
        if(!updatedUser){
            return res.status(404).json({message: 'User not found'});
        }
        updatedUser.isActive = !updatedUser.isActive;
        await updatedUser.save();
        res.status(200).json({ message: 'User status updated successfully', user: updatedUser });   
        
    }catch(error){
        console.log('Error in updating user status', error.message || error);
    }
}
