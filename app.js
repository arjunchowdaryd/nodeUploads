const express = require('express');
const bodyParser = require('body-parser')
const path = require('path');
const crypto = require('crypto');
const mongoose=require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride= require('method-override');
const app = express();
//middleWare
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine','ejs');
 //mongoose.connect('mongodb://admin:admin123@ds211504.mlab.com:11504/mlabdb', { useNewUrlParser: true })

//const mongoURI = 'mongodb://admin:admin123@ds211504.mlab.com:11504/mlabdb'
//const mongoURI='mongodb://localhost:27017/testing'
//mongodb://<dbuser>:<dbpassword>@ds259253.mlab.com:59253/mongouploads
const mongoURI = 'mongodb://arjun1:arjun1@ds259253.mlab.com:59253/mongouploads'
const conn =  mongoose.createConnection('mongodb://arjun1:arjun1@ds259253.mlab.com:59253/mongouploads', { useNewUrlParser: true })
//create mongo connection
 
//const conn = mongoose.createConnection('mongodb://admin:admin123@ds211504.mlab.com:11504/mlabdb', { useNewUrlParser: true });

// Init gfs
let gfs;
conn.once('open',function(){
    //Init stream
    gfs= Grid(conn.db,mongoose.mongo);
    gfs.collection('uploads');
})
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


let schema = new mongoose.Schema({
  name: {
      type: String,
      required: true,
      minLength: 5
  },
  age: {
      type: Number,
      required: true
  }
})

const ToDo = mongoose.model('ToDo', schema)

app.post('/postData', (req, res) => {
  let toDo = new ToDo({
      name: req.body.name,
      age: req.body.age
  })

  toDo.save().then((data) => {
      res.send(data), (e) => res.send(e)
  })
})


app.get('/',function(req,res){
res.render(__dirname+'/views/index');
});
//post/uploads
app.post('/uploads',upload.single('file'),function(req,res){
   // res.json({file:req.file}); 
    res.redirect('/')
   })
   // get/files

app.get('/files',(req,res)=>{
  gfs.files.find().toArray((err,files)=>{
  //checks if files
  if(!files ||files.length===0){
    return res.status(404).json({
      err:'no files exists'
    });
   }
   //files exits
   return res.json(files);
  })
  })

// files/:filename
  
app.get('/files/:filename',(req,res)=>{
gfs.files.findOne({filename:req.params.filename},(err,file)=>{
 //checks if file
 if(!file ||file.length===0){
  return res.status(404).json({
    err:'no file exists'
  });
 }
 //files exits
 return res.json(file);
})
  


}) 
  //get/images
  app.get('/images/:filename',(req,res)=>{
    gfs.files.findOne({filename:req.params.filename},(err,file)=>{
      //check if file
      if(!file ||file.length===0){
        return res.status(404).json({
          err:'no file exists'
        });
      }
      if(file.contentType === 'image/jpeg'|| file.contentType === 'image/PNG'){
      //read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
  
      }
      else{
        res.status(404).json({
          err:'not an image'
        })
      }
    })
  })
  const port = process.env.PORT || 8000
  
  app.listen(port, () => {
    console.log(`Here I am.... Rocking @ port  ${port}`)
  })