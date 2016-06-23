var http = require("http");
var url = require('url');
var fs = require('fs');
var io = require('socket.io'); // 加入 Socket.IO
var clientID = '';
var msgBox = [];
var server = http.createServer(function(request, response) {
  var path = url.parse(request.url).pathname;
	clientID = 'a'+Math.random();
  switch (path) {
    default:
      response.writeHead(404);
      response.write("opps this doesn't exist - 404");
      response.end();
      break;
  }
});
server.listen(7077);

var serv_io = io.listen(server);
var socketUser = {};
var sysList = {};
serv_io.sockets.on('connection', function(socket) {
  // 登入後，進入系統的人記錄起來，之後會使用到推播
  socket.on('onlineSystem', function (data) {
    var sysCode = data.sysCode;
    var userID = data.userID;
    var uuid = data.uuid;
    // var uuid = data.userID;

    if(socketUser[sysCode] == undefined){
      socketUser[sysCode] = {};

      socketUser[sysCode][userID] = {
        'userID':userID,
        'uuid':uuid,
        'sysCode':sysCode,
      };
      // 使用者資訊
      socketUser[sysCode][userID]["socket"] = {};
    }
    socketUser[sysCode][userID]["socket"][socket.id] = socket;
    // 暫存使用者資訊-位置
    sysList[socket.id] = {
      "userID": userID,
      "sysCode": sysCode
    };
  });
  
  // system推送訊息(API呼叫使用, 指定對象)
  socket.on('sysPushSpecified', function (data) {
    // 轉json字串
    var data = JSON.parse(data);
    var userID = data.userID;
    var sysCode = data.sysCode;
    var msg = data.msg;
    try{
      // 屬於這使用者的全推
      if(socketUser[sysCode][userID]["socket"] != undefined){
          var sendData = {
            msg: msg
          };
          for(var index in socketUser[sysCode][userID]["socket"]){
            socketUser[sysCode][userID]["socket"][index].emit("sysPushSpecified",sendData);
          }
        
      }
    }catch(err) {
      console.log(err);
    }
  });


	// socket.on('login', function (data,fn) {
	// 	socketUser[socket.id] = {'systemID':socket.id,'uid':data.uid,'userName':data.userName,'socket':socket};
 //    });
	// //socketUser[socket.id] = {'socket':socket};
	// socket.on('chatMsg', function (data,fn) {
	// 	//推送數據
	// 	for(var values in socketUser){
	// 	  socketUser[values].socket.emit('chatMsg',{'systemID':socket.id,'uid':data.uid,'userName':data.name,'msg':data.msg});
	// 	}
	// });

	//連線關閉, 釋放
	socket.on('disconnect', function(){
    try{
      var userID = sysList[socket.id]["userID"];
      var sysCode = sysList[socket.id]["sysCode"];
      delete socketUser[sysCode][userID]["socket"][socket.id];
      delete sysList[socket.id];
    }catch(err) {

    }
  });
});

