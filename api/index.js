const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose');
const bcrypt = require('bcrypt')
const User = require('./models/User.js')
const jwt = require('jsonwebtoken');
const app = express()
const port = 4000
const cookieParser = require('cookie-parser')
const multer = require('multer')
const Post = require('./models/Post')
const fs = require('fs')


const uploadMiddleware = multer({ dest: 'uploads/' })
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(express.json())
app.use(cookieParser())
app.use('/uploads', express.static(__dirname + '/uploads'));

const salt = bcrypt.genSaltSync(10);
const secret = "#bjecgrucrb6"


mongoose.connect('mongodb+srv://blog:F0v9RSB9ZIfn9Sfc@cluster0.lzcghw9.mongodb.net/?retryWrites=true&w=majority')
    .then(() => console.log('Connected!'));






app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userDoc = await User.create({
            username,
            password: bcrypt.hashSync(password, salt),
        });
        res.json(userDoc);
    } catch (e) {
        console.log(e);
        res.status(400).json(e);
    }
});





app.post("/login", async (req, res) => {

    const { username, password } = req.body;
    const userDoc = await User.findOne({ username });

    const passOk = bcrypt.compareSync(password, userDoc.password);

    if (passOk) {

        jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token).json({
                id: userDoc._id,
                username,
            })

        })


    } else {

        res.status(400).json("Wrong Credential")

    }



});


app.get("/profile", (req, res) => {

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

    const { originalname, path } = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];

    const newPath = path + '.' + ext;
    fs.renameSync(path, newPath);

    const { token } = req.cookies;

    jwt.verify(token, secret, {}, async(err, info) => {
        if (err) throw err;
        const {title,summary,content} = req.body;
        const postDoc = await Post.create({
          title,
          summary,
          content,
          cover:newPath, 
          author:info.id,
        });


        
        res.json(postDoc);
    })




})

app.get('/post', async (req,res)=>{

    res.json(
        await Post.find()
        .populate('author', ['username'])
        .sort({createdAt: -1})
        .limit(20)
        );

})







app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})



//mongodb+srv://blog:<F0v9RSB9ZIfn9Sfc>@cluster0.lzcghw9.mongodb.net/?retryWrites=true&w=majority

