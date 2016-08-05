var http = require("http");
var url = require('url');
var express = require( 'express' );
var fs = require('fs');
var io = require('socket.io'); // 加入 Socket.IO
var app = express();

var clientID = '';
var msgBox = [];
var server = http.createServer( app );

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
    var date = new Date();
    var dateString = date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + " "+date.getHours()+":"+date.getMinutes();
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
    }else if(socketUser[sysCode][userID] == undefined){
      socketUser[sysCode][userID] = {
        'userID':userID,
        'uuid':uuid,
        'sysCode':sysCode,
        'socket': {}
      };
    }
    try{
      socketUser[sysCode][userID]["socket"][socket.id] = socket;
      console.log("< onlineSystem connection > \n sysCode:"+sysCode+", userID:"+userID+ ", type:" + typeof(socketUser[sysCode][userID]["socket"][socket.id]) +", Date:"+dateString);

    }catch(err){
      console.log("< onlineSystem Error > \n sysCode:"+sysCode+", userID:"+userID+", Date:"+dateString);
    }
    
    // 暫存使用者資訊-位置
    sysList[socket.id] = {
      "userID": userID,
      "sysCode": sysCode
    };
  });
  
  // system推送訊息(API呼叫使用, 指定對象)
  socket.on('sysPushSpecified', function (data) {
    // 轉json字串
    // var data = JSON.parse(data);
    var userID = data.userID;
    var sysCode = data.sysCode;
    var msg = data.msg;
    var date = new Date();
    var dateString = date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + " "+date.getHours()+":"+date.getMinutes();
    // console.log(data);
    
      
    try{
      // 屬於這使用者的全推
      if(socketUser[sysCode][userID]["socket"] != undefined){
          var sendData = {
            msg: msg
          };
          for(var index in socketUser[sysCode][userID]["socket"]){
            socketUser[sysCode][userID]["socket"][index].emit("sysPushSpecified",sendData);
          }
          console.log("<Send Msg> \n userID:"+userID+", sysCode:"+sysCode+" Date:"+dateString);
          
      }else{
        console.log("<can not send Msg> \n userID:"+userID+", sysCode:"+sysCode+" Date:"+dateString);
      }
    }catch(err) {
      console.log("<can not send Msg> \n userID:"+userID+", sysCode:"+sysCode+" Date:"+dateString);
    }
      
  });

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

