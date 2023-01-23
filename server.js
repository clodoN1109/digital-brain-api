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
    client: 'pg', 
    connection: {
    
      host: 'dpg-cf63ds9mbjsmchdqg5pg-a',
      port: 5432,
      user: 'clodo',
      password : '9M5jCe2gGTcpAFIMevjtlOwXh3lbTLVz',
      database : 'digitalbrain'
    }
});


app.get("/", (req, res) => {
    res.json('Connection stablished!');
});

// app.get('/database', (req, res)=>{
//     db.select('*').from('users').then(data => res.json(data));
// })

app.post('/signin', (req, res) => {signin.handleSignin(req, res, db, bcrypt)})

//app.post('/register', (req, res) => {register.handleRegister(req, res, db, bcrypt)})

app.post('/register', (req, res) => {

    let {email, name, favoriteColor, password} = req.body;

    if (!email || !name || !password){

        return res.status(400).json('incomplete form');

    }

    const hash = bcrypt.hashSync(password);

    console.log('req', req.body);
    console.log('hash', hash);
    
    db.select('*').from('users').then(data => {res.json(data)});

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


app.listen(port, () => console.log(`Digital Brain App is listening on port ${port}!`));