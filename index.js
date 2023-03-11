const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const bycrypt = require('bcrypt')
const User = require('./models/User')
const Post = require('./models/Post')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const multer = require('multer')
const uploadMiddleware = multer({ dest: 'uploads/' })
const fs = require('fs')

const app = express()
const salt = bycrypt.genSaltSync(10)
const secret = 'yyeyeyyzsvgsggsgstgwtyteyy7wey'
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }))
app.use(express.json())
app.use(cookieParser())
app.use('/uploads', express.static(__dirname + '/uploads'))

mongoose.connect('mongodb+srv://manuelcodes:emma123@cluster0.ndpmwpw.mongodb.net/Blog?retryWrites=true&w=majority')
    .then(() => { console.log('Connected!') }).catch((error) => {
        console.log(error)
    });
// app.get('/register', async (req,res) => {
//     const userview = await userDoc.find({})
//         res.status(200).json(userview)
// })

app.post('/register', async (req, res) => {
    const { username, password } = req.body
    try {
        const userDoc = await User.create({
            username,
            password: bycrypt.hashSync(password, salt)
        })
        res.json(userDoc)
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body
    const userDoc = await User.findOne({ username })
    const passOk = bycrypt.compareSync(password, userDoc.password)
    if (passOk) {
        // logged in
        jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token).json({
                id: userDoc._id,
                username,
            })
        })
    } else {
        res.status(400).json('Wrond Details')
    }
})

app.get('/profile', (req, res) => {
    const { token } = req.cookies;
    jwt.verify(token, secret, {}, (err, info) => {
        if (err) throw err;
        res.json(info)
    })
})

app.post('/logout', (req, res) => {
    res.cookie('token', '').json('ok')
})

app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
    const { originalname, path } = req.file
    const parts = originalname.split('.')
    const ext = parts[parts.length - 1]
    const newPath = path + '.' + ext
    fs.renameSync(path, newPath)


    const { token } = req.cookies
    jwt.verify(token, secret, {}, async(err, info) => {
        if (err) throw err;
        const { title, summary, content } = req.body
        const postDoc = await Post.create({
            title,
            summary,
            content,
            cover: newPath,
            author: info.id  
        })
        res.json(postDoc)
    })


   
})

app.get('/post', async (req, res) => {
    const posts = await Post.find().populate('author', ['username']).sort({createdAt: -1}).limit(20)
    res.json(posts)
})

app.listen(4000, () => {
    console.log('Node Running On Port 4000')
})
//mongodb+srv://manuelcodes:emma123@cluster0.ndpmwpw.mongodb.net/Blog?retryWrites=true&w=majority