const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const register = require('./controllers/register');
const signin = require('./controllers/signin');

const app = express();

const port = process.env.PORT || 3000;

//app.use(express.json());

//app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());

const db = knex({
    client: 'postgres', 
    connection: {
      host : 'postgres://clodo:9M5jCe2gGTcpAFIMevjtlOwXh3lbTLVz@dpg-cf63ds9mbjsmchdqg5pg-a/digitalbrain',
      port : 5432,
      user : 'clodo',
      password : '9M5jCe2gGTcpAFIMevjtlOwXh3lbTLVz',
      database : 'digitalbrain'
    }
});


app.get("/", (req, res) => {
    res.json('Connection stablished!');
    console.log(db);
});

// app.get('/database', (req, res)=>{
//     db.select('*').from('users').then(data => res.json(data));
// })

app.post('/signin', (req, res) => {

    const {email, password} = req.body;
    console.log(email);

    if (!email || !password){

        return res.status(400).json('Wrong credentials.');

    }

    db.select('email', 'hash').from('login')
    .where({'email':email})
    .then(data => {

       const isValid = bcrypt.compareSync(password, data[0].hash);
       //console.log(isValid); 
       if (isValid){
            return db.select('*').from('users').where('email', '=', email)
            .then(user => {
                //console.log(user);
                res.json(user[0]);
            }).catch(err => res.status(400).json('Unable to Signin'));
       }
       else{res.status(400).json('Wrong credentials')}
    

    }).catch(err => res.status(400).json('Wrong credentials.'));


})

app.post('/register', (req, res) => {

    let {email, name, favoriteColor, password} = req.body;
    console.log('email');

    if (!email || !name || !password){

        return res.status(400).json('incomplete form');

    }

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

app.post('/imageurl',(req,res)=>{

    const Clarifai = require('clarifai');

    const app = new Clarifai.App({
        apiKey: 'b8996a9b4962460e97e5ada5dc67192e'
    });
    
    const {input} = req.body;

    app.models.predict( {
        id: "a403429f2ddf4b49b307e318f00e528b",
        version: "34ce21a40cc24b6b96ffee54aabff139",
    }, input).then(data => {

        res.json(data);
    })
    .catch(err => res.status(400).json('Unable to work with API.'));


})


app.listen(port, () => console.log(`Example app listening on port ${port}!`));