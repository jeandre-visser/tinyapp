const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.use(express.urlencoded({ extended: true }));

const cookieSession = require('cookie-session');
const { response } = require("express");
app.use(cookieSession({
  name: 'session',
  secret: 'this-is-my-secret',
}))

const bcrypt = require('bcryptjs');

// EJS template
app.set("view engine", "ejs");

// helper functions
const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers')


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// stores users
const users = {};

const urlDatabase = {};


// ROUTING

// redirect from tiny url to long url 
app.get("/u/:id", (req, res) => {

  if (urlDatabase[req.params.id]) {
    res.redirect(urlDatabase[req.params.id].longURL);
  } else {
    const errorPage = 'The tiny URL does not exist.'
    res.status(404).render('error', {user: users[req.session.user_id], errorPage});
  }
});

// Allows us to render a new website URL and displays it with the urls_new template
// check to see if user is logged in before showing urls/new page
app.get("/urls/new", (req, res) => {
  if(req.session.user_id) {
    const templateVars = {
      user: users[req.session.user_id]
    }
    res.render('urls_new', templateVars)
  } else {
    res.redirect('/login');
  }
});

// deletes url after checking if the user owns the url
app.post('/urls/:id/delete', (req, res) => {
  const id = req.params.id;
  if (req.session.user_id && req.session.user_id === urlDatabase[id].userId) {
    delete urlDatabase[id];
    res.redirect('/urls')
  } else {
    const errorPage = 'User authorization denied.';
    res.status(401).render('error', {user: users[req.session.user_id], errorPage})
  }
});

// edits longURL and makes sure user owns the url
app.post('/urls/:id/', (req, res) => {
  const id = req.params.id;
  if (req.session.user_id && req.session.user_id === urlDatabase[id].userId) {
    urlDatabase[id].longURL = req.body.updatedURL;
    res.redirect('/urls/')
  } else {
    const errorPage = 'User authorization denied.'
    res.status(401).render('error', {user: users[req.session.user_id], errorPage})
  }

})

// login functionality
app.post('/login', (req, res) => {
  const user = getUserByEmail(req.body.email, users)

  if (user && bcrypt.compareSync(req.body.password, user.password)) {
      req.session.user_id = user.userID
      res.redirect('/urls')
  } else if (req.body.email === '' || req.body.password === ''){
    const errorPage = 'Please do not leave login field blank.'
    res.status(401).render('error', {user: users[req.session.user_id], errorPage})
  } else {
    const errorPage = 'Invalid login information.'
    res.status(401).render('error', {user: users[req.session.user_id], errorPage})
  }
});

// Creates new url and adds to urlDatabase
// redirects to urls_show
app.post("/urls", (req, res) => {

  if (req.session.user_id) {
    const newId = generateRandomString();
    urlDatabase[newId] = {
      longURL: req.body.longURL,
      userId: req.session.user_id
      };
      console.log(urlDatabase)
    res.redirect(`/urls/${newId}`); 
  } else {
    const errorPage = 'In order to create a URL, you must first be logged in.';
    res.status(401).render('error', {user: users[req.session.user_id], errorPage})
  }
});

// logout endpoint
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login')
});

// Displays short URL and long URL
app.get("/urls/:id", (req, res) => {
  const id = req.params.id
  const userID = req.session.user_id;
  const userUrls = urlsForUser(userID, urlDatabase);
  console.log("userUrls", userUrls)
  const templateVars = {
    id,
    urls: userUrls,
    user: users[userID] 
  };
 // error handlers for if the user is not logged in or does not own url
  if (!urlDatabase[id]) {
    const errorPage = 'The tiny URL does not exist.';
    res.status(404).render('error', {user: users[userID], errorPage});
  } else if (!userID || !userUrls[id]) {
    const errorPage = 'User authorization to view URL denied.';
    res.status(401).render('error', {user: users[userID], errorPage});
  } else {
    res.render('urls_show', templateVars)
  }
});

// login page
// if logged in already, redirect to urls page
app.get('/login', (req, res) => {
  if (req.session.user_id) {
    return res.redirect('/urls');
  }

  const templateVars = {
    user: users[req.session.user_id]
  }
  res.render('login', templateVars)
});

// registration page
// if logged in already, redirect to urls page
app.get('/register', (req, res) => {
  if (req.session.user_id) {
    return res.redirect('/urls');
  }

  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render('urls_register', templateVars)
});


// If logged in, displays our urls in the urlDatabase by using urls_index template
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const userUrls = urlsForUser(userID, urlDatabase)
  const templateVars = {
    user: users[userID],
    urls: userUrls
  };
  // if not logged in, show error for urls page
  if (!userID) {
    const errorPage = 'You must first be logged in to view URLs.'
      res.status(400).render('error', {user: users[req.session.user_id], errorPage})
  }
  res.render("urls_index", templateVars);
});

// redirect to urls if logged in, otherwise go to login page
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login')
  }
});

// handles the registration form data
app.post('/register', (req, res) => {

  if (req.body.email && req.body.password) {
    if (!getUserByEmail(req.body.email, users)) {
      const userID = generateRandomString();
      users[userID] = {
        userID,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10)
      };
      req.session.user_id = userID;
      res.redirect('/urls');
    } else {
      const errorPage = 'That email already exists.'
      res.status(400).render('error', {user: users[req.session.user_id], errorPage})
    }
  } else {
    const errorPage = 'Please do not leave empty email and/or password fields.'
    res.status(400).render('error', {user: users[req.session.user_id], errorPage})
  }
});