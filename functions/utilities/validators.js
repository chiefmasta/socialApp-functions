const isEmpty = string => {
    if (string.trim() === "") return true;
    else return false;
};

const isEmailValid = email => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(regEx)) return true;
    else return false;
};

exports.validateSignUpData = data => {
    let errors = {};

    if (isEmpty(data.email)) {
        errors.email = "Email must not be empty";
    } else if (!isEmailValid(data.email)) {
        errors.email = "Email must be a valid email adress";
    }

    if (isEmpty(data.password)) errors.password = "Password must not be empty";
    if (data.password !== data.confirmPassword)
        errors.confirmPassword = "Passwords must be the same";

    if (isEmpty(data.handle)) errors.handle = "Handle must not be empty";

    if (Object.keys(errors).length > 0) return res.status(400).json(errors);

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    };
};

exports.validateLogInData = data => {
    let errors = {};

    if (isEmpty(user.email)) errors.email = "Email must not be empty";
    if (isEmpty(user.password)) errors.password = "Password must not be empty";

    if (Object.keys(errors).length > 0) return res.status(400).json(errors);

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    };
};

module.exports = { isEmpty, isEmailValid };
