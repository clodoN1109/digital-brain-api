const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const app = express();

//app.use(express.json());

//app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());

const db = knex({
    client: 'postgres',
    connection: {
      host : '127.0.0.1',
      port : 5432,
      user : 'postgres',
      password : 'dinoage',
      database : 'smart-brain'
    }
});



app.get('/database', (req, res)=>{
    db.select('*').from('users').then(data => res.json(data));
})

app.post('/signin',(req, res)=> {

    db.select('email', 'hash').from('login')
    .where({'email':req.body.email})
    .then(data => {

       const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
       //console.log(isValid); 
       if (isValid){
            return db.select('*').from('users').where('email', '=', req.body.email)
            .then(user => {
                //console.log(user);
                res.json(user[0]);
            }).catch(err => res.status(400).json('Unable to Signin'));
       }
       else{res.status(400).json('Wrong credentials')}
    

    }).catch(err => res.status(400).json('Wrong credentials.'));


})

app.post('/register', (req, res)=>{

    let {email, name, favoriteColor, password} = req.body;
    const hash = bcrypt.hashSync(password);

    db.transaction(trx => {

        trx.insert({

            hash: hash,
            email: email

        })
        .into('login')
        .returning('email')
        .then(loginEmail => {

            return trx('users').returning('*').insert({

                email: loginEmail[0].email,
                name: name,
                color: favoriteColor,
                joined: new Date
        
            }).then(user => {
        
                res.json(user[0]);
        
            })
            .then(trx.commit)
            .catch(trx.rollback);


        }).catch(err => res.status(400).json('Unable to register.'))
        
    })

})

app.get('/profile/:id', (req, res) => {

    const {id} = req.params;

    db.select('*').from('users').where({id: id}).then(user => {
        if (user.length){
            res.json(user[0]);
        }
        else{res.status(400).json('Not found.')}
    }).catch(err => res.status(400).json('Error getting user.'));

})

app.put('/image',(req,res)=>{

    const {id} = req.body;

    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0].entries);
        })
    .catch(err => res.status(400).json('unable to get entries'));

})

app.listen(3000, ()=>{

    console.log('App is running on port 3000.');
    

})


