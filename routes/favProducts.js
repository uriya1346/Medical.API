const express = require("express");
const { auth } = require("../middlewares/auth");
const { ProductModel } = require("../models/productModel");
const { UserModel } = require("../models/userModel");
const router = express.Router();

router.get("/", auth,async(req,res) => {
  try{
    let data = await UserModel.findOne({_id:req.tokenData._id})
    res.json({favs_ar:data.favs_ar || []})
  }
  catch(err){
    console.log(err);
    res.status(500).json(err)
  }
})
router.get("/productsInfo", auth,async(req,res) => {
  try{
    let data = await UserModel.findOne({_id:req.tokenData._id})
    let favs_ar = data.favs_ar || [];
    // get products list by favs_ar;
    let products = await ProductModel.find({short_id:{$in:favs_ar}})
    .limit(20)
    res.json(products)
  }
  catch(err){
    console.log(err);
    res.status(500).json(err)
  }
})


router.patch("/add_remove/:prodId", auth, async(req,res) => {
  try{
    let prodId = req.params.prodId
    let user = await UserModel.findOne({_id:req.tokenData._id})
    let favs_ar = user.favs_ar || [];
    if(favs_ar.includes(prodId)){
      favs_ar = favs_ar.filter(short_id => short_id != prodId)
    }
    else{
      favs_ar.unshift(prodId)
      favs_ar.splice(40,favs_ar.length)
    }
    let data = await UserModel.updateOne({_id:req.tokenData._id},{favs_ar:favs_ar})
    res.json(data);
  }
  catch(err){
    console.log(err);
    res.status(500).json(err)
  }
})

module.exports = router;