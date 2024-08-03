import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import adminRouter from "./router/adminRouter.js";
const app = express();
const port = 3010;

app.use(cors());
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json());
app.use('/upload', express.static('upload'));
app.use('/admin', adminRouter);
app.listen(port, () => {
    console.log(`listening to port ${port}`);
})