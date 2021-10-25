const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./db/agenda_telefonica.db')
const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const session = require('express-session')
const cookieParser = require('cookie-parser')

const router = express.Router()
const app = express()

app.use(express.static(path.join(__dirname, 'public')))

app.use(cookieParser())

app.use(session({
    secret: 'qualquercoisa',
    resave: false,
    saveUninitialized: true,
    cookie: {maxAge: (1000*60*60*24)}
}))

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

router.get('/', (req, res) => {

    try {
        if (req.session.logado) {
            res.sendFile(__dirname + '/index.html')
        } else {
            res.sendFile(__dirname + '/login.html')
        }        
    } catch (error) {
        res.sendFile(__dirname + '/login.html')   
    }
})

router.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/')
})

router.post('/login', (req, res) => {
    const user = req.body.usuario
    const pass = req.body.senha

    login(user, pass).then(result => {
        if (result > 0) {
            console.log(`${user} logou`)
            req.session.logado = true
            req.session.userId = result
            console.log(result)
            res.end('OK')
        } else {
            console.log(`Deu ruim`)
            req.session.logado = false
            req.session.userId = 0
            res.end('Fail')
        }
    })
})

router.get('/listAll', (req, res) => {
    const userId = req.session.userId

    db.all(`SELECT * FROM contacts WHERE owner = ?`, [userId], (err, rows) => {
        if (err) {
            console.log(err)
        }
        
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(rows))
    })

})

router.delete('/person', (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    try {
        const personId = req.query.id
        const userId = req.session.userId

        if(personId === undefined || userId === undefined)  {
            console.log('Erro no UserId ou PersonId')
            res.end(JSON.stringify({ success: false}))
        }

        db.get(`SELECT * FROM contacts WHERE owner = ? AND id = ?`, [userId, personId], (err, row) => {

            if (err) {
                console.log('Erro')
                res.end(JSON.stringify({ success: false }))
            } else {        
                if (personId == row.id) {
                    db.run(`DELETE FROM contacts WHERE id = ?`, [personId], (err) => {
                        if (err) {
                           console.log('Erro, não apagou')                       
                           res.end(JSON.stringify({ success: false }))
                        } else {
                            res.end(JSON.stringify({ success: true }))
                        }
                    })
                } else {
                    console.log('Erro')
                    res.end(JSON.stringify({ success: false}))
                }
                
            }
        })
    } catch (error) {
        console.log(error)
    }

})

router.put('/person', (req, res) => {
    const person = req.body
    const userId = req.session.userId
    const personId = person.id
    const personName = person.name
    const personPhone = person.phone
    const personAddress = person.address
    const personEmail = person.email   

    db.run(`UPDATE contacts SET name=?, phone=?, address=?, email=? WHERE id = ? AND owner = ?`, [personName, personPhone, personAddress, personEmail, personId, userId], (err) => {
        res.setHeader('Content-Type', 'application/json')

        if (err) {
            console.log('Deu erro no update')
            res.end(JSON.stringify({ success: false}))
        } else {
            res.end(JSON.stringify({ success: true}))
        }
    })
})

router.post('/person', (req, res) => {    
    const person = req.body
    const userId = req.session.userId
    const personName = person.name
    const personPhone = person.phone
    const personAddress = person.address
    const personEmail = person.email


    res.setHeader('Content-Type', 'application/json')

    db.run(`INSERT INTO contacts VALUES (null, ?, ?, ?, ?, ? )`, [personName, personPhone, personAddress, personEmail, userId], (err) => {
        if (err) {
            console.log('Erro')
            res.end(JSON.stringify({ success: false}))
        } else {
            res.end(JSON.stringify({ success: true }))
        }
    })
})

async function login  (login, password) {
    return new Promise ((resolve, reject) => {
        db.get(`SELECT * FROM users WHERE user_name = ? AND password = ?`, [login, password], (err, row) => {
    
            if (err) {
                console.log(err)
            }
    
            try {
                if (row.user_name === login) {
                    console.log(`O usuário logou.`)
                    resolve(row.id)
                } else {
                    console.log(`Usuário não existe/Senha incorreta.`)
                    resolve(0)
                }
                
            } catch (error) {
                console.log(`O usuário não existe.`)
                resolve(0)   
            }
    
        })
    })

}

app.use('/', router)

app.listen(3005, () => {
    console.log(`Conectou.`)
})