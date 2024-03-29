import { v4 as uuidv4 } from "uuid";

import { SignIn } from "../../db/models";
import handleErrors from "../../lib/error_handler";

/** 
 * @param {Object} new_sign_in_info
 * 
 * @returns {Boolean}
 */
const createASignIn = async (new_sign_in_info) => {
  const validated_sign_in_info = validateSignInInfo(new_sign_in_info);

  // Make sure to use uuidv4() to generate a unique id.
  validated_sign_in_info.id = uuidv4();

  const sign_in = await SignIn.create(validated_sign_in_info);

  await sign_in.createSignIn();

  // Return a true if the sign in was created successfully.
  if (sign_in) {
    return true;
  }

  return false;
};

/**
 * Get all the sign ins. This will include the user information.
 * 
 * @returns {Array} sign_ins
 */
const getAllSignIns = async () => {
  const sign_ins = await SignIn.findAll();

  sign_ins.forEach(sign_in => {
    const user = getUserOfSignIn(sign_in.sign_in_id);

    sign_in.user = user;

    return sign_in;
  });

  return sign_ins;
};

/**
 * @param {string} sign_in_id 
 * 
 * @returns {Array|Object|null} user
 */
const getUserOfSignIn = async (sign_in_id) => {
  const sign_in = await SignIn.findByPk(sign_in_id);

  const user = await sign_in.getUser();

  return user;
};

/**
 * @param {Object} info
 * 
 * @returns {Boolean}
 */
const validateSignInInfo = (info) => {
  const { email, password } = info;

  if (!email || !password) {
    return false;
  }

  return true;
};

/**
 * GET will get all the sign ins and the users who signed in each time.
 * 
 * POST will create a new sign in.
 * 
 * @param {Object} req
 * @param {Object} res
 */
export default function handler(req, res) {
  const { method } = req;

  if (method === "GET") {
    const all_sign_ins = getAllSignIns();

    res.status(200).json({
      signins: all_sign_ins,
      route: "signins"
    });
  } else if (method === "POST") {
    const info = req.body;

    const is_note_created = createASignIn(info);

    res.status(200).json({ 
      route: "signins",
      note_created: is_note_created
    });
  }

  // If the method is not GET or POST, return a 405 error.
  handleErrors(res, 405, "Method not allowed", "signins");
  
  res.status(405).json({
    error: "Method not allowed",
    route: "signins"
  });
};
