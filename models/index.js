import Sequelize from 'sequelize';

import { User } from "./User";
import { Media } from "./Media";
import { Note } from "./Note";
import { Project } from "./Project";
import { Signin } from "./Signin";
import { Timer } from "./Timer";
import sequelize from "../lib/db-related/seq_connect";

const db = {
  sequelize,
  Sequelize
};

db["User"] = User;
db["Media"] = Media;
db["Note"] = Note;
db["Project"] = Project;
db["Signin"] = Signin;
db["Timer"] = Timer;

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

export default db;
