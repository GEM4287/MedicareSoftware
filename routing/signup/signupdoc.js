const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
var nodemailer = require('nodemailer');
const connection = require('../../db/db');
const {createToken} = require('../../models/user');
const {requireAuth} = require('../../middleware/authmiddleware');
const router = express.Router();

router.get('/signupdoc', (req,res)=>{
    var message = "";
    res.render('signupdoc',{message:message});
});

router.post('/signupdocform', async(req, res) => {
    console.log(req.body);
    

    const schema = Joi.object({
        Name:Joi.string().required(),
        Email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).min(11).max(100).required(),
        Mobileno: Joi.string().min(10).max(10).required(),
        Drspeciality: Joi.string().required(),
        Address:Joi.string().required(),
        username:Joi.string().min(3).max(30).required(),
        Password: Joi.string().min(3).max(30)
    });
    
    const { error, value } = schema.validate({
        Name: req.body.ifname,
        Email: req.body.iemail,
        Mobileno: req.body.imobno,
        Drspeciality: req.body.idrspeciality,
        Address: req.body.iaddress,
        username: req.body.iusername,
        Password: req.body.ipassword
    });

    if (error != undefined)   
    {
        console.log(error);
        var success = "";
        res.render('signupdoc', { message: error.details[0].message,success});
        // res.status(400).send(error.details[0].message);
        return;    
    }

//validation end here 


    const user = { 
        signindocname: req.body.ifname,
        signindocemail: req.body.iemail,
        signindocmob: req.body.imobno,
        signindocspeciality: req.body.idrspeciality,
        signindocaddress: req.body.iaddress,
        signindocusername: req.body.iusername,
        signindocpassword: req.body.ipassword,
        signindocfees: req.body.ifees
    };
    
    //added hashing for bcrypting password
    const salt = await bcrypt.genSalt(10);
    user.signindocpassword = await bcrypt.hash(user.signindocpassword, salt);
    //ending of bcrypting password

    var message = '';
    //database work-> store the user
    await new Promise((resolve, reject)=> {
        const query = `INSERT INTO signindoc SET ?`;
        
        connection.query(query, user, (err, result)=> {
            if (err)
            {
                message = "Duplicate Entry"
                res.render('signupdoc', {message:message});
            }
            resolve(result);
            message = 'Request Registered Successfully';
        });
    });
    res.render('signupdoc',{message:message});
});


router.post('/signindoc', async (req, res) => {
    console.log(req.body);


    //validation start from here 

    const schema = Joi.object({
        Username:Joi.string().min(3).max(30).required(),
        Password: Joi.string().min(1).max(30)
    });
    
    const { error, value } = schema.validate({
        Username: req.body.iusername,
        Password: req.body.ipassword
    });

    if (error != undefined)   
    {
        console.log(error);
        var success = "";
        res.render('home', { message: error.details[0].message,success});
        // res.status(400).send(error.details[0].message);
        return;    
    }

//validation end here 



    const alluser= await new Promise((resolve, reject) => {
        const query = `select doctorsname  from doctors where doctorsusername=?`;
        connection.query(query,req.body.iusername,(err, result) => {
            if (err) reject(new Error('Something Went Wrong+:' + err));
            resolve(result);
        });
    });
    var message='';    
    const user = {
        name: req.body.iusername,
        password: req.body.ipassword
    };

    const uservalue = await new Promise((resolve,reject)=>{
        const query = `Select * from doctors where doctorsusername = ?`;
        connection.query(query,user.name,(err, result)=> {
            if (err)    reject(new Error('Something failed (Record Updation) :'+err));
            resolve (result);
        });
    });

    await new Promise((resolve, reject) => {
        const query = `SELECT doctorspassword FROM doctors WHERE doctorsusername=?`;
        connection.query(query,user.name, (err, result) => {
            if (err) {
                res.status(404).send(`Not Found` + err);
                message="Invalid Username or Password or NULL value obtained";
                res.render('home',{message:message});
                reject(new Error('Something failed (Record Insertion) :' + err));
            }
            if (result.length === 0)
            {
                message = "Invalid Username or Password or NULL value obtained";
                res.render('home', {message: message});
            }
            else
            {
                bcrypt.compare(user.password,result[0].doctorspassword, (err, result) => {
                    if (result === true) {
                        console.log('success');
                        const token = createToken(uservalue[0].doctorsid);
                        res.cookie('jwt',token,{httpOnly:true,maxAge: 1000*2*24*60*60});
                        res.render('./DOCTORMODULE/doctorspage.ejs',{message:alluser[0].doctorsname});
                    } 
                    else
                    {
                        console.log('failure');
                        message = "Invalid username or password";
                        res.render('home', {message:message});
                        reject(new Error('Something failed (Record Insertion) :' + err));
                    }
                });
            }
            resolve(result);
        });
    });
});


