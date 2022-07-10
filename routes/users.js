const express = require("express");
const bcrypt = require("bcrypt")
const { validateUser, UserModel, validateLogin, genToken } = require("../models/userModel");
const { auth, authAdmin } = require("../middlewares/auth");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ msg: "Users work" })
})

router.get("/usersList", authAdmin,async(req, res) => {
  let perPage = req.query.perPage || 20;
  let page = req.query.page >= 1 ? req.query.page - 1 : 0;
  try {
    let data = await UserModel.find({}, { password: 0 })
    .limit(perPage)
    .skip(page * perPage)
    res.json(data);
  }
  catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
})

router.get("/checkUserToken", auth , async(req,res) => {
  res.json({status:"ok",msg:"token is good",tokenData:req.tokenData})
})

// router.get("/myInfo", auth, async (req, res) => {
//   try {
//     let data = await UserModel.findOne({ _id: req.tokenData._id }, { password: 0 })
//     res.json(data);
//   }
//   catch (err) {
//     console.log(err);
//     return res.status(500).json(err);
//   }
// })

router.patch("/changeRole/:userId/:role", authAdmin, async (req, res) => {
  let userId = req.params.userId;
  let role = req.params.role;
  try {
    if (userId != req.tokenData._id && userId != "61deb982d83384c7ecf3ce0d") {
      let data = await UserModel.updateOne({ _id: userId }, { role: role })
      res.json(data);
    }
    else{
      res.status(401).json({err:"You cant change your self"});
    }
  }
  catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
})

router.post("/", async (req, res) => {
  let validBody = validateUser(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    let user = new UserModel(req.body);
    user.password = await bcrypt.hash(user.password, 10);
    await user.save();
    user.password = "*****";
    return res.status(201).json(user);
  }
  catch (err) {
    if (err.code == 11000) {
      return res.status(400).json({ code: 11000, err: "Email already in system" })
    }
    console.log(err);
    return res.status(500).json(err);
  }
})

router.post("/login", async (req, res) => {
  let validBody = validateLogin(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    let user = await UserModel.findOne({ email: req.body.email })
    if (!user) {
      return res.status(401).json({ err: "User not found!" });
    }
    let validPass = await bcrypt.compare(req.body.password, user.password)
    if (!validPass) {
      return res.status(401).json({ err: "User or password is wrong" });
    }
    res.json({ token: genToken(user._id, user.role) });
  }
  catch (err) {
    alert( res.status(500).json(err));
    return res.status(500).json(err);
  }
})


module.exports = router;