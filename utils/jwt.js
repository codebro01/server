import jwt from 'jsonwebtoken';

export const createJWT = ({payload}) => jwt.sign(payload,process.env.JWT_SECRET, {expiresIn: '5h'});

export const verifyJWT = ({token}) => jwt.verify(token, process.env.JWT_SECRET);

export const attachCookieToResponse = ({user}) =>{
    const token = createJWT({payload: user});
   return token;
}
