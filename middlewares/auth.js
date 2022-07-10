const axios = require("axios");
const jwt = require("jsonwebtoken");
const { secret } = require("../config/config");

exports.auth = (req,res,next) => {
  let token = req.header("x-api-key");
  if(!token){
    return res.status(401).json({err:"You must send token in header to this endpoint"})
  }
  try{
    let decodeToken = jwt.verify(token, secret.jwtSecret);
    req.tokenData = decodeToken;
    next();
  }
  catch(err){
    return res.status(401).json({err:"Token invalid (if you hacker) or expired"});
  }
}

exports.authAdmin = (req,res,next) => {
  let token = req.header("x-api-key");
  if(!token){
    return res.status(401).json({err:"You must send token in header to this endpoint"})
  }
  try{
    let decodeToken = jwt.verify(token, secret.jwtSecret);
    // check if user role is admin
    if(decodeToken.role == "admin"){
      req.tokenData = decodeToken;
      next();
    }
    else{
      return res.status(401).json({err:"You must be admin in this endpoint"})
    }  
  }
  catch(err){
    return res.status(401).json({err:"Token invalid (if you hacker) or expired"});
  }
}


exports.payPalAuth = async (_tokenId, _orderId, _ifRealPay = true) => {
  
  let url = !_ifRealPay ? "https://api-m.sandbox.paypal.com/v2/checkout/orders/" + _orderId : "https://api-m.paypal.com/v2/checkout/orders/" + _orderId;
  try {
    let resp = await axios({
      method: "GET",
      url: url,
      headers: {
        'Authorization': "Bearer " + _tokenId,
        'content-type': "application/json"
      }
    });
    console.log(resp.data)
    return resp.data;
  }
  catch (err) {
    console.log(err.response)
    return (err.response)
  }

}