// all appointment request

router.post('/allappointmentrequest', requireAuth, async(req, res) => {
    console.log(req.body);
    const user = {
        name: req.body.username,
        accepted: 0
    };
    
    const data = [[user.name], [user.accepted]];
    console.log(data);
    const alluser= await new Promise((resolve, reject) => {
        const query = `select *  from appointment where doctorname=? and accepted=?`;
        connection.query(query,data,(err, result) => {
            if (err) reject(new Error('Something Went Wrong+:' + err));
            resolve(result);
        });
    });
    res.render('./DOCTORMODULE/toacceptdoctorrequest',{users:alluser,message:req.body.username});
});

// accept appointment request

router.post('/acceptappointmentreq', requireAuth, async(req, res) => {
    console.log(req.body);
    const user = {
        accepted: 1,
        id: req.body.id
    };    
    const data = [[user.accepted],[user.id]];
    await new Promise((resolve, reject) => {
        const query = `update appointment set accepted=? where idappointment=?`;
        connection.query(query,data,(err, result) => {
            if (err) reject(new Error('Something Went Wrong+:' + err));
            resolve(result);
        });
    });

    const alluser=await new Promise((resolve, reject) => {
        const query = `select doctorname from appointment where idappointment=?`;
        connection.query(query,user.id,(err, result) => {
            if (err) reject(new Error('Something Went Wrong+:' + err));
            resolve(result);
        });
    });
   
    const user1 = {
        name: alluser[0].doctorname,
        accepted: 0
    };    
    const data1 = [[user1.name], [user1.accepted]];
    console.log(data1);
    const alluser1= await new Promise((resolve, reject) => {
        const query = `select *  from appointment where doctorname=? and accepted=?`;
        connection.query(query,data1,(err, result) => {
            if (err) reject(new Error('Something Went Wrong+:' + err));
            resolve(result);
        });
    });

    const mailsent= await new Promise((resolve, reject) => {
        const query = `select appointmentemail,appointmentdate,appointmenttime  from appointment where idappointment=?`;
        connection.query(query,user.id,(err, result) => {
            if (err) reject(new Error('Something Went Wrong+:' + err));
            resolve(result);
        });
    });
    
    console.log('mail');
    console.log(mailsent);
    console.log(mailsent[0].appointmentemail);
    console.log('mail');

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'medicare375@gmail.com',
          pass: '485446011203'
        }
    });
    
    var mailOptions = {
        from: 'medicare375@gmail.com',
        to: mailsent[0].appointmentemail,
        subject: 'Appointment',
        text: 'You have an Appointment With Doctor ' + user1.name + ' on Date:-' + mailsent[0].appointmentdate + ' , Timing:' + mailsent[0].appointmenttime
    };
    
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

    res.render('./DOCTORMODULE/toacceptdoctorrequest',{users:alluser1,message:alluser[0].doctorname});
});

//reject appointment request

