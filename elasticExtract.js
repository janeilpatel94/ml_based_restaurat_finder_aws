'use strict';

//const yelp = require('yelp-fusion');
var AWS = require("aws-sdk");
var queueUrl = '';
var sqs = new AWS.SQS({region : 'us-east-1'});
var ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});
//var async = require('async');

exports.handler = (event, context, callback) => {
  var params = {
    QueueUrl: queueUrl,
    VisibilityTimeout: 600 // 10 min wait time for anyone else to process.
  };

  sqs.receiveMessage(params, function(err, data) {
    if(err) {
      console.log(err);
    }
    else {

      var msg1 = "";
      var recHandle = "";

      data.Messages.forEach(function(key) {
        msg1 = key.Body;
        recHandle = key.ReceiptHandle;

        var MsgObj = JSON.parse(msg1);
        var term1 = MsgObj.term;
        //var location1 = MsgObj.location;
        //var limit1 = MsgObj.limit;

        let notficMsg = "Restaurant Suggestions: \n\n";

        const https = require('https');
        var query = '/_search?q=Cuisine:' + term1.toLowerCase();

        https.get({
            host:'',
            path: query,
            method:'GET'
        }, (resp) => {

          let data1 = '';

          // A chunk of data has been recieved.
          resp.on('data', (chunk) => {
            data1 += chunk;
            //console.log(chunk);
          });

          // The whole response has been received. Print out the result.
          resp.on('end', () => {
            //var count = 0;

            var calls = [];
            var count2 = 0;

            (JSON.parse(data1).hits.hits).forEach(function(key, index) {
            //calls.push(function(callback) {
            if(index >= 5)
                return true;

              var rest1 = key._source.RestaurantID;

              var params = {
                TableName: '', // enter table name
                Key: {
                  'Restaurant_Id' : {S: rest1},
                },
                //ProjectionExpression: 'Address, Name, ReviewCount'
              };

              ddb.getItem(params, function(err, data2) {
                if (err) {
                  console.log("Error", err);
                } else {
                  count2++;
                  notficMsg = notficMsg + "Restaurant ID: " + rest1 + "\n" +
                              "Restaurant Name: " + (data2.Item).Name.S + "\n" +
                              "Review Count: " + (data2.Item).ReviewCount.S + "\n" +
                              "Rating: " + (data2.Item).Rating.S + "\n" +
                              "Addres: " + (data2.Item).Address.S + " " + (data2.Item).ZipCode.S + "\n" +
                              "Coordinates: " + (data2.Item).Coordinates.S + "\n\n"
                              ;
                  //console.log("Restaurants: \n" + notficMsg);
                  //if(count2 == 4)
                  //console.log("Counter: " + count2);
                  if(count2 == 5) {
                    //console.log(notficMsg);

                    var sns = new AWS.SNS();
                    var params = {
                      Message: notficMsg,
                      Subject: "Restaurant Suggestions From RestFinder",
                      //TopicArn: "arn:aws:sns:us-east-1:648606393740:restaurantNotification",
                      //TargetArn: "arn:aws:sns:us-east-1:648606393740:restaurantNotification:7a099536-2f93-4f37-890b-1c5fecf4ccd2"
                      PhoneNumber: MsgObj.PhoneNumber
                    };

                    console.log("published: " + recHandle);
                    sns.publish(params, function(err, data) {
                      if (err) console.log(err, err.stack); // an error occurred
                      else     console.log(data);           // successful response
                    });
                  }
                }
              });

              // count++;
              // if (count==5)
              //   return false;
              // else
              //   return true;
            // });
            });

            // async.parallel(calls, function(err, result) {
            //   if (err)
            //     return console.log(err);
            //   console.log(result);
            // });

          });

        }).on("error", (err) => {
          console.log("Error: " + err.message);
        });

        function deleteMessage(receiptHandle, cb) {
          sqs.deleteMessage({
            ReceiptHandle: receiptHandle,
            QueueUrl: queueUrl
          }, cb);
        }

        deleteMessage(recHandle, callback);

      });
    }
  });
};
