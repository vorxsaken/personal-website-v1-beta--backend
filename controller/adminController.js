import { mongo } from "../mongodb.js";
import Jwt from "jsonwebtoken";
import 'dotenv/config'
import { ObjectId } from "mongodb";
import fs from "fs"
import path from "path";

const db = mongo.db('Personal_Cms');

export async function Login(req, res) {
    const { user, password } = req.body;
    if (user && password) {
        const login = db.collection('admins').find({ username: user, password: password });
        const data = await login.toArray();
        if (data.length != 0) {
            const token = Jwt.sign(
                { user_id: data[0]._id, user },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "12h"
                }
            );
            await db.collection('admins').updateOne({ _id: data[0]._id }, { $set: { token: token } })
            res.send({ userToken: token });
        } else {
            res.status(500).send({ error: "username atau password salah" })
        }
    } else {
        res.status(501).send({ error: "field tidak boleh kosong" })
    }
}

export async function uploadPost(req, res) {
    const prefixUrl = req.protocol + '://' + req.get('host');
    const imageHeader = prefixUrl + '/upload/images/' + req.files["file"][0].filename;
    const imagePic = prefixUrl + '/upload/images/' + req.files["pic"][0].filename;
    const { title, subtitle, text, tags, created_at } = req.body;
    const payload = {
        title: title,
        subtitle: subtitle,
        text: text,
        tags: tags,
        imageHeader: imageHeader,
        imagePic: imagePic,
        created_at: created_at
    }
    const post = await db.collection('posts').insertOne(payload);

    res.status(200).send({ message: 'Post Uploades Successfully', id: post.insertedId, ...payload });
}

export async function updatePost(req, res) {
    if (req.files.length != undefined) {
        const { id, title, subtitle, text, tags } = req.body;
        const prefixUrl = req.protocol + '://' + req.get('host');
        const imageUrl = prefixUrl + '/upload/images/' + req.files["file"][0].filename;
        const imagePic = prefixUrl + '/upload/images/' + req.files["pic"][0].filename;
        const payload = {
            "title": title,
            "subtitle": subtitle,
            "text": text,
            "tags": tags,
            "imageHeader": imageUrl,
            "imagePic": imagePic
        }
        try {
            db.collection("posts").updateOne({ "_id": ObjectId(id) }, {
                $set: payload
            })
            res.status(200).send(payload);
        } catch (err) {
            res.status(500);
        }
    } else {
        const { id, title, subtitle, text, tags, file, pic } = req.body;
        const payload = {
            "title": title,
            "subtitle": subtitle,
            "text": text,
            "tags": tags,
            "imageHeader": file,
            "imagePic": pic
        }
        try {
            db.collection("posts").updateOne({ "_id": ObjectId(id) }, {
                $set: payload
            })
            console.log(req.body);
            res.status(200).send(payload);
        } catch (err) {
            res.status(500).send('error : ' + err);
        }
    }
}

export async function uploadProject(req, res) {
    const url = req.protocol + '://' + req.get('host');
    const { title, deskripsi, github, created_at, techStack } = req.body;
    let imageObject = {
        src: [],
        pic: []
    };
    for (const key in req.files) {
        for (const file of req.files[key]) {
            const urlFiles = url + '/upload/images/' + file.filename
            if (key == 'src') {
                imageObject.src.push({
                    url: urlFiles
                })
            } else {
                imageObject.pic.push({
                    url: urlFiles
                })
            }
        }
    }

    const payload = {
        title: title,
        deskripsi: deskripsi,
        github: github,
        imageHeader: imageObject,
        techStack: techStack,
        created_at: created_at
    }
    const projects = await db.collection('projects').insertOne(payload)

    res.status(200).send({ message: 'file uploade successfully', _id: projects.insertedId, ...payload });
}

export async function updateProject(req, res) {
    const { id, title, deskripsi, github, updated_at, updated_src, updated_pic, techStack } = req.body;
    let updated_src_toArray = updated_src.split(',');
    let updated_pic_toArray = updated_pic.split(',');
    const prefixUrl = req.protocol + '://' + req.get('host');

    var payload = {
        "title": title,
        "deskripsi": deskripsi,
        "github": github,
        "updated_at": updated_at,
        "techStack": techStack
    }

    if (req.files.length == undefined) {

        await db.collection('projects').updateOne({ "_id": ObjectId(id) }, {
            $set: payload
        })

    } else {
        for (let i = 0; i < req.files["src"].length; i++) {
            let urlFiles = prefixUrl + '/upload/images/' + req.files["src"][i].filename;
            let urlFilesPic = prefixUrl + '/upload/images/' + req.files["pic"][i].filename;
            // update src image url
            await db.collection("projects").updateOne(
                {
                    "_id": ObjectId(id),
                    "imageHeader.src.url": updated_src_toArray[i]
                },
                {
                    $set: { "imageHeader.src.$.url": urlFiles }
                }
            )

            // update pic image url 
            await db.collection("projects").updateOne(
                {
                    "_id": ObjectId(id),
                    "imageHeader.pic.url": updated_pic_toArray[i]
                },
                {
                    $set: { "imageHeader.pic.$.url": urlFilesPic }
                }
            )
        }

        // and then update other field except image url
        await db.collection('projects').updateOne({ "_id": ObjectId(id) }, {
            $set: payload
        })

    }

    res.status(200).send(id);
}

export async function getPosts(req, res) {
    const database = db.collection('posts').find({});
    const posts = await database.toArray();

    res.status(200).send(posts);
}

export async function getPost(req, res) {
    const database = db.collection('posts').find(ObjectId(req.params.id));
    const post = await database.toArray();

    res.status(200).send(post[0]);
}

export async function getProjects(req, res) {
    const database = db.collection('projects').find({});
    const projects = await database.toArray();

    res.status(200).send(projects);
}

export async function getProject(req, res) {
    const database = db.collection('projects').find(ObjectId(req.params.id));
    const project = await database.toArray();

    res.status(200).send(project)
}

export async function deleteProject(req, res) {
    const { id } = req.params;
    const getProject = db.collection("projects").find(ObjectId(id));
    const project = await getProject.toArray();

    const dirname = path.resolve();
    const directory = dirname + "/upload/images/";

    for(let i = 0; i < project[0].imageHeader.src.length; i++) {
        fs.unlink(directory + project[0].imageHeader.src[i].url.split('/')[5], (err) => {console.log(err)});
        fs.unlink(directory + project[0].imageHeader.pic[i].url.split('/')[5], (err) => {console.log(err)});
    }
    await db.collection('projects').deleteOne({ "_id": ObjectId(id) });

    res.status(200).send(id);
}

export async function deletePost(req, res) {
    const { id } = req.params;
    const getPost = db.collection("posts").find(ObjectId(id));
    const post = await getPost.toArray();

    const imageFilename = post[0].imageHeader.split("/")[5];
    const picFilename = post[0].imagePic.split("/")[5];
    const dirname = path.resolve();
    const directory = dirname + "/upload/images/"
    fs.unlink(directory + imageFilename, (err) => {console.log(err)});
    fs.unlink(directory + picFilename, (err) => {console.log(err)});

    await db.collection('posts').deleteOne({ "_id": ObjectId(id) });
    res.status(200).send(id);
}

export async function addPost(req, res) {

}