import jwt from "jsonwebtoken";
import "dotenv/config";

export function verifyToken(req, res, next) {
    const token = req.headers["x-access-token"];

    if (!token) return res.sendStatus(401); 

    jwt.verify(token, process.env.TOKEN_KEY, (err, user) => {
        if(err) return res.sendStatus(403);
        req.user = user;
        return next()
    });
} 