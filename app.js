const express = require('express');
const path = require('path');
const crypto = require('crypto');
const mongoose =require('mongoose');
const multer = require('multer');
// const GridFsStorage=require('multer-gridfs-storage');
const Grid=require('gridfs-stream');
const methodOverride=require('method-override');
const bodyParser=require('body-parser');
const {GridFsStorage} = require('multer-gridfs-storage');
const e = require('express');
// const conn=require('./src/db/conn');

const app=express();

//middleware setup
app.use(bodyParser.json());
app.use(methodOverride('_method'));

//connect database in db/conn.js
const mongoURI ="mongodb://localhost:27017/myTourMate";
//create mongo connection
const conn=mongoose.createConnection(mongoURI,{
    useNewUrlParser:true,
    useUnifiedTopology:true
});
//init gfs
   let gfs,gridfsBucket;
conn.once('open', ()=>{
    //init stream
    // gfs=new mongoose.mongo.GridFSBucket(conn.db,{
    //     bucketName:'uploads'
    // })
    gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'uploads'
      })
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads')
    
  });
//create storage engine
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });
  //init gridfs stream
 

app.set('view engine', 'ejs');
//@route GFT
//@desc Loads form
app.get('/',(req,res)=>{
    res.render('index')
});
//@route POST/upload
//@desc upload file to db
app.post('/upload',upload.single('file'),(req,res)=>{
    // res.send('file uploaded')
    // res.json({file:req.file})
     res.redirect('/')
});
//@route GET /files
//@desc Display file in json
app.get('/files', (req,res)=>{
    gfs.files.find().toArray((err,files)=>{
        //if any files
        if(!files || files.length===0){
            return res.status(404).json({
                err:'no files exist'
            });
        }
        //if files exist
        return res.json(files)
    })
});
//@route GET /files/:filename
//@desc Display file in json
app.get('/files/:filename', (req,res)=>{
    gfs.files.findOne({filename:req.params.filename},(err,file)=>{
        //if any files
        if(!file || file.length===0){
            return res.status(404).json({
                err:'no file exist'
            });
        }
        //if file exists
        return res.json(file)
    })
});
//@route GET /image/:filename
//@desc Display image
app.get('/images/:filename', (req,res)=>{
    gfs.files.findOne({filename:req.params.filename},(err,file)=>{
        //if any files
        if(!file || file.length===0){
            return res.status(404).json({
                err:'no file exist'
            });
        }
        //check if image
        if(file.contentType==='image/jpeg' || file.contentType==='image/png'){
            //read output to browser
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);
        }else{
            res.status(404).json({err:'not an image here'})
        }
    })
});


const port=5000;
app.listen(port,()=>{

    console.log("server is running");
})