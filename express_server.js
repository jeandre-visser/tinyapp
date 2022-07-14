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
const { getUserByEmail, generateRandomString } = require('./helpers')


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
    const templateVars = {
      user: users[req.session.user_id],
      urlDatabase: {},
      id: ''
    }
    res.status(404);
    res.render('urls_show', templateVars)
  }
});

// Allows us to render a new website URL and displays it with the urls_new template
// check to see if user is logged in before showing urls/new page
app.get("/urls/new", (req, res) => {
  if(req.session['user_id']) {
    const templateVars = {
      user: users[req.session['user_id']]
    }
    res.render('urls_new', templateVars)
  } else {
    res.redirect('/login');
  }

  res.render("urls_new", templateVars);
});

// deletes url after checking if the user owns the url
app.post('/urls/:id/delete', (req, res) => {
  if (req.session['user_id'] === urlDatabase[id].userID) {
    delete urlDatabase[req.params.id]
  }

  res.redirect('/urls')
})

// edits longURL and makes sure user owns the url
app.post('/urls/:id/', (req, res) => {
  if (req.session['user_id'] === urlDatabase[id].userID) {
    urlDatabase[req.params.id].longURL = req.body.updatedURL;
  }

  res.redirect(`/urls/${id}`)
})

// login functionality
app.post('/login', (req, res) => {
  const user = getUserByEmail(req.body.email, users)

  if (user) {
    if(bcrypt.compareSync(req.body.password, user.password)) {
      res.session('user_id', user.userId)
      res.redirect('/urls')
    } else {
      res.status(403);
      res.send('You have entered the incorrect password.');
    }
  } else {
    res.status(403);
    res.send('That email address could not be found.')
  }
});

// Creates new url and adds to urlDatabase
// redirects to urls_show
app.post("/urls", (req, res) => {
  const newId = generateRandomString();
  urlDatabase[newId] = {
  longURL: req.body.longURL,
  userId: req.session['user_id']
  }
  res.redirect(`/urls/${newId}`); 
});

// logout endpoint
app.post('/logout', (req, res) => {
  res.clearCookie('session')
  res.clearCookie('session.sig')
  res.redirect('/urls')
});

// Displays short URL and long URL
app.get("/urls/:id", (req, res) => {
  const userID = req.session['user_id'];
  const userUrls = urlsForUser(userID, urlDatabase);
  const templateVars = {
    id: req.params.id, 
    urls: userUrls,
    user: users[userID] 
  };
  // error handlers for if the user is not logged in or does not own url
  // input error handlers here**

  res.render('urls_show', templateVars);
});

// login page
// if logged in already, redirect to urls page
app.get('/login', (req, res) => {
  if (req.session['user_id']) {
    return res.redirect('/urls');
  }

  const templateVars = {
    user: users[req.session['user_id']]
  }
  res.render('login', templateVars)
});

// registration page
// if logged in already, redirect to urls page
app.get('/register', (req, res) => {
  if (req.session['user_id']) {
    return res.redirect('/urls');
  }

  const templateVars = {
    user: users[req.session['user_id']]
  };
  res.render('urls_register', templateVars)
});


// If logged in, displays our urls in the urlDatabase by using urls_index template
app.get("/urls", (req, res) => {
  const userID = req.session['user_id'];
  const userUrls = urlsForUser(userID, urlDatabase)
  const templateVars = {
    user: users[userID],
    urls: userUrls
  };
  // if not logged in, show error for urls page"
  if (!userID) {
    res.status(401);
    res.send('Error Status 401: Cannot access urls, please login or register.')
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
      const userId = generateRandomString();
      users[userId] = {
        userId,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10)
      };
      res.session('user_id', userId);
      res.redirect('/urls');
    } else {
      res.status(400)
      res.send('Email already registered');
    }
  } else {
    res.status(400);
    res.send("Empty email and/or password fields.")
  }
});
