const crypto = require("crypto");

const User = require("../models/userModels");
const Review = require("../models/reviewModel.js");
const Tour = require("../models/tourModels.js");

const catchAsync = require("../utils/catchAsync.js");
const AppError = require("../utils/appError.js");

const sendEmail = require("../utils/emailHandler.js");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");

exports.testApi = catchAsync(async (req, res, next) => {
  // const data = await User.aggregate([
  //     {
  //         $match :{
  //             role : {$eq :"user"}
  //         }
  //     }
  // ])

  const data = await Tour.aggregate([
    // {
    //     $match :{
    //         price : {$gt : 1500}
    //     }
    // },
    // {
    //   $group: {
    //     _id: null, // id is null bcz we need one group not divide into sperates group
    //     totalPrice: { $sum: "$price" }, // count total price ,
    //     totalDocuments: { $sum: 1 }, // here we get avg of all price / total number of document
    //     cheapTourPrice: { $min: "$price" }, // get low price
    //     expensivTour: {$max : "$price"}, // get high price tour

    //     // now we need create new array like name array only inside name if price array only content prive
    //     // tourName : {$push : "$name"}
    //     // tourPrice : {$push : "$price"},

    //   },
    // },
    // {
    //   $sort: { price: 1 },
    // },
    // {
    //   $group: {
    //     _id: null,
    //     priceArray: { $push: "$price" },
    //   },
    // },
    // store data in array with asc order
    // $push        duplicates allowed
    // $addToSet    duplicates removed
    // {
    //     $group : {
    //         _id:null,
    //         array : {$addToSet : "$price"}

    //     }
    // }
    // {
    //   $sort: {
    //     price: 1,
    //   },
    // },
    // {
    //   $group: {
    //     _id: null,
    //     cheapesTour: {$first: {
    //         name : "$name",
    //         price : "$price"
    //     }},
    //     expernsiceTour : {$last:{
    //         name:"$name",
    //         price:"$price"
    //     }}

    //   },
    // },

    // {
    //     $project:{
    //         name : 1,
    //         price : 1 ,
    //         newPrice :{
    //             $multiply :["$price",]
    //         }
    //     }
    // }

    // {
    //     $project:{
    //     name : 1,
    //     price : 1,
    //     category :{
    //         $cond :{
    //             if : {$gte :["$price",1200]},then: "Expensive",else:"Cheap"
    //         }
    //     }
    //     }
    // }
    // {
    //     $project:{
    //         name : 1,
    //         description:{
    //             $ifNull:['$description',"No Description Availble"]
    //         }
    //     }
    // }

    // {
    //   $addFields: {
    //     USD:{
    //         $divide :["$price",94.53]
    //     }
    //   },
    // },{
    //     $project:{
    //         price :1,
    //         USD : 1
    //     }
    // }
    // {
    //   $lookup: {
    //     from: "users",
    //     localField: "refToUser",
    //     foreignField: "_id",
    //     pipeline: [
    //       {
    //         $project: {
    //           name: 1,
    //           role: 1,
    //           email: 1,
    //         },
    //       },
    //     ],
    //     as: "UserData",
    //   },
    // },
    // { $unwind: "$UserData" },
    // {
    //   $lookup: {
    //     from: "tours",
    //     localField: "refToTour",
    //     foreignField: "_id",
    //     pipeline: [
    //       {
    //         $project: {
    //           name: 1,
    //         },
    //       },
    //     ],
    //     as: "TourData",
    //   },
    // },
    // { $unwind: "$TourData" },

    // {
    //     $match:{
    //         // $or:[
    //         //     {price:{$lt : 1500}},{ratingsAverage : {$lte:1}}
    //         // ]

    //         // $and:[
    //         //     {difficulty:{$eq : "easy"}},{ratingsAverage : {$lte:5}},{price : {$lt : 1000}}
    //         // ]

    //         $expr:{
    //             $gte:["$duration","$maxGroupSize"]
    //         }
    //     }
    // }
    // {
    //     $sort:{price : -1}
    // },
    // {

    //     $skip : 15
    // },
    // {
    //     $limit : 5
    // },
    // {
    //     $count : "TotalTour"
    // }
    [
      // {
      //   $lookup: {
      //     from: "users",
      //     localField: "refToUser",
      //     foreignField: "_id",
      //     as: "UserData",
      //   },
      // },
      // {
      //   $unwind: "$UserData",
      // },
      // {
      //   $project: {
      //     _id: 0,
      //     "UserData.name": 1,
      //     "UserData.email": 1,
      //   },
      // },
      {
        $addFields: {
          USD: {
            $divide: ["$price", 94.53],
          },
        },
      },
    ],
  ]);

  //   const data = await Tour.find({
  //     // locations: {
  //     // //   $elemMatch: {
  //     // //     day: 10, // day = 10 give this tour o/p
  //     // //   },
  //     //     // $size : 4 here array of size is 4 o/p
  //     // },
  //   });

  res.status(200).json({
    result: data.length,
    data,
  });
});
