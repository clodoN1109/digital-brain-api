const handleRegister = (req, res, db, bcrypt) => {

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

}

module.exports = {

    handleRegister: handleRegister

}