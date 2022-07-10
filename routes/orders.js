const express = require("express");
const { auth, authAdmin, payPalAuth } = require("../middlewares/auth");
const { validateOrder, OrderModel } = require("../models/orderModel");
const { ProductModel } = require("../models/productModel");
const { UserModel } = require("../models/userModel");
const router = express.Router();

router.get("/", (req,res) => {
  res.json({msg:"Orders work"})
})

router.get("/allOrders", authAdmin, async(req,res) => {
  let perPage = req.query.perPage || 5;
  let page = req.query.page >= 1 ? req.query.page - 1 : 0;
  let sort = req.query.sort || "_id";
  let reverse = req.query.reverse == "yes" ? 1 : -1;
  let user_id = req.query.user_id;
  
  try{
    let filter = user_id ? {user_id:user_id} : {}
    let data = await OrderModel.find(filter)
    .limit(perPage)
    .skip(page * perPage)
    .sort({[sort]:reverse})
    res.json(data);
  }
  catch(err){
    console.log(err);
    return res.status(500).json(err);
  }
})

router.get("/allOrdersCount" , auth , async(req,res) => {
  try{
    let amount = await OrderModel.countDocuments({});
    res.json({amount})
  }
  catch(err){ 
    console.log(err);
    return res.status(500).json(err);
  }
})

router.get("/userOrder", auth , async(req,res) => {
  try{
    let data = await OrderModel.find({user_id:req.tokenData._id})
    .limit(20)
    .sort({_id:-1})
    res.json(data);
  }
  catch(err){
    console.log(err);
    return res.status(500).json(err);
  }
})

router.get("/productsInfo/:idOrder", auth,async(req,res) => {
  try{
    let order = await OrderModel.findOne({_id:req.params.idOrder});
    let prodShortIds_ar = order.products_ar.map(item => item.s_id);
    let products = await ProductModel.find({short_id:{$in:prodShortIds_ar}})
    res.json({products,order});
  }
  catch(err){
    console.log(err);
    return res.status(500).json(err);
  }
})

router.post("/", auth, async(req,res) => {
  let validBody = validateOrder(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try{
    let user = await UserModel.findOne({_id:req.tokenData._id});
    console.log(user)
    req.body.name = user.name;
    req.body.address = user.address;
    req.body.phone = user.phone;
    req.body.email = user.email;
    let order = await OrderModel.findOne({user_id:req.tokenData._id,status:"pending"})
    if(order){
      let data = await OrderModel.updateOne({_id:order._id},req.body)
      return res.json(data)
    }
    let newOrder = new OrderModel(req.body);
    newOrder.user_id = req.tokenData._id;
    await newOrder.save()
    return res.status(201).json(newOrder);
  }
  catch(err){
    console.log(err);
    return res.status(500).json(err);
  }
})

router.patch("/orderPaid/", auth ,  async(req,res) => {
 
  try{
    let tokenId = req.body.tokenId;
    let orderId = req.body.orderId;
    let realPay = (req.body.realPay == "yes")
    let paypalData = await payPalAuth(tokenId,orderId,realPay)
    if(paypalData.status != "COMPLETED"){
      return res.status(401).json({err_msg:"There problem in the payment"})
    }
    let currentOrder = await OrderModel.findOne({status:"pending", user_id:req.tokenData._id})
    let shortProds_ids = currentOrder.products_ar.map(item => {
      return item.s_id
    })
    let prods_ar = await ProductModel.find({short_id:{$in:shortProds_ids}})
    prods_ar.forEach(async(item) => {
      item.qty -= 1;
      let prodUpdate = await ProductModel.updateOne({_id:item._id},item)
    })
    let status = "paid";
    let data = await OrderModel.updateOne({status: "pending", user_id:req.tokenData._id},{status})
    res.json(data);
  }
  catch(err){
    console.log(err);
    return res.status(500).json(err);
  }
})

router.patch("/:orderId", authAdmin ,  async(req,res) => {
  let status = req.query.status || "pending";
  let orderId = req.params.orderId;
  try{
    let data = await OrderModel.updateOne({_id:orderId},{status})
    res.json(data);
  }
  catch(err){
    console.log(err);
    return res.status(500).json(err);
  }
})

router.delete("/:delId", authAdmin ,  async(req,res) => {
  let orderId = req.params.delId;
  try{
    let data = await OrderModel.deleteOne({_id:orderId})
    res.json(data);
  }
  catch(err){
    console.log(err);
    return res.status(500).json(err);
  }
})

module.exports = router;