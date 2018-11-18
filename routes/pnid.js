/*

admin.js -
file for handling admin api.

*/

// imports
const router = require('express').Router();
const passport = require('passport');
const userMiddleware = require('../middleware/authentication');
const apiHelper = require('../helpers/api');
const config = require('../config.json');
const Recaptcha = require('express-recaptcha').Recaptcha;
const recaptcha = new Recaptcha(config.recaptcha.siteKey, config.recaptcha.secretKey);

// database models
const PNID = require('../models/pnid');

// renders register page
router.get('/pnid/register', recaptcha.middleware.render, (req, res) => {
	res.render('register', { captcha: res.recaptcha });
});
// renders login page
router.get('/pnid/login', (req, res) => {
	res.render('login');
});
// renders pnid dashboard
router.get('/pnid/dashboard', userMiddleware.pnidAuthNeeded, (req, res) => {
	res.render('dashboard');
});

/* 
*	/api/v1/login
*
*	signs user in
*
*	post {
*		email
*		password
*	}
*	return {
*		code: http code
*		success: boolean
*		username: undefined | string - only if login was successfull
*		role: undefined | string - role of user if login was successfull
*		errors: Strings[messages] - not yet :(
*	}
*/
// TODO make login somehow display errors in correct format.
// middleware does the authentication work. this just returns a success
router.post('/api/v1/login', passport.authenticate('PNIDStrategy'), function (req, res) {
	apiHelper.sendReturn(res, {
		email: req.user.email,
		email_validated: req.user.email_validated,
		pnid: req.user.pnid.key
	});
});

/* 
*	/api/v1/register
*
*	registers a new admin user
*
*	post {
*		username
*		password
*	}
*	return {
*		code: httpcode
*		success: boolean - true if register was successull
*		username: undefined | string - username if register was successfullW
*		errors: Strings[messages]
*	}
*/
router.post('/api/v1/register', recaptcha.middleware.verify, async (req, res) => {
	if (!req.body) {
		// no post body
		apiHelper.sendApiGenericError(res);
		return;
	}
	/*if (req.recaptcha.error) {
		apiHelper.sendApiError(res, 500, ['Captcha error']);
		return;
	}*/

	const { email, password } = req.body;
	const newUser = new PNID.PNIDModel({
		email,
		password,
		pnid: {
			key: 'abcd',
			pid: await PNID.PNIDModel.generatePID()
		}
	});

	// TODO verify password
	
	// saving to database
	newUser.save().then((user) => {
		apiHelper.sendReturn(res, {
			email: user.email,
			email_validated: user.email_validated,
			pnid: user.pnid.key
		});
		return;
	}).catch((rejection) => {
		// TODO format exception so it doesnt have a huge list of errors
		console.log(rejection);
		apiHelper.sendApiError(res, 500, [rejection]);
		return;
	});
});

// export the router
module.exports = router;
