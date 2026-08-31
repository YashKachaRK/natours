const express = require("express");

const test = require("../controller/test");

const router = express.Router();

router.route("/testApi").get(test.testApi);

module.exports = router;
