const mongoose = require('mongoose');


mongoose.connect("mongodb://localhost:27017/myTourMate").then(()=>{
    console.log("connection successful");
}).catch((err)=>{
    console.log("error occured while connecting");
});
