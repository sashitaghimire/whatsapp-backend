// importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';

// app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: '1076137',
    key: '64b12056a5fba53b1887',
    secret: '2b578054ce10f3568cb4',
    cluster: 'ap2',
    encrypted: true
  });



const db = mongoose.connection;

db.once("open",()=>{
    console.log("DB connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change',(change)=>{
        console.log(change);
        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages','inserted',
            {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
            }
            );
        }else{
            console.log('Error triggering Pusher');
        }

    })

});




app.use(express.json());

app.use(cors());




// DB config
const connection_url ='mongodb+srv://admin:@@@@@admin@@@@@@cluster0.kousb.mongodb.net/whatsappdb?retryWrites=true&w=majority';

mongoose.connect(connection_url,{
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology: true,
});




// api routes
app.get('/',(req,res)=>res.status(200).send("working"));



app.get('/messages/sync',(req,res)=>{
    Messages.find((err,data)=>{
        if(err){
            res.status(500).send(err)

        }
        else{
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new',(req,res)=>{
    const dbMessage = req.body;

    Messages.create(dbMessage,(err,data)=>{
        if(err){
            res.status(500).send(err)

        }
        else{
            res.status(201).send(data)
        }
    })
})

// listen
app.listen(port,()=>console.log(`Listening on localhost:${port}`));