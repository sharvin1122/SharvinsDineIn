//create router object
const express = require('express');
const router = express.Router();



//create routes
//handle home route only

router.get("/", (req, res) => {
    res.render("about", { SharvinsDineIn: "Sharvin's Dine In" });
});

//export router object
module.exports = router;