router.post('/rejectappointmentreq', requireAuth, async(req, res) => {
    console.log(req.body);
    const user = {
        id:req.body.id
    };    
    const data = [[user.id]];
   // console.log(data);
   const alluser=await new Promise((resolve, reject) => {
    const query = `select doctorname from appointment where idappointment=?`;
    connection.query(query,user.id,(err, result) => {
        if (err) reject(new Error('Something Went Wrong+:' + err));
        resolve(result);
    });
   });
    
    await new Promise((resolve, reject) => {
        const query = `DELETE FROM appointment where idappointment=?`;
        connection.query(query,data,(err, result) => {
            if (err) reject(new Error('Something Went Wrong+:' + err));
            resolve(result);
        });
    });
    const user1 = {
        name: alluser[0].doctorname,
        accepted: 0
    };    
    const data1 = [[user1.name], [user1.accepted]];
    console.log(data1);
    const alluser1= await new Promise((resolve, reject) => {
        const query = `select *  from appointment where doctorname=? and accepted=?`;
        connection.query(query,data1,(err, result) => {
            if (err) reject(new Error('Something Went Wrong+:' + err));
            resolve(result);
        });
    });
    res.render('./DOCTORMODULE/toacceptdoctorrequest',{users:alluser1,message:alluser[0].doctorname});
});


//all confirmed appointments

router.post('/confirmedappointments', requireAuth, async(req, res) => {
    console.log(req.body);
    const user = {
        name: req.body.username,
        accepted: 1
    };    
    const data = [[user.name], [user.accepted]];
    console.log(data);
    const alluser= await new Promise((resolve, reject) => {
        const query = `select *  from appointment where doctorname=? and accepted=?`;
        connection.query(query,data,(err, result) => {
            if (err) reject(new Error('Something Went Wrong+:' + err));
            resolve(result);
        });
    });
    res.render('./DOCTORMODULE/tocheckdonedappointments',{users:alluser,message:req.body.username});
});


// alldoned appointments

router.post('/appointmentcompleted', requireAuth, async(req, res) => {
    console.log(req.body);
    const user = {
        accepted: 2,
        id: req.body.id
    };    
    const data = [[user.accepted],[user.id]];
   // console.log(data);
    await new Promise((resolve, reject) => {
        const query = `update appointment set accepted=? where idappointment=?`;
        connection.query(query,data,(err, result) => {
            if (err) reject(new Error('Something Went Wrong+:' + err));
            resolve(result);
        });
    });

    const alluser=await new Promise((resolve, reject) => {
        const query = `select doctorname from appointment where idappointment=?`;
        connection.query(query,user.id,(err, result) => {
            if (err) reject(new Error('Something Went Wrong+:' + err));
            resolve(result);
        });
    });
    
    const user1 = {
        name: req.body.name,
        accepted: 1
    };    
    const data1 = [[alluser[0].doctorname], [user1.accepted]];
    const alluser1= await new Promise((resolve, reject) => {
        const query = `select *  from appointment where doctorname=? and accepted=?`;
        connection.query(query,data1,(err, result) => {
            if (err) reject(new Error('Something Went Wrong+:' + err));
            resolve(result);
        });
    });

    res.render('./DOCTORMODULE/tocheckdonedappointments', { users: alluser1, message: alluser[0].doctorname });
});


router.post('/allpreviousrecords', requireAuth, async(req, res) => {
    console.log(req.body);
    const user = {
        name: req.body.username,
        accepted: 2
    };    
    const data = [[user.name], [user.accepted]];
    console.log(data);
    const alluser= await new Promise((resolve, reject) => {
        const query = `select *  from appointment where doctorname=? and accepted=?`;
        connection.query(query,data,(err, result) => {
            if (err) reject(new Error('Something Went Wrong+:' + err));
            resolve(result);
        });
    });
    res.render('./DOCTORMODULE/tocheckpreviousrecords',{users:alluser,message:req.body.username});
});

