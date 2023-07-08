import passport from "passport";
import local from "passport-local";
import { createHash, isValidPassword } from "../utils.js";
import { userModel } from "../dao/models/users.model.js";
const LocalStrategy = local.Strategy;
import GitHubStrategy from "passport-github2";
import fetch from "node-fetch";

export function initializePassport() {
  passport.use(
    "login",
    new LocalStrategy(
      { usernameField: "email" },
      async (username, password, done) => {
        try {
          const user = await userModel.findOne({ email: username });

          if (!user) {
            return done(null, false, { message: "Usuario no encontrado" });
          }
          if (!isValidPassword(password, user.password)) {
            return done(null, false, { message: "Contraseña incorrecta" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.use(
    "register",
    new LocalStrategy(
      { passReqToCallback: true, usernameField: "email" },
      async (req, username, password, done) => {
        try {
          const { email, firstName, lastName } = req.body;
          let user = await userModel.findOne({ email: username });
          if (user) {
            return done(null, false, { message: "El usuario ya existe" });
          }

          const newUser = {
            email,
            firstName,
            lastName,
            isAdmin: false,
            password: createHash(password),
          };

          let userCreated = await userModel.create(newUser);
          return done(null, userCreated, { message: "Usuario creado" });
        } catch (error) {
          return done(error, { message: "Error al crear el usuario" });
        }
      }
    )
  );

  passport.use(
    "github",
    new GitHubStrategy(
      {
        clientID: "f204eecbd7ffacc28d0a",
        clientSecret: "1cdb32394207556b2f349ce3c21f8cbb8ec199f3",
        callbackURL: "http://localhost:8080/api/sessions/githubcallback",
      },
      async (accessToken, _, profile, done) => {
        console.log(profile);
        try {
          console.log(profile);
          const res = await fetch("https://api.github.com/user/emails", {
            headers: {
              Accept: "application/vnd.github+json",
              Authorization: "Bearer " + accessToken,
              "X-Github-Api-Version": "2022-11-28",
            },
          });
          const emails = await res.json();
          const emailDetail = emails.find((email) => email.verified == true);

          if (!emailDetail) {
            return done(new Error("Correo electrónico inválido"));
          }
          profile.email = emailDetail.email;

          let user = await userModel.findOne({ email: profile.email });
          if (!user) {
            const newUser = {
              email: profile.email,
              firstName: profile._json.name || profile._json.login || "noname",
              lastName: "externalAuth",
              isAdmin: false,
              password: "nopass",
            };
            let userCreated = await userModel.create(newUser);
            console.log("Usuario registrado exitosamente");
            return done(null, userCreated);
          } else {
            console.log("El usuario ya existe");
            return done(null, user);
          }
        } catch (e) {
          console.log("Error de autenticación en GitHub");
          console.log(e);
          return done(e);
        }
      }
    )
  );
}

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  let user = await userModel.findById(id);
  done(null, user);
});