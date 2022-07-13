const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.use(express.urlencoded({ extended: true }));

const cookieParser = require('cookie-parser')
app.use(cookieParser())

// EJS template
app.set("view engine", "ejs");

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  let randomStr = Math.random().toString(36).substring(6);
  if (randomStr.length !== 6) {
    randomStr = generateRandomString();
  }
  return randomStr;
}

// stores users
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


// ROUTING

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if (longURL) {
  res.redirect(longURL);
  } else {
    res.status(404);
  }
});

// Allows us to render a new website URL and displays it with the urls_new template
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["userId"]]
  }
  res.render("urls_new", templateVars);
});

// delete url
app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id]
  res.redirect('/urls')
})

// edit request
app.post('/urls/:id/', (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL
  res.redirect('/urls')
})

// login functionality
app.post('/login', (req, res) => {
  res.cookie('username', req.body.username)
  res.redirect('/urls')
})

// Generates short URL that is added to database and redirected to urls/:id
app.post("/urls", (req, res) => {
  let newId = generateRandomString();
  urlDatabase[newId] = req.body.longURL;
  res.redirect(`urls/${newId}`); 
});

// logout endpoint
app.post('/logout', (req, res) => {
  res.clearCookie('username')
  res.redirect('/urls')
})

// Displays short URL and long URL
app.get("/urls/:id", (req, res) => {
  const templateVars = { 
    id: req.params.id, 
    longURL: urlDatabase[req.params.id], 
    user: users[req.cookies["userId"]] 
  };
  res.render("urls_show", templateVars);
});

// registration page
app.get('/register', (req, res) => {
  const templateVars = {
    user: users[req.cookies['userId']]
  };
  res.render('urls_register', templateVars)
})

// handles the registration form data
app.post('/register', (req, res) => {
  const userId = generateRandomString();
  users[userId] = {
    userId,
    email: req.body.email,
    password: req.body.password
  }
  res.cookie('user_id', userId);
  res.redirect('/urls')
})

// Displays our urls in the urlDatabase by using urls_index template
app.get("/urls", (req, res) => {
  const templateVars = {
    user: users[req.cookies["userId"]],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});
