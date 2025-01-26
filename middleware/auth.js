import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid or expired token'
                });
            }

            req.user = user;
            next();
        });
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
}; 