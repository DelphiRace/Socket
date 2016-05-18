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
    case '/socket.html':
      fs.readFile(__dirname + path, function(error, data) {
        if (error){
          response.writeHead(404);
          response.write("opps this doesn't exist - 404");
        } else {
          response.writeHead(200, {"Content-Type": "text/html"});
          response.write(data, "utf8");
        }
        response.end();
      });
      break;
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
var room = {};
serv_io.sockets.on('connection', function(socket) {
	//通知連線成功
	//serv_io.sockets.emit('conn', { 'systemID': socket.id}); -->全部的人都會發送
    socket.emit('conn', { 
      'systemID': socket.id,
      // 'roomID': socket.id.replace("/","").replace("#","").replace("-","").substring(0,6)
    });
    socket.on('roomCreate', function (data,fn) {
      // socketUser[socket.id] = {'systemID':socket.id,'uid':data.uid,'userName':data.userName,'socket':socket};
      room[data.roomID] = {};
      // room[data.roomID][socket.id] = socket;
      socket.emit('roomCreate', { 
      'creatStutas': true,
      'nowUser': room
      // 'roomID': socket.id.replace("/","").replace("#","").replace("-","").substring(0,6)
      });
      // console.log(room);
    });
    
    socket.on('roomLeave', function (data,fn) {
      delete room[data.roomID];
    });

    socket.on('roomEnter', function (data,fn) {
      room[data.roomID][socket.id] = {socket: socket};
      // console.log(room[data.roomID]);
      var userID = "";
      for(var key in room[data.roomID]){
        userID += key+",";
        if(key != socket.id){
          room[data.roomID][key].socket.emit('enterAlert',{enterID:socket.id});
        }
        // console.log(key);
      }
        // console.log(userID);

      userID = userID.substring(0,userID.length-1);
      socket.emit('roomEnter', { 
        'enterID': socket.id,
        'nowRoomUser':userID
      });
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
	//連線關閉
	socket.on('disconnect', function(){
		delete socketUser[socket.id];
  });
});

