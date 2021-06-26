const express = require('express');
const connection = require('../../db/db');
const bcrypt = require('bcryptjs');
const {createToken} = require('../../models/user');
const router = express.Router();

router.post('/adminoffice', (req, res) => {
    var message = '';
    res.render('./ADMIN/adminlogin',{message:message}); 
});

router.get('/welcomeadmin', (req, res) => {
    var message = '';
    res.render('./ADMIN/inadmin',{message:message}); 
});

router.post('/welcomeadmin', async (req, res) => {
    console.log(req.body);
    var message='';    
    const user = {
        name: req.body.iusername,
        password: req.body.ipassword
    };

    const uservalue = await new Promise((resolve,reject)=>{
        const query = `Select * from signinadmin where username = ?`;
        connection.query(query,user.name,(err, result)=> {
            if (err)    reject(new Error('Something failed (Record Updation) :'+err));
            resolve (result);
        });
    });

    await new Promise((resolve, reject) => {
        const query = `SELECT password FROM signinadmin WHERE username=?`;
        connection.query(query,user.name, (err, result) => {
            if (err) {
                res.status(404).send(`Not Found` + err);
                reject(new Error('Something failed (Record Insertion) :' + err));
            }
            if (result.length === 0)
            {
                message = "Invalid Username or Password or NULL value obtained";
                res.render('./ADMIN/adminlogin', {message: message});
            }
            else
            {
                if (user.password === result[0].password) {
                    console.log('success');
                    const token = createToken(uservalue[0].signinadminid);
                    console.log(token);
                    res.cookie('jwt',token,{httpOnly:true,maxAge: 1000*2*24*60*60});
                    res.render('./ADMIN/inadmin', {user: user});  
                } 
                else
                {
                    console.log('failure');
                    message = "Invalid username or password";
                    res.render('./ADMIN/adminlogin', {message:message});
                }
            }
            resolve(result);
        });
    });
});

module.exports = router;