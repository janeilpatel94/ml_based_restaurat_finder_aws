'use strict'; 
var AWS = require('aws-sdk');
console.log('Loading function');

    exports.handler = (event, context, callback) => {
        
        
        
    		AWS.config.region = 'us-east-1'; // Region

		var lexruntime = new AWS.LexRuntime();
		var lexUserId = '';   //add here
		var sessionAttributes = {};
				var msg = event.key1;
				// send it to the Lex runtime
				console.log("This is the mess")
				console.log(msg);
				var params = {
					botAlias: '$LATEST',
					botName: '', //RestauranInteractor
					inputText: msg,
					userId: lexUserId,
					sessionAttributes: sessionAttributes
					
				};
				
				lexruntime.postText(params, function(err, data) {
					if (err) {
						console.log(err, err.stack);
						
					}
					if (data) {
						// capture the sessionAttributes for the next cycle
						sessionAttributes = data.sessionAttributes;
						// show response and/or error/dialog status
						callback(null,data.message);
						console.log(data);
						console.log(data.message);
			
						
					}
					// re-enable input
				});
// 			};
};