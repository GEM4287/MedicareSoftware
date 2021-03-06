const express = require('express');
const connection = require('../../../db/db');
const {requireAuth} = require('../../../middleware/authmiddleware');
const router = express.Router();

//routes for updation/addition of doctor

router.post('/addthedoctor', requireAuth, async(req, res) => {
    console.log(req.body);
    const user = {
        doctorsname: req.body.idrname,
        doctorsaddress: req.body.idraddress,
        doctorsfees: req.body.idrfees,
        doctorsspeciality: req.body.idrspeciality,
        doctorsemail: req.body.iemail,
        doctorscontact: req.body.imobno
    };

    await new Promise((resolve, reject) => {
        const query = `INSERT INTO doctors SET ?`;
        connection.query(query, user, (err, result) => {
            if (err) reject(new Error('something is wrong:' + err));
            resolve(result);
        });
    });

    var message= "Doctors Added SuccessFully";
    res.render('./DOCTORS/adddoc',{message:message});
    //res.send('success'); 
});

router.post('/viewingdr', requireAuth, async (req, res) => {
    const user = {
        sortby: req.body.iprefname
    };
    
        const alluser=await new Promise((resolve, reject) => {
        var query=`select * from doctors`;
        if(user.sortby == 1)
        {
            var meg = 1;
            query = `SELECT * FROM doctors ORDER BY doctorsname`;
        }
        else if (user.sortby == 2) 
        {
            var meg = 2;
            res.render('./DOCTORS/viewdoc', { mesa: meg });
        }
        else if (user.sortby == 3)
        { 
            var meg = 0;
            query = `SELECT * FROM doctors ORDER BY doctorsfees ASC`;
        }  
        connection.query(query,(err, result) => {
            if (err) reject(new Error('Something failed (Record Deletion) :' + err));
            resolve(result);
        });
    });  
    var meg = 0;
    res.render('./DOCTORS/viewdoc',{users:alluser,mesa:meg});
});

//router for viewthedr

router.post('/viewthedr', requireAuth, async (req, res) => {
    const user = {
        name: req.body.iname,
        value:req.body.ivalue
    };
    console.log(user);
    var mes = 0;
    const alluser=await new Promise((resolve, reject) => {
        var query = `SELECT * FROM doctors`;
        if (user.value == 2)
        {
            mes = 2;
            query = `SELECT * FROM doctors where doctorsspeciality=?`; 
        }
        connection.query(query,user.name,(err, result) => {
            if (err) reject(new Error('Something failed (Record Deletion) :' + err));
                resolve(result);
        });
    });
    res.render('./DOCTORS/viewdoc',{users:alluser,mesa:mes});
});




//router for updation and deletion

router.post('/updatingdr', requireAuth, async (req, res) => {
    const user = {
        sortby: req.body.iprefname
    };
    
    const alluser=await new Promise((resolve, reject) => {
        var query = ``;
        if(user.sortby == 1)
        {
            var meg = 1;
            res.render('./DOCTORS/updatedoc', { mesa: meg });
        }
        else if (user.sortby == 2)
        {
            var meg = 2;
            res.render('./DOCTORS/updatedoc', { mesa: meg });
        }
        else if (user.sortby == 3)
        {
            var meg = 0;
            query = `SELECT * FROM doctors ORDER BY doctorsfees ASC`;
        } 
        else if (user.sortby == 4)
        {
            query = `SELECT * FROM doctors `;
        } 
        else if (user.sortby == 5)
        {
            var meg = 5;
            res.render('./DOCTORS/updatedoc', { mesa: meg });
        }    
        connection.query(query,(err, result) => {
            if (err) reject(new Error('Something failed (Record Deletion) :' + err));
            resolve(result);
        });
    });  
    var meg = 0;
    res.render('./DOCTORS/updatedoc',{users:alluser,mesa:meg});
});


//routes for updationofdoctors

router.post('/updatethedr', requireAuth, async (req, res) => {
    const user = {
        name: req.body.iname,
        value:req.body.ivalue
    };
    console.log(user);
    var mes = 0;
    const alluser=await new Promise((resolve, reject) => {
    var query;
    if (user.value == 1)
    {
        mes = 1;
        query = `SELECT * FROM doctors where doctorsname=?`;
    } 
    else if (user.value == 2)
    {
        mes = 2;
        query = `SELECT * FROM doctors where doctorsspeciality=?`; 
    } 
    else if (user.value == 5)
    { 
        mes = 5;
        query = `SELECT * FROM doctors where doctorsid=?`; 
    }
    connection.query(query,user.name,(err, result) => {
        if (err) reject(new Error('Something failed (Record Deletion) :' + err));
                resolve(result);
        });
    });
    res.render('./DOCTORS/updatedoc',{users:alluser,mesa:mes});
});

//routes for updating doctor details

router.post('/updatingdoctordetail', requireAuth, (req, res) => {
    console.log(req.body);
    const user = {
        id: req.body.doctorid,
        name: req.body.doctorname,
        address: req.body.doctoraddress,
        fees: req.body.doctorfees,
        speciality:req.body.doctorspeciality,
        email: req.body.doctorsemail,
        mobno: req.body.doctorsmobno
    }
    res.render('./DOCTORS/updationindoc',{user:user}); 
});

//router for doctorupdatethe details 

router.post('/letupdatedoctordetails', requireAuth,async(req, res) => {
    console.log(req.body);
    const user = {
        id: req.body.id,
        name: req.body.name,
        address: req.body.address,
        fees: req.body.fees,
        speciality:req.body.speciality,
        email: req.body.email,
        mobno: req.body.mobno
    };    
    const data = [[user.name], [user.address], [user.fees], [user.speciality],[user.email],[user.mobno],[user.id]];

    await new Promise((resolve, reject)=> {
        //console.log(this);
        const query = `UPDATE doctors SET doctorsname=? , doctorsaddress=? , doctorsfees=? , doctorsspeciality=? , doctorsemail=? , doctorscontact=? WHERE doctorsid=? `;
        connection.query(query,data,(err, result)=> {
            if (err)    reject(new Error('Something failed (Record Updation) :'+err));  
            resolve(result);
           // console.log(result);
        });
    });
    res.render('./DOCTORS/updationindoc', { user: user });
});


router.post('/deletethedoctor', requireAuth, async(req, res) => {

    console.log(req.body);

    const user = {
        id: req.body.doctorid
    };
    await new Promise((resolve, reject)=> {
        //console.log(this);
        const query = `DELETE FROM doctors WHERE doctorsid=?`;
        
        connection.query(query, user.id, (err, result)=> {
            if (err)    reject(new Error('Something failed (Record Deletion) :'+err));
            resolve (result);
        });
    });
    const mesa = 0;
    res.render('./DOCTORS/updatedoc',{mesa:mesa});
});

module.exports = router;