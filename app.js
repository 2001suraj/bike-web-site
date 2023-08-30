const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const session = require('express-session');
const flash = require('express-flash');

//file
const multer = require('multer');
const fs = require('fs');
const path = require('path');

//bike
const sequelize = require('./db');
const Bike = require('./models/bike');
//user
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: '123suraj123suraj',
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });



//user
const User = require('./models/user');
passport.use(new LocalStrategy(async(username, password, done) => {
    try {
        const user = await User.findOne({ where: { username } });

        if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return done(null, false, { message: 'Incorrect password.' });
        }

        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));






passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async(id, done) => {
    try {
        const user = await User.findByPk(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});





let bikes = [];

app.get('/', async(req, res) => {
    const user = req.user;
    const bikes = await Bike.findAll();
    res.render('index', { bikes, user });
});




app.get('/bikes', async(req, res) => {
    try {
        const user = req.user;
        const bikes = await Bike.findAll();

        if (user) {

            res.render('bikes', { bikes, user });
        } else {
            res.render('login');
        }


    } catch (error) {
        console.error('Error fetching bikes:', error);
        res.status(500).send('Error fetching bikes');
    }
});



app.get('/bikes/new', (req, res) => {
    res.render('add-bike');
});
app.post('/bikes', upload.single('photo'), async(req, res) => {
    const { name, description, price } = req.body;
    const photo = req.file ? req.file.filename : null;

    try {
        const createdBike = await Bike.create({
            name: name,
            description: description,
            photo: photo,
            price: price,


        });

        console.log('Bike created:', createdBike);
        res.redirect('/bikes');
    } catch (error) {
        console.error('Error creating bike:', error);
        res.status(500).send('Error creating bike');
    }
});



app.get('/bikes/:id', async(req, res) => {
    try {
        const bikeId = req.params.id;
        const bike = await Bike.findByPk(bikeId);

        if (!bike) {
            return res.status(404).render('404.ejs');
        }

        res.render('individual-bike.ejs', { bike });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/bikes/:id/edit', async(req, res) => {
    const bikeId = req.params.id;
    try {
        const bike = await Bike.findByPk(bikeId);
        res.render('edit-bike', { bike, bikeId });
    } catch (error) {
        console.error('Error fetching bike for edit:', error);
        res.status(500).send('Error fetching bike for edit');
    }
});


app.post('/bikes/:id/update', upload.single('photo'), async(req, res) => {
    const bikeId = req.params.id;
    const { name, description, price } = req.body;
    const newPhoto = req.file ? req.file.filename : null;

    try {
        const bike = await Bike.findByPk(bikeId);

        if (!bike) {
            return res.status(404).send('Bike not found');
        }

        bike.name = name;
        bike.description = description;
        bike.price = price;

        if (newPhoto) {
            // Delete the old photo file if it exists
            if (bike.photo) {
                fs.unlinkSync(path.join('public/uploads', bike.photo));
            }
            bike.photo = newPhoto;
        }

        await bike.save();

        res.redirect('/bikes');
    } catch (error) {
        console.error('Error updating bike:', error);
        res.status(500).send('Error updating bike');
    }
});





app.post('/bikes/:id/delete', async(req, res) => {
    const bikeId = req.params.id;
    try {
        await Bike.destroy({ where: { id: bikeId } });
        res.redirect('/bikes');
    } catch (error) {
        console.error('Error deleting bike:', error);
        res.status(500).send('Error deleting bike');
    }
});

app.get('/contact', (req, res) => {
    res.render('contact');
});




app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/about', (req, res) => {
    res.render('about');
});




app.post('/signup', async(req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username: username,
            email: email,
            password: hashedPassword
        });
        res.redirect('/login');
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send('An error occurred while creating the user.');
    }
});


app.get('/login', (req, res) => {
    res.render('login', );
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/bikes',
    failureRedirect: '/login',
    failureFlash: true
}));
app.get('/logout', (req, res) => {

    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Internal Server Error');
        }

        res.redirect('/login');
    });
});


// Sync models with the database
sequelize.sync()
    .then(() => {
        console.log('Database synced');
    })
    .catch((error) => {
        console.error('Error syncing database:', error);
    });


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});