const rateLimit = require("express-rate-limit");


const limter = rateLimit({
    max : 100 ,
    windowMs: 60*60*1000, 
    message :"Too Many request from this IP please try again in an hour!"
})


module.exports = limter