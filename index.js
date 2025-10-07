//Add import statements
import express from "express";
import bodyParser from "body-parser";
import methodOverride from 'method-override';
import pg from "pg";
import ejs from "ejs";

//set up express and the port
const app = express();
const port = 3000;
app.engine("ejs", ejs.__express);

//connect to database
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "BlogDB",
  password: "darkgreyseaslug1234",
  port: 5432,
});
db.connect();


//tell express what folder the static files are, make them accessible with relative urls
app.use(express.static("public"));
//parse data that is recieved
app.use(bodyParser.urlencoded({ extended: true }));


app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      var method = req.body._method
      console.log(method,req.body._method)
      delete req.body._method
      return method
    }
  }))

//set up tags variables to be used later
var tags = ["all" ,"tech", "lifestyle", "local", "diy", "art", "gardening", "sports"];

//function to get posts 
async function getPosts() {
  const result = await db.query("SELECT * FROM blogs");
  const posts = result.rows.map((post) => ({
    name: post.creator_name,
    title: post.title,
    content: post.body,
    time: post.time_updated,
    initTime: post.date_created,
    id: post.blog_id,
    tag: post.tag,
    creator_id: post.creator_user_id,
  }));
  return posts;
}
let currentUserId;
let currentUserName; 

//standard home page render, send blog post, tags list, and current page
app.get("/", async (req, res) => {
  var blogPosts = await getPosts();
  //const currentUser = await getCurrentUser();
  res.render("index.ejs", {blogPosts: blogPosts, tags:tags, currentPage: 'index'});
});

//render login page
app.get("/login", (req, res) => {
  res.render("login.ejs", { error: '' });
});

//render registration page
app.get("/register", (req, res) => {
  res.render("register.ejs", { error: '' });
});

app.post("/register", async (req, res) => {
  const userName = req.body.username;
  const userId = req.body.user_id;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE user_id = $1", [
      userId,
    ]);

    if (checkResult.rows.length > 0) {
      res.render("register.ejs", { error: "User ID already exists. Try logging in" });
    } else {
      await db.query(
        "INSERT INTO users (user_id, password, name) VALUES ($1, $2, $3)",
        [userId, password, userName]
      );
      currentUserId = userId;
      currentUserName = userName; 
      return res.redirect("/");
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", async (req, res) => {
  const userId = req.body.user_id;
  const password = req.body.password;

  try {
    const result = await db.query("SELECT * FROM users WHERE user_id = $1", [
      userId,
    ]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedPassword = user.password;

      if (password === storedPassword) {
        currentUserId = user.user_id;
        currentUserName = user.name;
        res.redirect("/");
      } else {
        res.render("login.ejs", { error: "Incorrect password" });
      }
    } else {
      res.render("login.ejs", { error: "User not found" });
    }
  } catch (err) {
    console.log(err);
  }
});

//render make blog post page
app.get("/form", (req, res) => {
  res.render("form.ejs", {tags:tags});
});

//if the home button is clicked, redirect to home page render
app.get("/clickHome", (req, res) => {
  return res.redirect('/');
});

//submit a blog post, then go back to home page
app.post('/submitPost', async (req, res) => {
    //retrieve name, title, content, and tag from form
    const creatorName = currentUserName;//GET FROM DB HELP
    const creatorID = currentUserId;//GET FROM DB HELP
    const blogTitle = req.body.blogTitle;
    const content = req.body.content;
    const tagName = req.body.tagName.toLowerCase();

    //add post to DB
    const result = await db.query(
      "INSERT INTO blogs (creator_name, creator_user_id, title, body, date_created, time_updated, tag ) VALUES ($1, $2, $3, $4, NOW(), NOW(), $5);",
      [creatorName, creatorID, blogTitle, content, tagName]
    );
    
    //redirect to home page
    return res.redirect('/');
});

//go to the edit page with a particular post
app.get("/edit/:id", async (req, res) => {
    var post = {};
    //find the original post by id
    const result = await db.query("SELECT * FROM blogs WHERE blog_id = $1", [
      req.params.id,
    ]);
    if (result.rows.length > 0) {
      const gotPost = result.rows[0];
      if (gotPost.creator_user_id !== currentUserId){
        return res.redirect('/');
      }
      post = {name: gotPost.creator_name, title: gotPost.title, content: gotPost.body, time: gotPost.time_updated, initTime: gotPost.date_created, id: gotPost.blog_id, tag: gotPost.tag};
    } else{
      return res.redirect('/');
    }
  //remder the edits page using the post found to pre-fill in the inputs
  return res.render("edit.ejs", { blogPost: post, tags:tags });
});

//submit edits to a post, then go redirect to home
app.post('/edit-form/:id', async (req, res) => {
    var post;
    //find the original post by id
    const result = await db.query("SELECT * FROM blogs WHERE blog_id = $1", [
      req.params.id,
    ]);
    if (result.rows.length > 0) {
      post = result.rows[0];
    }
    //if the post is found, update it
    if(post)
    {
        //get updated title content and tag
        var id = req.params.id;
        var title = req.body.blogTitle;
        var content = req.body.content;
        const tagName = req.body.tagName?.toLowerCase() || 'all';

        //add post to DB
        await db.query(
          "UPDATE blogs \
          SET title = $1, body = $2, time_updated = NOW(), tag = $3 \
          WHERE blog_id = $4;",
          [title, content, tagName, id]
        );
    }

    //redirect home
    return res.redirect('/');
});

//if the user chooses a tag from the dropdown to sort by and clicks the
//go! submit button, show only correctly tagged posts on home page
app.post("/tagSort", (req, res) => {
  //get tag from request, if all show all blog posts
  
  const pickedTag = req.body.tag.toLowerCase();
  var taggedPosts = [];
  if (pickedTag == "all"){
      taggedPosts = blogPosts;
  //else, show only those with the tag using filter
  }else{
      taggedPosts = blogPosts.filter(p => p.tag == pickedTag);
  }
  
  //render home page with filtered posts 'taggedPosts' as tags
  return res.redirect("/");
});

//if the delete button on a post is clicked, delete it and redirect home
app.delete('/delete', async (req, res) => {
    //get id number of post to delete from param
    //and remove it from blogPosts with filter
    const idNum = parseInt(req.body.id);
    //delete post from DB
    await db.query(
      "DELETE FROM blogs \
      WHERE blog_id = $1;",
      [idNum]
   );
    return res.redirect('/');
});

//start the Express server
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});