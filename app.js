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
    res.end('Só vai')
})

router.post('/login', (req, res) => {
    const user = req.body.usuario
    const pass = req.body.senha

    login(user, pass).then(result => {
        if (result > 0) {
            console.log(`${user} logou`)
            req.session.logado = true
            req.session.userId = result
            res.end('OK')
        } else {
            console.log(`Deu ruim`)
            req.session.logado = false
            req.session.userId = 0
            res.end('Fail')
        }
    })

    // res.end(`${user} logou usando a ${pass}`)
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