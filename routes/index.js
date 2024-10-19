var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  const sucess_flash = req.flash("sucess_flash", "succesfully created");
  const error_msg = req.flash("error_msg", "succesfully created");
  console.log(sucess_flash);
  res.render("index", {
    title: "Express",
    user: req.user,
    error_msg,
    sucess_flash,
  });
});
router.get("/about", function (req, res, next) {
  res.render("about", { title: "About", user: req.user });
});

module.exports = router;
