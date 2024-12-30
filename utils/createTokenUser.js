export const createTokenUser = (user) => {
    return {firstname: user.firstname, email:user.email, userID: user._id, roles: user.roles, passport_url: user.passport, randomId: user.randomId};
}