router.post('/deltingpatientrecords', requireAuth, async(req, res) => {
    console.log(req.body);

    const alluser=await new Promise((resolve, reject) => {
        const query = `select doctorname from appointment where idappointment=?`;
        connection.query(query,req.body.id,(err, result) => {
            if (err) reject(new Error('Something Went Wrong+:' + err));
            resolve(result);
        });
    });
    
    await new Promise((resolve, reject) => {
        const query = `delete from appointment where idappointment=?`;
        connection.query(query,req.body.id,(err, result) => {
            if (err) reject(new Error('Something Went Wrong+:' + err));
            resolve(result);
        });
    });

    const user = {
        name: req.body.username,
        accepted: 2
    };    
    const data = [[alluser[0].doctorname], [user.accepted]];
    console.log(data);
    const alluser1= await new Promise((resolve, reject) => {
        const query = `select *  from appointment where doctorname=? and accepted=?`;
        connection.query(query,data,(err, result) => {
            if (err) reject(new Error('Something Went Wrong+:' + err));
            resolve(result);
        });
    });
    res.render('./DOCTORMODULE/tocheckpreviousrecords',{users:alluser1,message:alluser[0].doctorname});
});

// viewing all details of patient appointment

router.post('/viewdoctorpatientdetails', requireAuth, async(req, res) => {
    console.log(req.body);
    const alluser=await new Promise((resolve, reject) => {
        const query = `select doctorname from appointment where idappointment=?`;
        connection.query(query,req.body.id,(err, result) => {
            if (err) reject(new Error('Something Went Wrong+:' + err));
            resolve(result);
        });
    });
  
    const alluser1=await new Promise((resolve, reject) => {
        const query = `select * from signin where email=?`;
        connection.query(query,req.body.email,(err, result) => {
            if (err) reject(new Error('Something Went Wrong+:' + err));
            resolve(result);
        });
    });

    res.render('./DOCTORMODULE/tocheckapppatientdetails',{users:alluser1,message:alluser[0].doctorname});
});

router.post('/doctorsmainprofile', requireAuth, async(req, res) => {
    console.log(req.body);
    const alluser=await new Promise((resolve, reject) => {
        const query = `select * from doctors where doctorsname=?`;
        connection.query(query,req.body.username,(err, result) => {
            if (err) reject(new Error('Something Went Wrong+:' + err));
            resolve(result);
        });
    });
    console.log(alluser);
    res.render('./DOCTORMODULE/todoctorsmainprofile',{users:alluser,message:req.body.username});
});

router.post('/updatethedoctordetails', requireAuth, async(req, res) => {
    console.log(req.body);
    const alluser=await new Promise((resolve, reject) => {
        const query = `select doctorsname from doctors where doctorsid=?`;
        connection.query(query,req.body.id,(err, result) => {
            if (err) reject(new Error('Something Went Wrong+:' + err));
            resolve(result);
        });
    });
    console.log(alluser);
   
    const user = {
        id: req.body.id,
        name: req.body.name,
        address: req.body.address,
        email: req.body.email,
        contact: req.body.contact,
        speciality:req.body.speciality,
        fees: req.body.fees
    };    
    const data = [[user.name], [user.address],[user.email],[user.contact],  [user.speciality], [user.fees],[user.id]];

    await new Promise((resolve, reject)=> {
        //console.log(this);
        const query = `UPDATE doctors SET doctorsname=? , doctorsaddress=? , doctorsemail=? , doctorscontact=?, doctorsspeciality=? ,doctorsfees=?   WHERE doctorsid=? `;
        connection.query(query,data,(err, result)=> {
            if (err)    reject(new Error('Something failed (Record Updation) :'+err));  
            resolve(result);
           // console.log(result);
        });
    });

    const alluser1=await new Promise((resolve, reject) => {
        const query = `select * from doctors where doctorsid=?`;
        connection.query(query,req.body.id,(err, result) => {
            if (err) reject(new Error('Something Went Wrong+:' + err));
            resolve(result);
        });
    });

    res.render('./DOCTORMODULE/todoctorsmainprofile',{users:alluser1,message:alluser[0].doctorsname});
});

module.exports = router;