var express = require('express');
var app = express();
var mongoose = require('mongoose');
require('./connect.js');
require('./model.js');
var User = mongoose.model('users');    // User 为 model name
var LoginState = mongoose.model('userLoginState');
mongoose.Promise = global.Promise;  // 为了避免警告的出现, 因为 mongoose 的默认 promise 已经弃用了。

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }))


// 配置登录逻辑


function PostCallbackData(obj) {
    this.Code = obj.Code;
    this.Data = obj.Data;
}


const api = '/api';

app.post( api + '/login',function(req,res) {
    var date = new Date().getTime();                        // 时间戳
    var ip = req.headers['x-forwarded-for'] || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
    var str = '';
    req.on("data", function(chunk) {
        str += chunk;
    });
    req.on('end', function() {
        var parseStr = JSON.parse(str);
        User.findOne(parseStr, function(err, result) {
            if(err) throw err;
            if(result == null) {
                var c = new PostCallbackData({
                    Code: -1,
                    Data: "账号或密码错误!"
                });
                res.send(JSON.stringify(c));
            }else {
                var record = {
                    user: parseStr.name,
                    date: date,
                    remoteAddress: ip
                };
                // 保存用户登录记录
                var loginState = new LoginState(record);
                loginState.save();
                var c = new PostCallbackData({
                    Code: 0,
                    Data: "登录成功!"
                });
                res.send(JSON.stringify(c));
            }
        });
    });
});


// 配置注册视图
app.post( api + '/register', function(req, res) {
    var date = new Date().getTime();                        // 时间戳
    var ip = req.headers['x-forwarded-for'] || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
    var str = '';
    req.on("data", function(chunk) {
        str += chunk;
    });
    req.on("end",function(){
        var parseStr = JSON.parse(str);
        parseStr.date = date;
        var query = User.findOne({name: parseStr.name});
        query.exec(function(err,person) {
            if(err) throw err;
            if(person == null) {
                var user = new User(parseStr);
                user.save();
                var record = {
                    user: parseStr.name,
                    date: date,
                    remoteAddress: ip
                };
                // 保存用户登录记录
                var loginState = new LoginState(record);
                loginState.save();
                var c = new PostCallbackData({
                    Code: 0,
                    Data: "注册成功!"
                });
                res.send(JSON.stringify(c));
            }else {
                var c = new PostCallbackData({
                    Code: 1,
                    Data: "账号已存在!"
                });
                res.send(JSON.stringify(c));
            }
        });
    });
});



// 开放数据库模块
module.exports = app