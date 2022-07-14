const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.use(express.urlencoded({ extended: true }));

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
const { response } = require("express");
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

// find user with email in database
const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return null;
}

// returns the URLs where the userID is equal to the id of the currently logged-in user
const urlsForUser = (id, database) => {
  let userUrls = {};
  for (const tinyUrl in database) {
    if (database[tinyUrl].userID === id) {
      userUrls[tinyUrl] = database[tinyUrl]
    }
  }
  return userUrls;
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

const urlDatabase = {};


// ROUTING

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if (longURL) {
  res.redirect(longURL);
  } else {
    res.status(404);
    res.send('The tiny URL was not found.')
  }
});

// Allows us to render a new website URL and displays it with the urls_new template
// check to see if user is logged in before showing urls/new page
app.get("/urls/new", (req, res) => {
  if(req.cookies['user_id']) {
    const templateVars = {
      user: users[req.cookies['user_id']]
    }
    res.render('urls_new', templateVars)
  } else {
    res.redirect('/login');
  }

  res.render("urls_new", templateVars);
});

// deletes url after checking if the user owns the url
app.post('/urls/:id/delete', (req, res) => {
  if (req.cookies['user_id'] === urlDatabase[id].userID) {
    delete urlDatabase[req.params.id]
  }

  res.redirect('/urls')
})

// edits longURL and makes sure user owns the url
app.post('/urls/:id/', (req, res) => {
  if (req.cookies['user_id'] === urlDatabase[id].userID) {
    urlDatabase[req.params.id].longURL = req.body.updatedURL;
  }

  res.redirect(`/urls/${id}`)
})

// login functionality
app.post('/login', (req, res) => {
  const user = getUserByEmail(req.body.email, users)

  if (user) {
    if(req.body.password === user.password) {
      res.cookie('user_id', user.userId)
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
app.post("/urls", (req, res) => {
  const newId = generateRandomString();
  urlDatabase[newId] = {
  longURL: req.body.longURL,
  userId: req.cookies['user_id']
  }
  res.redirect(`/urls/${newId}`); 
});

// logout endpoint
app.post('/logout', (req, res) => {
  res.clearCookie('user_id')
  res.redirect('/urls')
});

// Displays short URL and long URL
app.get("/urls/:id", (req, res) => {
  const userID = req.cookies['user_id'];
  const userUrls = urlsForUser(userID, urlDatabase);
  const templateVars = {
    id: req.params.id, 
    urls: userUrls,
    user: users[userID] 
  };
  res.render('urls_show', templateVars);
});

// login page
// if logged in already, redirect to urls page
app.get('/login', (req, res) => {
  if (req.cookies['user_id']) {
    return res.redirect('/urls');
  }

  const templateVars = {
    user: users[req.cookies['user_id']]
  }
  res.render('login', templateVars)
});

// registration page
// if logged in already, redirect to urls page
app.get('/register', (req, res) => {
  if (req.cookies['user_id']) {
    return res.redirect('/urls');
  }

  const templateVars = {
    user: users[req.cookies['user_id']]
  };
  res.render('urls_register', templateVars)
});


// Displays our urls in the urlDatabase by using urls_index template
app.get("/urls", (req, res) => {
  const userID = req.cookies['user_id'];
  const userUrls = urlsForUser(userID, urlDatabase)
  const templateVars = {
    user: users[userID],
    urls: userUrls
  };
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
        password: req.body.password
      };
      res.cookie('user_id', userId);
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
