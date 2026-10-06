const SessionHandler = require("./session");
const ProfileHandler = require("./profile");
const BenefitsHandler = require("./benefits");
const ContributionsHandler = require("./contributions");
const AllocationsHandler = require("./allocations");
const MemosHandler = require("./memos");
const ResearchHandler = require("./research");
const {
    environmentalScripts
} = require("../../config/config");
const rateLimit = require("express-rate-limit");
const ErrorHandler = require("./error").errorHandler;

const LEARNING_RESOURCE_URL = "https://www.khanacademy.org/economics-finance-domain/core-finance/investment-vehicles-tutorial/ira-401ks/v/traditional-iras";

const tutorialTemplate = (page) => {
    switch (page) {
    case "a1":
        return "tutorial/a1";
    case "a2":
        return "tutorial/a2";
    case "a3":
        return "tutorial/a3";
    case "a4":
        return "tutorial/a4";
    case "a5":
        return "tutorial/a5";
    case "a6":
        return "tutorial/a6";
    case "a7":
        return "tutorial/a7";
    case "a8":
        return "tutorial/a8";
    case "a9":
        return "tutorial/a9";
    case "a10":
        return "tutorial/a10";
    case "redos":
        return "tutorial/redos";
    case "ssrf":
        return "tutorial/ssrf";
    case "layout":
        return "tutorial/layout";
    default:
        return "";
    }
};

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "Too many login attempts. Please try again later."
});

const index = (app, db) => {

    "use strict";

    const sessionHandler = new SessionHandler(db);
    const profileHandler = new ProfileHandler(db);
    const benefitsHandler = new BenefitsHandler(db);
    const contributionsHandler = new ContributionsHandler(db);
    const allocationsHandler = new AllocationsHandler(db);
    const memosHandler = new MemosHandler(db);
    const researchHandler = new ResearchHandler(db);

    // Middleware to check if a user is logged in
    const isLoggedIn = sessionHandler.isLoggedInMiddleware;

    //Middleware to check if user has admin rights
    const isAdmin = sessionHandler.isAdminUserMiddleware;

    // The main page of the app
    app.get("/", sessionHandler.displayWelcomePage);

    // Login form
    app.get("/login", sessionHandler.displayLoginPage);
    app.post("/login", loginLimiter, sessionHandler.handleLoginRequest);

    // Signup form
    app.get("/signup", sessionHandler.displaySignupPage);
    app.post("/signup", sessionHandler.handleSignup);

    // Logout page
    app.get("/logout", sessionHandler.displayLogoutPage);

    // The main page of the app
    app.get("/dashboard", isLoggedIn, sessionHandler.displayWelcomePage);

    // Profile page
    app.get("/profile", isLoggedIn, profileHandler.displayProfile);
    app.post("/profile", isLoggedIn, profileHandler.handleProfileUpdate);

    // Contributions Page
    app.get("/contributions", isLoggedIn, contributionsHandler.displayContributions);
    app.post("/contributions", isLoggedIn, contributionsHandler.handleContributionsUpdate);

    // Benefits Page
    app.get("/benefits", isLoggedIn, isAdmin, benefitsHandler.displayBenefits);
    app.post("/benefits", isLoggedIn, isAdmin, benefitsHandler.updateBenefits);
    /* Fix for A7 - checks user role to implement  Function Level Access Control
     app.get("/benefits", isLoggedIn, isAdmin, benefitsHandler.displayBenefits);
     app.post("/benefits", isLoggedIn, isAdmin, benefitsHandler.updateBenefits);
     */

    // Allocations Page
    app.get("/allocations/:userId", isLoggedIn, allocationsHandler.displayAllocations);

    // Memos Page
    app.get("/memos", isLoggedIn, memosHandler.displayMemos);
    app.post("/memos", isLoggedIn, memosHandler.addMemos);

    // Handle redirect for learning resources link
    app.get("/learn", isLoggedIn, (req, res) => {
        if (req.query.url === LEARNING_RESOURCE_URL) {
            return res.redirect(LEARNING_RESOURCE_URL);
        }
        return res.redirect("/dashboard");
    });

    // Handle redirect for learning resources link
    app.get("/tutorial", (req, res) => {
        return res.render("tutorial/a1", {
            environmentalScripts
        });
    });

    app.get("/tutorial/:page", (req, res) => {
        const template = tutorialTemplate(req.params.page);
        if (!template) {
            return res.redirect("/tutorial");
        }
        return res.render(template, {
            environmentalScripts
        });
    });

    // Research Page
    app.get("/research", isLoggedIn, researchHandler.displayResearch);

    // Error handling middleware
    app.use(ErrorHandler);
};

module.exports = index;
